# Seastar Reactor 模型与事件驱动调度

> 本文系统讲解 Seastar 框架的 Reactor 事件循环模型、Share-Nothing 架构、任务队列调度机制、跨核通信以及 I/O 与定时器的集成方式。适合希望深入理解高性能异步框架内部调度原理的 C++ 开发者阅读。

---

## 1. Reactor 模式概述

### 1.1 什么是 Reactor 模式

Reactor 模式（Reactor Pattern）是一种经典的事件驱动架构（event-driven architecture）。其核心思想非常简洁：**由一个事件循环（event loop）在单线程中运行，负责监听 I/O 事件并将就绪事件分发（dispatch）给对应的处理函数。** 所有任务以协作式（cooperative）方式执行——每个任务主动让出控制权，而非被操作系统强制抢占。

这一模式最早可以追溯到 Douglas C. Schmidt 在 1990 年代提出的 Reactor 论文，后来被广泛应用于 libevent、libuv（Node.js 底层）、Netty（Java NIO 框架）等项目中。Seastar 在此基础上做了更为激进的设计——它不仅使用 Reactor 模式，还将每个 CPU 核心独立为一个完整的、自治的 Reactor 实例，彻底消除线程间共享状态。

### 1.2 传统模型 vs Reactor 模型

在传统的 **thread-per-connection** 模型中，服务器为每个客户端连接创建一个独立的线程。这种方式编程简单直观，但存在显著的性能瓶颈：

```
传统模型：
┌──────────────────────────────────────────┐
│  Thread 1: read(fd1) → process → write   │  ← 阻塞等待 I/O
│  Thread 2: read(fd2) → process → write   │  ← 阻塞等待 I/O
│  Thread 3: read(fd3) → process → write   │  ← 阻塞等待 I/O
│  ...                                     │
│  Thread N: read(fdN) → process → write   │  ← 阻塞等待 I/O
└──────────────────────────────────────────┘
问题：线程数量 = 连接数量，上下文切换开销巨大
```

每个线程在等待 I/O 完成时处于阻塞状态，消耗内核栈空间（通常每个线程 8KB~1MB），频繁的上下文切换（context switch）带来巨大的 CPU cache 污染和调度开销。当连接数达到数千甚至数万时，系统性能急剧下降。

相比之下，Reactor 模型采用完全不同的策略：

```
Reactor 模型：
┌──────────────────────────────────────────┐
│  Single Thread (Event Loop):             │
│    poll_io()                             │
│      → fd1 ready: enqueue continuation   │
│      → fd3 ready: enqueue continuation   │
│    run_tasks()                           │
│      → execute continuation for fd1      │
│      → execute continuation for fd3      │
│    check_timers()                        │
│    ...                                   │
└──────────────────────────────────────────┘
优势：单线程处理所有连接，零上下文切换
```

在 Reactor 模型中，**单个线程通过非阻塞 I/O 和事件轮询（polling）同时管理成千上万的连接**。当某个 I/O 操作完成时，对应的回调函数（在 Seastar 中是 continuation）被加入任务队列，由事件循环在下一轮迭代中执行。整个过程没有线程切换，没有锁竞争，CPU 缓存利用率极高。

### 1.3 协作式调度的本质

Reactor 模型中的任务调度属于 **协作式多任务（cooperative multitasking）**，与操作系统线程的 **抢占式调度（preemptive scheduling）** 形成鲜明对比：

| 特性 | 抢占式调度 | 协作式调度 |
|------|-----------|-----------|
| 调度决策者 | 操作系统内核 | 应用程序自身 |
| 任务切换时机 | 时间片耗尽或更高优先级任务到达 | 任务主动让出（yield） |
| 上下文切换开销 | 高（保存/恢复寄存器、TLB 刷新） | 极低（仅切换函数指针） |
| 数据竞争风险 | 高（需要锁保护共享数据） | 低（单线程内无并发） |
| 编程复杂度 | 需要考虑并发安全 | 需要避免长时间阻塞 |

协作式调度要求每个任务（continuation）执行时间足够短。如果某个任务长时间占用 CPU 不让出，整个 Reactor 就会"卡住"——所有其他任务都会被延迟执行。这就是为什么 Seastar 代码中绝不允许调用阻塞系统调用（如 `read()`、`sleep()`），而必须使用异步版本。

---

## 2. Share-Nothing 架构

### 2.1 每核独立的设计哲学

Seastar 最具创新性的设计之一是其 **Share-Nothing 架构**：每个 CPU 核心运行一个完全独立的 Reactor 实例，各核心之间不共享任何可变状态（mutable state）。这种设计从根本上消除了锁竞争（lock contention）和缓存行弹跳（cache line bouncing）问题。

```
┌─────────────────────────────────────────────────────┐
│                    物理服务器                          │
│                                                     │
│  ┌───────────┐ ┌───────────┐     ┌───────────┐     │
│  │  Core 0   │ │  Core 1   │ ... │  Core N   │     │
│  │           │ │           │     │           │     │
│  │ ┌───────┐ │ │ ┌───────┐ │     │ ┌───────┐ │     │
│  │ │Reactor│ │ │ │Reactor│ │     │ │Reactor│ │     │
│  │ └───────┘ │ │ └───────┘ │     │ └───────┘ │     │
│  │ ┌───────┐ │ │ ┌───────┐ │     │ ┌───────┐ │     │
│  │ │Memory │ │ │ │Memory │ │     │ │Memory │ │     │
│  │ │Alloc  │ │ │ │Alloc  │ │     │ │Alloc  │ │     │
│  │ └───────┘ │ │ └───────┘ │     │ └───────┘ │     │
│  │ ┌───────┐ │ │ ┌───────┐ │     │ ┌───────┐ │     │
│  │ │Network│ │ │ │Network│ │     │ │Network│ │     │
│  │ │Queue  │ │ │ │Queue  │ │     │ │Queue  │ │     │
│  │ └───────┘ │ │ └───────┘ │     │ └───────┘ │     │
│  │ ┌───────┐ │ │ ┌───────┐ │     │ ┌───────┐ │     │
│  │ │Task   │ │ │ │Task   │ │     │ │Task   │ │     │
│  │ │Queue  │ │ │ │Queue  │ │     │ │Queue  │ │     │
│  │ └───────┘ │ │ └───────┘ │     │ └───────┘ │     │
│  │ ┌───────┐ │ │ ┌───────┐ │     │ ┌───────┐ │     │
│  │ │Timer  │ │ │ │Timer  │ │     │ │Timer  │ │     │
│  │ │Set    │ │ │ │Set    │ │     │ │Set    │ │     │
│  │ └───────┘ │ │ └───────┘ │     │ └───────┘ │     │
│  └───────────┘ └───────────┘     └───────────┘     │
│                                                     │
│  核心间通信：仅通过显式消息传递（smp::submit_to）     │
└─────────────────────────────────────────────────────┘
```

### 2.2 每核独占资源

每个 Reactor 核心（在 Seastar 中也称为 **shard**）拥有以下完全独立的资源：

**内存分配器（Memory Allocator）**：Seastar 实现了自己的 per-core 内存分配器。系统启动时，物理内存被均匀分配给各个核心。每个核心在自己的内存区域内进行分配和释放，无需任何锁操作。这比 `glibc` 的 `malloc()` 快得多——后者即使使用了 per-thread arena 优化，仍然存在跨 arena 释放时的锁竞争。

```cpp
// Seastar 内存分配示意（伪代码）
// 每个核心拥有独立的内存池
struct per_core_memory {
    char* base;          // 该核心的内存起始地址
    size_t total_size;   // 分配给该核心的总内存
    free_list allocator; // 无锁空闲链表（单线程访问，无需锁）
};
```

**网络队列（Network Queue）**：当使用 DPDK（Data Plane Development Kit）时，每个核心拥有独立的 NIC 收发队列（RX/TX queue）。网卡通过 RSS（Receive Side Scaling）将不同连接的数据包直接分发到对应核心的队列中，实现真正的零锁网络 I/O。即使在使用 POSIX 网络栈时，Seastar 也通过 `SO_REUSEPORT` 实现连接的核心亲和性（core affinity）。

**任务队列（Task Queue）**：每个核心有自己独立的任务队列系统，用于存放待执行的 continuation。由于只有一个线程访问该队列，所有入队（enqueue）和出队（dequeue）操作都是无锁的。

**定时器集合（Timer Set）**：每个核心维护自己的定时器集合，通常基于时间轮（timer wheel）或优先队列（priority queue）实现。定时器的添加、删除和触发都在本核心内完成。

### 2.3 为什么不共享？

传统多线程程序中，共享状态似乎是不可避免的——多个线程需要访问同一份数据。但 Seastar 的设计理念认为：**共享状态的代价远高于数据分片（sharding）的代价**。

考虑一个简单的共享计数器：

```cpp
// 传统共享方式：需要原子操作或锁
std::atomic<uint64_t> global_counter{0};

void increment() {
    global_counter.fetch_add(1, std::memory_order_relaxed);
    // 即使是 relaxed ordering，原子操作也需要 cache line 在核心间弹跳
    // 在 NUMA 架构下代价更大
}
```

```cpp
// Seastar Share-Nothing 方式：每核本地计数
thread_local uint64_t local_counter = 0; // 实际上是 per-shard

void increment() {
    local_counter++; // 纯本地操作，零开销
}

// 需要全局总数时，通过 map-reduce 汇总
seastar::future<uint64_t> get_total() {
    return seastar::map_reduce(
        boost::irange<unsigned>(0, seastar::smp::count),
        [](unsigned shard) {
            return seastar::smp::submit_to(shard, [] {
                return local_counter;
            });
        },
        uint64_t(0),
        std::plus<uint64_t>()
    );
}
```

在高并发场景下，Share-Nothing 方式的性能优势是压倒性的。即使是 `std::atomic` 的 relaxed 操作，在多核频繁竞争同一 cache line 时，性能也会显著下降。而 Seastar 的 per-core 方案将这些操作完全本地化，只在需要全局聚合时才进行跨核通信。

---

## 3. Reactor 事件循环详解

### 3.1 事件循环的整体结构

Seastar 的 Reactor 事件循环是整个框架的心脏。每个核心上运行的 Reactor 不断执行以下主循环：

```cpp
// Seastar Reactor 主循环（简化伪代码）
void reactor::run() {
    while (_running) {
        // 阶段 1：轮询 I/O 完成事件
        poll_io();

        // 阶段 2：执行就绪的任务（continuations）
        run_tasks();

        // 阶段 3：检查并触发到期的定时器
        check_timers();

        // 阶段 4：如果没有任何工作，考虑让出 CPU
        maybe_yield();
    }
}
```

这个看似简单的循环实际上蕴含了精妙的设计。让我们逐一剖析每个阶段。

### 3.2 阶段一：poll_io() — I/O 轮询

`poll_io()` 负责检查是否有 I/O 操作完成，并将完成的操作转化为可执行的任务。根据不同的 I/O 后端，实现方式有所不同：

```cpp
// poll_io() 内部逻辑（简化伪代码）
void reactor::poll_io() {
    // 对于磁盘 I/O：检查 Linux AIO 或 io_uring 的完成队列
    poll_aio_completions();     // 或 poll_io_uring_completions()

    // 对于网络 I/O：轮询 epoll（POSIX）或 DPDK 收包队列
    poll_network_events();

    // 检查跨核消息队列（smp mailbox）
    poll_smp_queues();

    // 每次轮询完成的 I/O 事件都会 resolve 对应的 promise，
    // 从而将关联的 continuation 推入任务队列
}
```

在使用 **io_uring**（Linux 5.1+）时，Seastar 通过共享内存环形缓冲区（submission queue / completion queue）与内核通信，避免了系统调用的开销。每次 `poll_io()` 只需检查 completion queue 中是否有新条目，如果有，就取出并 resolve 对应的 promise。

在使用 **DPDK** 进行网络 I/O 时，`poll_network_events()` 直接从网卡的 RX 队列中批量取出数据包（burst receive），完全绕过内核网络栈。这是 Seastar 能够实现数百万 QPS 的关键技术之一。

### 3.3 阶段二：run_tasks() — 执行任务

`run_tasks()` 是 Reactor 循环中最核心的阶段。它从任务队列中取出就绪的 continuation 并逐一执行：

```cpp
// run_tasks() 内部逻辑（简化伪代码）
void reactor::run_tasks() {
    while (!_task_queue.empty()) {
        auto task = _task_queue.pop_front();
        task->run_and_dispose();

        // 检查是否需要让出：防止某一批任务独占 CPU 太久
        if (need_preempt()) {
            break;
        }
    }
}
```

这里有一个关键的设计细节：`need_preempt()` 检查。即使任务队列中还有待执行的任务，Reactor 也会定期检查是否已经执行了"足够久"（通常是 0.5ms 的时间片），如果是，就中断任务执行，回到主循环的 `poll_io()` 阶段。这确保了 I/O 事件能被及时处理，不会因为大量的 CPU 密集型 continuation 而导致 I/O 饥饿（I/O starvation）。

```cpp
// need_preempt() 基于时间检查
bool reactor::need_preempt() const {
    // 使用高精度时钟检查是否超过时间片
    return std::chrono::steady_clock::now() >= _preemption_deadline;
}
```

### 3.4 阶段三：check_timers() — 检查定时器

`check_timers()` 遍历当前核心的定时器集合，找出所有已到期的定时器并触发它们：

```cpp
// check_timers() 内部逻辑（简化伪代码）
void reactor::check_timers() {
    auto now = clock_type::now();

    while (!_timer_set.empty() && _timer_set.earliest_deadline() <= now) {
        auto& timer = _timer_set.pop_earliest();
        timer.fire();  // 触发回调，通常是 resolve 一个 promise
    }

    // 更新下一个定时器到期时间，用于优化 poll_io() 的等待时间
    if (!_timer_set.empty()) {
        _next_timer_deadline = _timer_set.earliest_deadline();
    }
}
```

定时器触发后，其关联的回调（通常是 resolve 一个 promise）会将 continuation 推入任务队列，在后续的 `run_tasks()` 中执行。

### 3.5 阶段四：maybe_yield() — 空闲处理

当没有任何 I/O 事件、没有待执行的任务、也没有到期的定时器时，Reactor 进入空闲状态。此时的行为取决于配置：

- **忙轮询模式（busy-polling / polling mode）**：CPU 持续轮询，不进入睡眠。这是 DPDK 场景的默认行为，能实现最低延迟，但 CPU 占用率始终为 100%。
- **休眠模式（idle sleep）**：当没有工作时，通过 `epoll_wait()` 或类似机制让 CPU 进入低功耗状态，直到有新事件到来。这适合非延迟敏感的场景。

```cpp
void reactor::maybe_yield() {
    if (_task_queue.empty() && !has_pending_io()) {
        if (_idle_poll_mode) {
            // 忙轮询：立即返回，继续下一轮循环
            return;
        } else {
            // 休眠：等待 I/O 事件或定时器到期
            auto timeout = _next_timer_deadline - clock_type::now();
            epoll_wait(_epoll_fd, events, max_events, timeout);
        }
    }
}
```

---

## 4. Task Queue 与调度类

### 4.1 调度组（Scheduling Groups）

Seastar 不是简单地使用一个 FIFO 队列来管理所有任务。它引入了 **调度组（scheduling group）** 的概念，允许不同类型的工作负载拥有不同的优先级和 CPU 份额。

例如，在 ScyllaDB 中，以下工作负载被分配到不同的调度组：

- **statements**：处理用户查询请求（最高优先级）
- **compaction**：后台数据压缩（低优先级，但不能饿死）
- **streaming**：节点间数据传输（中等优先级）
- **gossip**：集群元数据同步（低优先级）

```cpp
// 创建调度组
seastar::scheduling_group statement_sg =
    seastar::create_scheduling_group("statements", 1000).get();
seastar::scheduling_group compaction_sg =
    seastar::create_scheduling_group("compaction", 200).get();

// 在指定调度组中执行任务
seastar::with_scheduling_group(statement_sg, [] {
    return handle_user_query();
});

seastar::with_scheduling_group(compaction_sg, [] {
    return run_compaction();
});
```

### 4.2 公平队列调度（Fair Queuing）

Seastar 使用基于 **虚拟时间（virtual time）** 的公平队列算法来调度不同调度组之间的任务。每个调度组有一个权重（shares），Reactor 根据权重比例分配 CPU 时间。

```
调度组调度示意：

statements (shares=1000): ████████████████████░░░░░░░░░░  ~80% CPU
compaction (shares=200):  ████░░░░░░░░░░░░░░░░░░░░░░░░░░  ~16% CPU
gossip     (shares=50):   █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~4%  CPU
```

具体实现上，每个调度组维护一个 **虚拟时间戳（vruntime）**。当一个调度组消耗 CPU 时间时，它的 vruntime 按照 `实际时间 / 权重` 的速率递增。Reactor 总是选择 vruntime 最小的调度组来执行下一批任务。这确保了长期来看，各调度组获得的 CPU 时间与其权重成正比。

```cpp
// 调度组选择逻辑（简化伪代码）
scheduling_group reactor::pick_next_group() {
    scheduling_group* best = nullptr;
    for (auto& sg : _scheduling_groups) {
        if (sg.has_tasks() &&
            (!best || sg.vruntime < best->vruntime)) {
            best = &sg;
        }
    }
    return *best;
}

void reactor::run_tasks() {
    while (has_ready_tasks()) {
        auto sg = pick_next_group();
        auto& queue = sg.task_queue;

        auto start = clock_type::now();
        // 执行该调度组的一批任务
        while (!queue.empty() && !time_slice_exhausted(sg)) {
            auto task = queue.pop_front();
            task->run_and_dispose();
        }
        auto elapsed = clock_type::now() - start;

        // 更新虚拟时间
        sg.vruntime += elapsed / sg.shares;

        if (need_preempt()) break;
    }
}
```

### 4.3 Continuation 的入队过程

当一个 promise 被 resolve 时，其关联的 continuation 并不会被立即执行（inline execution），而是被封装为一个 `task` 对象并推入当前 Reactor 的任务队列：

```cpp
// Promise resolve 时的逻辑（简化伪代码）
template <typename T>
void promise<T>::set_value(T&& value) {
    _state.set(std::move(value));

    if (_continuation) {
        // 关键：不在此处直接调用 continuation！
        // 而是将其加入 Reactor 的任务队列
        auto task = make_task(std::move(_continuation));
        engine().add_task(std::move(task));
    }
}
```

**为什么不直接执行 continuation？** 主要有两个原因：

1. **栈溢出风险（Stack Overflow）**：如果 continuation A resolve 了另一个 promise，而该 promise 的 continuation B 又 resolve 了下一个 promise……这种链式调用如果是同步执行的，会导致调用栈无限增长，最终栈溢出。通过推入任务队列并在主循环中执行，每个 continuation 都从栈底开始，调用栈深度始终可控。

2. **公平性（Fairness）**：如果 continuation 被立即执行，那么一条长链的 continuation 可能会独占 CPU，导致其他任务饥饿。通过入队机制，所有任务公平地竞争执行机会。

---

## 5. Future 与 Reactor 的协作

### 5.1 异步操作的完整生命周期

让我们跟踪一个完整的异步 I/O 操作，理解 future/promise 如何与 Reactor 事件循环协作：

```cpp
// 用户代码
seastar::future<> handle_request(seastar::connected_socket& socket) {
    auto in = socket.input();
    return in.read()                    // 步骤 1：发起异步读取
        .then([](seastar::temporary_buffer<char> buf) {  // 步骤 4：处理结果
            std::cout << "Received: " << buf.size() << " bytes\n";
        });
}
```

这段简短代码的幕后经历了以下步骤：

```
时间线：

1. handle_request() 被调用
   → in.read() 创建一个 promise/future 对，并提交一个异步读操作到内核
   → .then() 将 lambda 作为 continuation 注册到 future 上
   → handle_request() 返回一个 future（此时还是 pending 状态）
   → 控制权回到 Reactor 事件循环

2. Reactor 继续执行其他任务 ...
   → run_tasks(): 执行其他就绪的 continuations
   → check_timers(): 触发到期的定时器
   → poll_io(): 检查 I/O 完成

3. poll_io() 发现读操作完成
   → 取出完成事件
   → 调用 promise.set_value(data)
   → continuation（.then 中的 lambda）被推入任务队列

4. 下一轮 run_tasks()
   → 从队列取出 continuation
   → 执行 lambda：打印 "Received: ... bytes"
   → continuation 完成，future 链继续传播
```

### 5.2 避免栈增长的调度策略

为了更好地理解为什么 continuation 不能内联执行，考虑以下场景：

```cpp
seastar::future<> chain_operations() {
    return step1()
        .then([] { return step2(); })
        .then([] { return step3(); })
        .then([] { return step4(); })
        // ... 可能有成百上千个 .then()
        ;
}
```

如果采用内联执行策略，当 `step1()` 的 promise 被 resolve 时，会立即执行第一个 `.then()` 中的 lambda，该 lambda 返回的 future 如果也已经就绪，又会立即执行下一个 `.then()` ……最终形成深层递归调用栈：

```
// 危险的内联执行（Seastar 不会这样做）
poll_io()
  → promise1.set_value()
    → continuation1.run()      // 栈深度 +1
      → promise2.set_value()
        → continuation2.run()  // 栈深度 +2
          → promise3.set_value()
            → continuation3.run()  // 栈深度 +3
              → ...                // 栈可能溢出！
```

Seastar 通过将每个 continuation 推入任务队列来避免这个问题：

```
// Seastar 的实际行为
poll_io()
  → promise1.set_value()
    → enqueue(continuation1)  // 推入队列，立即返回

run_tasks()
  → continuation1.run()       // 从栈底开始，栈深度 = 1
    → promise2.set_value()
      → enqueue(continuation2)

run_tasks()
  → continuation2.run()       // 从栈底开始，栈深度 = 1
    → ...
```

每个 continuation 都从栈底开始执行，调用栈深度始终保持恒定。这是 Seastar 能够安全处理任意长度 future 链的关键设计。

### 5.3 make_ready_future 的优化

对于那些已经有结果的同步操作（如从缓存中读取），Seastar 提供了 `make_ready_future<T>(value)` 来创建一个已就绪的 future。当对这样的 future 调用 `.then()` 时，如果 Seastar 检测到该 future 已经就绪，它可以优化处理——但仍然需要注意栈深度控制。

```cpp
seastar::future<int> get_cached_value(int key) {
    auto it = cache.find(key);
    if (it != cache.end()) {
        return seastar::make_ready_future<int>(it->second);  // 同步就绪
    }
    return fetch_from_storage(key);  // 异步操作
}
```

---

## 6. 跨核通信（smp::submit_to）

### 6.1 为什么需要跨核通信

尽管 Share-Nothing 架构是 Seastar 的核心原则，但在实际应用中，跨核通信是不可避免的。例如：

- 客户端请求落在 Core 0，但数据分片在 Core 3
- 需要汇总所有核心的统计信息
- 某些全局操作（如 schema 变更）需要通知所有核心

Seastar 通过 `smp::submit_to()` 提供了一种安全、高效的跨核通信机制。

### 6.2 smp::submit_to 的工作原理

```cpp
// smp::submit_to 的基本用法
seastar::future<int> result = seastar::smp::submit_to(target_shard, [] {
    // 这段代码将在 target_shard 的 Reactor 上执行
    return compute_something();
});

// result 是一个 future，当 target_shard 执行完毕后变为 ready
result.then([](int value) {
    // 在调用方的核心上处理结果
    std::cout << "Got result: " << value << "\n";
});
```

其内部实现涉及一个精巧的跨核消息传递机制：

```
调用流程：

Core 0 (调用方)                    Core 3 (目标方)
─────────────────                  ─────────────────
1. submit_to(3, func)
   → 创建 promise/future 对
   → 将 func 封装为消息
   → 写入 Core 3 的收件箱
     (lock-free SPSC queue)
   → 返回 future (pending)
                                   2. poll_smp_queues()
                                      → 发现来自 Core 0 的消息
                                      → 执行 func()
                                      → 将结果写入 Core 0 的收件箱

3. poll_smp_queues()
   → 发现来自 Core 3 的响应
   → promise.set_value(result)
   → continuation 被推入任务队列

4. run_tasks()
   → 执行 continuation
   → 打印结果
```

### 6.3 跨核通信的实现细节

核心之间的通信通过 **无锁单生产者单消费者队列（lock-free SPSC queue）** 实现。对于 N 个核心的系统，共有 N×(N-1) 个这样的队列——每对核心之间各一个方向。

```cpp
// 跨核消息队列结构（简化伪代码）
struct smp_message_queue {
    // 每对 (source_core, target_core) 有一个这样的队列
    boost::lockfree::spsc_queue<smp_message*> pending;
    boost::lockfree::spsc_queue<smp_message*> completed;
};

// 全局消息队列矩阵
// qs[i][j] 表示从 core i 到 core j 的消息队列
smp_message_queue qs[nr_cores][nr_cores];
```

这种设计避免了任何锁操作：发送方只写入 `pending` 队列（作为唯一的生产者），接收方只从 `pending` 队列读取（作为唯一的消费者），SPSC 队列天然是无锁且线程安全的。

### 6.4 实际应用示例

以下是一个在分布式键值存储中使用跨核通信的完整示例：

```cpp
// 分布式键值存储示例
class distributed_kv_store {
    // 每个 shard 拥有自己的本地 map
    std::unordered_map<std::string, std::string> _local_store;

    // 根据 key 确定归属的 shard
    static unsigned get_shard(const std::string& key) {
        return std::hash<std::string>{}(key) % seastar::smp::count;
    }

public:
    // GET 操作：如果 key 不在本地，转发到目标 shard
    seastar::future<std::optional<std::string>> get(std::string key) {
        unsigned target = get_shard(key);

        if (target == seastar::this_shard_id()) {
            // 数据在本地 shard，直接查找
            auto it = _local_store.find(key);
            if (it != _local_store.end()) {
                return seastar::make_ready_future<std::optional<std::string>>(
                    it->second);
            }
            return seastar::make_ready_future<std::optional<std::string>>(
                std::nullopt);
        }

        // 数据在其他 shard，通过 smp::submit_to 转发
        return seastar::smp::submit_to(target,
            [this, key = std::move(key)] {
                auto it = _local_store.find(key);
                if (it != _local_store.end()) {
                    return std::optional<std::string>(it->second);
                }
                return std::optional<std::string>(std::nullopt);
            });
    }

    // PUT 操作
    seastar::future<> put(std::string key, std::string value) {
        unsigned target = get_shard(key);

        return seastar::smp::submit_to(target,
            [this, key = std::move(key), value = std::move(value)] {
                _local_store[key] = value;
            });
    }
};
```

### 6.5 map_reduce：全核聚合

当需要从所有核心收集信息时，`smp::invoke_on_all()` 和 `map_reduce()` 提供了方便的高层接口：

```cpp
// 汇总所有 shard 的连接数
seastar::future<uint64_t> get_total_connections() {
    return seastar::map_reduce(
        boost::irange<unsigned>(0, seastar::smp::count),
        [](unsigned shard) {
            return seastar::smp::submit_to(shard, [] {
                return _local_connection_count;
            });
        },
        uint64_t(0),                  // 初始值
        std::plus<uint64_t>()         // 归约函数
    );
}

// 向所有 shard 广播配置更新
seastar::future<> update_config_all_shards(config new_config) {
    return seastar::smp::invoke_on_all([new_config] {
        _local_config = new_config;
    });
}
```

---

## 7. I/O 调度

### 7.1 磁盘 I/O：从 Linux AIO 到 io_uring

Seastar 对磁盘 I/O 的处理经历了从 Linux AIO 到 io_uring 的演进。

**Linux AIO（Asynchronous I/O）** 是早期 Seastar 使用的异步磁盘 I/O 机制。它通过 `io_submit()` 提交 I/O 请求，通过 `io_getevents()` 获取完成事件。但 Linux AIO 有诸多限制：只支持直接 I/O（O_DIRECT），不支持某些文件操作（如 `fsync`、`stat`），且内核实现中仍可能存在阻塞点。

**io_uring**（Linux 5.1+）是更现代的替代方案。它通过用户态与内核共享的环形缓冲区实现真正的零拷贝、零系统调用的异步 I/O：

```cpp
// Seastar 使用 io_uring 的 I/O 流程（简化伪代码）
class io_uring_backend {
    struct io_uring _ring;

    // 提交 I/O 请求
    void submit_read(int fd, void* buf, size_t len, off_t offset,
                     promise<size_t>* p) {
        auto* sqe = io_uring_get_sqe(&_ring);
        io_uring_prep_read(sqe, fd, buf, len, offset);
        io_uring_sqe_set_data(sqe, p);  // 关联 promise
        io_uring_submit(&_ring);
    }

    // 在 poll_io() 中调用：收割完成的 I/O
    void poll_completions() {
        struct io_uring_cqe* cqe;
        while (io_uring_peek_cqe(&_ring, &cqe) == 0) {
            auto* p = static_cast<promise<size_t>*>(
                io_uring_cqe_get_data(cqe));

            if (cqe->res >= 0) {
                p->set_value(cqe->res);      // 成功：resolve promise
            } else {
                p->set_exception(
                    std::make_exception_ptr(
                        std::system_error(-cqe->res, std::system_category())));
            }

            io_uring_cqe_seen(&_ring, cqe);
        }
    }
};
```

### 7.2 网络 I/O：DPDK 与 POSIX

对于网络 I/O，Seastar 支持两种后端：

**DPDK 后端**：完全绕过内核网络栈，直接在用户态操作网卡。每个核心拥有独立的 RX/TX 队列，通过忙轮询（busy polling）收发数据包。这提供了最低的延迟和最高的吞吐量，但需要专用的网卡和驱动支持。

**POSIX 后端**：使用标准的 Linux 系统调用（`epoll` + 非阻塞 socket）。虽然性能不如 DPDK，但兼容性更好，不需要特殊的硬件或驱动。

```cpp
// 网络 I/O 完成如何 resolve promise 的流程
// （以 POSIX 后端为例）

// 用户发起异步读取
seastar::future<seastar::temporary_buffer<char>>
posix_data_source::get() {
    auto p = promise<temporary_buffer<char>>();
    auto f = p.get_future();

    // 注册到 epoll：当 fd 可读时唤醒
    _reactor.register_readable(_fd, [p = std::move(p), fd = _fd]() mutable {
        char buf[8192];
        ssize_t n = ::read(fd, buf, sizeof(buf));
        if (n > 0) {
            p.set_value(temporary_buffer<char>(buf, n));
        } else if (n == 0) {
            p.set_value(temporary_buffer<char>());  // EOF
        } else {
            p.set_exception(/* ... */);
        }
    });

    return f;
}
```

### 7.3 I/O 调度器与优先级

Seastar 还实现了一个 **I/O 调度器（I/O scheduler）**，用于管理磁盘 I/O 请求的优先级和带宽分配。类似于 CPU 调度组，I/O 操作也可以分配到不同的 I/O 优先级类：

```cpp
// I/O 优先级类示例
auto user_io_class = seastar::io_priority_class::register_one("user", 1000);
auto compaction_io_class = seastar::io_priority_class::register_one("compaction", 200);

// 以特定优先级执行磁盘读取
seastar::future<seastar::temporary_buffer<char>>
read_with_priority(seastar::file& f, uint64_t pos, size_t len) {
    return f.dma_read<char>(pos, len, user_io_class);
}
```

### 7.4 背压控制（Backpressure）

当 I/O 速率超过系统处理能力时，需要背压机制防止资源耗尽。Seastar 主要通过 **信号量（semaphore）** 和 **门控（gate）** 实现背压：

```cpp
// 使用信号量控制并发 I/O 数量
seastar::semaphore io_limit(100);  // 最多 100 个并发 I/O

seastar::future<> process_request() {
    return seastar::with_semaphore(io_limit, 1, [] {
        return do_io_operation();
        // 信号量确保同一时刻最多 100 个操作在执行
        // 超出的请求会等待，形成天然的背压
    });
}

// 使用 gate 实现优雅关闭
seastar::gate request_gate;

seastar::future<> handle_connection(seastar::connected_socket socket) {
    return seastar::with_gate(request_gate, [socket = std::move(socket)] {
        return process(socket);
    });
}

seastar::future<> shutdown() {
    return request_gate.close();  // 等待所有进行中的请求完成
}
```

---

## 8. 定时器集成

### 8.1 timer 类

Seastar 提供了 `timer<Clock>` 类用于在 Reactor 事件循环中调度定时任务。定时器与 Reactor 深度集成——它的到期检查是 Reactor 主循环的一个固有阶段。

```cpp
// 基本定时器用法
seastar::timer<> heartbeat_timer;

void start_heartbeat() {
    heartbeat_timer.set_callback([] {
        send_heartbeat_to_peers();
    });

    // 每秒触发一次
    heartbeat_timer.arm_periodic(std::chrono::seconds(1));
}

// 一次性定时器
seastar::timer<> timeout_timer;
timeout_timer.set_callback([] {
    handle_timeout();
});
timeout_timer.arm(std::chrono::milliseconds(500));  // 500ms 后触发

// 取消定时器
timeout_timer.cancel();
```

### 8.2 sleep() 与 future

`seastar::sleep()` 是定时器最常用的高层封装，它返回一个 future，在指定时间后变为 ready：

```cpp
// sleep() 的内部实现原理（简化伪代码）
seastar::future<> sleep(std::chrono::duration duration) {
    auto p = promise<>();
    auto f = p.get_future();

    timer<> t;
    t.set_callback([p = std::move(p)]() mutable {
        p.set_value();  // 时间到，resolve promise
    });
    t.arm(duration);

    return f;
}

// 使用 sleep() 实现延迟重试
seastar::future<> retry_with_backoff(int max_retries) {
    return seastar::do_with(int(0), [max_retries](int& attempt) {
        return seastar::repeat([&attempt, max_retries] {
            return do_operation().then_wrapped(
                [&attempt, max_retries](seastar::future<> f) {
                    try {
                        f.get();
                        return seastar::make_ready_future<
                            seastar::stop_iteration>(
                            seastar::stop_iteration::yes);
                    } catch (...) {
                        if (++attempt >= max_retries) {
                            throw;
                        }
                        auto delay = std::chrono::milliseconds(
                            100 * (1 << attempt));  // 指数退避
                        return seastar::sleep(delay).then([] {
                            return seastar::stop_iteration::no;
                        });
                    }
                });
        });
    });
}
```

### 8.3 定时器轮（Timer Wheel）实现

在底层，Seastar 的定时器集合使用了一种高效的数据结构来管理大量定时器。常见的实现方式是 **分层时间轮（Hierarchical Timer Wheel）**，其核心思想类似于时钟的表盘：

```
时间轮示意：

粗粒度轮 (每格 = 1秒)        细粒度轮 (每格 = 1ms)
┌───┬───┬───┬───┬───┐      ┌───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │...│      │ 0 │ 1 │ 2 │ 3 │...│
├───┼───┼───┼───┼───┤      ├───┼───┼───┼───┼───┤
│ T1│   │T2 │   │   │      │T3 │   │   │T4 │   │
│ T5│   │   │   │   │      │   │   │   │   │   │
└───┴───┴───┴───┴───┘      └───┴───┴───┴───┴───┘

指针每 tick 前进一格，处理该格中的所有定时器
```

时间轮的优势在于：
- **添加定时器**：O(1) 时间复杂度——直接放入对应的格中
- **删除定时器**：O(1)——从链表中摘除
- **查找最近到期的定时器**：O(1)——就是当前指针指向的格
- **触发到期定时器**：遍历当前格中的链表

相比之下，基于最小堆（min-heap）的实现添加和删除的时间复杂度为 O(log N)，在定时器数量很大时性能不如时间轮。

```cpp
// 定时器在 Reactor 主循环中的处理位置
void reactor::run() {
    while (_running) {
        poll_io();
        run_tasks();

        // 定时器处理嵌入主循环
        auto now = clock_type::now();
        _timer_wheel.advance_to(now);  // 推进时间轮指针

        // 收集所有到期的定时器
        while (auto* timer = _timer_wheel.pop_expired()) {
            timer->fire();
            // fire() 内部会 resolve promise 或调用回调，
            // 将 continuation 推入任务队列
        }

        maybe_yield();
    }
}
```

### 8.4 定时器与超时模式

定时器在实际应用中最常见的用途之一是实现 **超时（timeout）** 模式：

```cpp
// 为任意异步操作添加超时
template <typename T>
seastar::future<T> with_timeout(std::chrono::steady_clock::duration timeout,
                                seastar::future<T> f) {
    auto timeout_future = seastar::sleep(timeout).then([] {
        throw std::runtime_error("operation timed out");
    });

    // 使用 when_all 等待操作完成或超时
    return seastar::when_all(std::move(f), std::move(timeout_future))
        .then([](auto results) {
            // 返回第一个完成的结果
            return std::move(std::get<0>(results));
        });
}

// 使用示例
auto result = with_timeout(
    std::chrono::seconds(5),
    fetch_data_from_remote()
);
```

Seastar 还提供了内置的 `with_timeout()` 工具，以及 `abort_source` 机制，用于更优雅地取消超时操作。

---

## 9. 总结：Reactor 模型的全貌

将本文讨论的所有组件组合在一起，我们可以看到 Seastar Reactor 模型的全貌：

```
┌─────────────────────────────────────────────────────────────┐
│                      Seastar 应用程序                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    用户代码                           │    │
│  │   future/promise 链 → .then() → .then() → ...      │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │                               │
│  ┌──────────────────────────▼──────────────────────────┐    │
│  │              Reactor 事件循环 (per-core)              │    │
│  │                                                     │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────┐  │    │
│  │  │poll_io()│→│run_tasks()│→│check_  │→│maybe_ │  │    │
│  │  │         │  │          │  │timers()│  │yield()│  │    │
│  │  └────┬────┘  └────┬─────┘  └───┬────┘  └───────┘  │    │
│  │       │            │            │                   │    │
│  │  ┌────▼────┐  ┌────▼─────┐  ┌───▼────┐             │    │
│  │  │io_uring │  │Task Queue│  │Timer   │             │    │
│  │  │DPDK     │  │(多调度组) │  │Wheel   │             │    │
│  │  │epoll    │  │          │  │        │             │    │
│  │  └─────────┘  └──────────┘  └────────┘             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              跨核通信层 (SMP Queues)                   │    │
│  │   Core 0 ←→ Core 1 ←→ Core 2 ←→ ... ←→ Core N     │    │
│  │          (lock-free SPSC queues)                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Per-Core 独占资源                         │    │
│  │   Memory Allocator │ Network Queue │ File I/O Queue │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

Seastar 的设计哲学可以归纳为几个核心原则：

1. **Share-Nothing**：通过消除共享状态，消除锁竞争，实现线性可扩展性（linear scalability）。
2. **事件驱动**：通过 Reactor 事件循环和协作式调度，避免线程上下文切换的开销。
3. **Future/Promise**：通过类型安全的异步编程模型，让开发者能够编写可读性强的异步代码。
4. **零拷贝**：从网络收包到磁盘 I/O，尽可能减少数据拷贝。
5. **用户态优先**：通过 DPDK、io_uring 等技术绕过内核，减少系统调用开销。

这些原则共同构成了 Seastar 的高性能基础。无论是 ScyllaDB 的数百万 QPS，还是 Redpanda 的低延迟流处理，都建立在这个精心设计的 Reactor 模型之上。

---

> **延伸阅读**
>
> - [Seastar 官方文档](https://seastar.io/futures-promises/)
> - [Seastar Tutorial](https://github.com/scylladb/seastar/blob/master/doc/tutorial.md)
> - [ScyllaDB 技术博客：Shared-Nothing Architecture](https://www.scylladb.com/product/technology/)
> - 上一篇：[01 - Seastar 原版 Future/Promise 架构深度解析](./01-seastar-future-architecture.md)
