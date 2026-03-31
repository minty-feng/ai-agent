# Seastar 原版 Future/Promise 架构深度解析

> 本文深入剖析 Seastar 框架中原版 future/promise 的内部实现，涵盖状态机设计、续体调度、自动展开机制以及与 Reactor 事件循环的交互方式。适合对高性能异步编程框架感兴趣的 C++ 开发者阅读。

---

## 1. Seastar 项目简介

Seastar 是一个开源的高性能 C++ 应用框架，专为现代多核、多网卡硬件而设计。它最初由 Cloudius Systems（后来的 ScyllaDB）团队开发，目标是充分利用现代硬件的能力——包括多核 CPU、DPDK 网络栈以及高速 NVMe 存储设备。

Seastar 的核心设计哲学包括：

- **Shared-nothing 架构**：每个 CPU 核心拥有独立的内存、网络队列和任务队列，线程之间不共享可变状态，从而避免了锁竞争（lock contention）带来的性能损耗。
- **Future/Promise 异步模型**：所有 I/O 操作都通过 future/promise 机制实现异步化，不使用传统的阻塞调用或线程池模型。
- **用户态调度（Cooperative Scheduling）**：Seastar 运行一个每核一个的 Reactor 事件循环，所有任务都以协作方式被调度执行，不依赖操作系统的线程调度器。
- **零拷贝（Zero-copy）I/O**：通过精心设计的内存管理和网络栈，最大限度减少数据拷贝。

Seastar 被 ScyllaDB（一个兼容 Cassandra 的高性能 NoSQL 数据库）和 Redpanda（一个兼容 Kafka 的流处理平台）等知名项目广泛使用。其 future/promise 系统是整个框架的基石——理解它的内部机制，是深入理解 Seastar 编程模型的关键。

---

## 2. 原版 Future 的内部状态机

### 2.1 `future_state<T>` 的三态设计

在 Seastar 的原版实现中，`future_state<T>` 是 future 的核心数据结构。它使用 **基于 union 的存储（union-based storage）** 来表示三种可能的状态：

| 状态 | 含义 | 存储内容 |
|------|------|----------|
| **invalid / pending** | Future 尚未就绪，正在等待异步操作完成 | 无有效数据 |
| **value** | 异步操作成功完成 | 存储类型为 `T` 的结果值 |
| **exception** | 异步操作以异常结束 | 存储 `std::exception_ptr` |

其核心结构大致如下：

```cpp
template <typename T>
struct future_state {
    enum class state : uint8_t {
        invalid,
        value,
        exception,
    };

    union any {
        any() noexcept {}
        ~any() {}
        T value;
        std::exception_ptr ex;
    };

    state _state = state::invalid;
    any _u;

    // 判断 future 是否已完成
    bool available() const noexcept {
        return _state != state::invalid;
    }

    // 判断是否成功
    bool has_value() const noexcept {
        return _state == state::value;
    }

    // 判断是否为异常
    bool has_exception() const noexcept {
        return _state == state::exception;
    }

    // 设置值
    void set(T&& value) {
        assert(_state == state::invalid);
        new (&_u.value) T(std::move(value));
        _state = state::value;
    }

    // 设置异常
    void set_exception(std::exception_ptr ex) noexcept {
        assert(_state == state::invalid);
        new (&_u.ex) std::exception_ptr(std::move(ex));
        _state = state::exception;
    }

    // 获取值（移动语义）
    T get() {
        assert(available());
        if (_state == state::exception) {
            std::rethrow_exception(std::move(_u.ex));
        }
        return std::move(_u.value);
    }
};
```

### 2.2 为何不使用 `std::optional`

读者可能会问：为什么不直接使用 `std::optional<T>` 加上一个 `std::exception_ptr` 来实现？原因有以下几点：

1. **紧凑的内存布局**：`std::optional<T>` 内部通常包含一个 `bool` 标志位和对齐后的存储空间。而 Seastar 使用自定义 union，可以让 value 和 exception 共享同一块内存（因为它们不会同时存在），从而减小 `future_state` 的整体大小。
2. **精确的生命周期控制**：使用 placement new 和手动析构，Seastar 可以在编译期精确控制对象的构造和销毁时机，避免不必要的构造/析构开销。
3. **异常状态的一等支持**：异常不是一个附加的"可选"字段，而是与值处于同一个 union 中的对等状态。这使得异常路径与值路径具有对称的性能特征。

### 2.3 避免堆分配的快速路径

Seastar future/promise 设计中最关键的性能优化之一是 **在快速路径（fast path）上完全避免堆分配**。

所谓"快速路径"是指：在调用 `.then()` 之前，promise 已经被 resolve（异步操作已经完成）。在这种情况下：

- `future_state` 直接嵌入在 promise 对象中（栈上或其他预分配的内存中）。
- 调用 `.then()` 时，发现 future 已经就绪，直接取出值并调用续体函数。
- **整个过程没有任何 `new` / `delete` 操作**。

这与许多其他 future 实现（如 `std::future`）形成鲜明对比——后者通常需要通过 `std::shared_ptr` 管理一个堆上分配的共享状态对象。Seastar 的设计在高吞吐量场景下节省了大量的内存分配开销。

---

## 3. Queue-based 续体模型

### 3.1 单指针续体（Single `task*` Continuation）

在原版 Seastar 中，每个 future 最多持有 **一个** 续体（continuation）。这个续体以 `task*` 指针的形式存储：

```cpp
template <typename T>
class future {
    future_state<T> _state;   // 如果 future 已就绪，值存储在这里
    promise<T>* _promise;      // 指向配对的 promise（如果 pending）
    task* _continuation;       // 注册的续体任务
    // ...
};
```

注意，这里 **不是** `std::vector<task*>` 或 `std::function<void()>`——而是一个单一的 `task*` 指针。这意味着：

- 每个 future 只能注册一次续体（一次 `.then()` 调用）。
- 没有动态容器的开销。
- 如果需要多次 `.then()` 链式调用，每次 `.then()` 都会创建一个新的 future，形成链表结构。

### 3.2 `task` 类层次结构

`task` 是 Seastar 任务调度系统中的基类，所有可被 Reactor 调度执行的工作单元都继承自它：

```cpp
class task {
public:
    virtual ~task() noexcept = default;
    virtual void run_and_dispose() noexcept = 0;

    // 用于任务调度的优先级等属性
    scheduling_group _sg;
};
```

`run_and_dispose()` 是核心虚函数——Reactor 从任务队列中取出一个 task 后，调用此方法执行它，并由方法自身负责释放资源（通常是 `delete this`）。

围绕 `task` 基类，Seastar 构建了以下关键派生类：

#### `continuation<T, Func>`

这是最核心的续体类型，用于表示 `.then()` 注册的续体函数：

```cpp
template <typename T, typename Func>
class continuation final : public task {
    promise<T> _promise;  // 用于 resolve 下一个 future
    Func _func;           // 用户传入的回调函数

public:
    continuation(Func&& func)
        : _func(std::move(func)) {}

    void run_and_dispose() noexcept override {
        try {
            // 调用用户函数，将结果设置到 promise 中
            _promise.set_value(_func());
        } catch (...) {
            _promise.set_exception(std::current_exception());
        }
        delete this;
    }

    // 获取此 continuation 对应的 future
    future<T> get_future() {
        return _promise.get_future();
    }
};
```

#### `lambda_task<Func>`

用于将一个无返回值的 lambda 包装为 task：

```cpp
template <typename Func>
class lambda_task final : public task {
    Func _func;

public:
    lambda_task(Func&& func) : _func(std::move(func)) {}

    void run_and_dispose() noexcept override {
        _func();
        delete this;
    }
};
```

### 3.3 续体的注册与触发流程

当用户调用 `future<T>::then(func)` 时，执行流程如下：

**情况一：Future 已就绪（fast path）**

```
then(func) 被调用
  → 检查 _state.available() == true
  → 直接从 _state 取出值
  → 创建 continuation 对象
  → 将 continuation 调度到 Reactor 的任务队列
  → 返回 continuation 关联的新 future
```

**情况二：Future 尚未就绪（slow path）**

```
then(func) 被调用
  → 检查 _state.available() == false
  → 创建 continuation 对象（堆分配）
  → 将 continuation 的 task* 指针存储到 future 的 _continuation 字段
  → 返回 continuation 关联的新 future

（稍后，当 promise 被 resolve 时）
promise::set_value(val) 被调用
  → 将值存储到 future_state 中
  → 检查是否有注册的 _continuation
  → 若有，将 continuation 调度到 Reactor 的任务队列
```

这就是所谓的 **"queue-based 续体模型"**——续体不是被立即内联执行（inline execution），而是被放入 Reactor 的任务队列中，等待 Reactor 在下一个调度周期内执行。这对于 **协作式调度（cooperative scheduling）** 至关重要，因为它防止了深度递归和长时间占用 CPU 的问题。

---

## 4. Promise 与 Future 的配对关系

### 4.1 嵌入式状态（Embedded State）

在许多 future/promise 实现中（例如 `std::promise` / `std::future`），promise 和 future 通过一个 **堆上分配的共享状态对象（shared state）** 进行通信，通常由 `std::shared_ptr` 管理。这意味着每次创建 promise/future 对都需要一次堆分配。

Seastar 采用了截然不同的方式：**promise 直接嵌入（embed）`future_state`**。

```cpp
template <typename T>
class promise {
    future_state<T> _state;   // 状态直接嵌入 promise 内部
    future<T>* _future;       // 指向配对的 future

public:
    future<T> get_future() noexcept {
        future<T> f;
        f._promise = this;
        _future = &f;
        return f;     // 注意：实际上通过移动语义传递
    }

    void set_value(T&& value) {
        _state.set(std::move(value));
        if (_future && _future->_continuation) {
            // 将续体调度到 Reactor
            schedule(_future->_continuation);
        }
    }

    void set_exception(std::exception_ptr ex) noexcept {
        _state.set_exception(std::move(ex));
        if (_future && _future->_continuation) {
            schedule(_future->_continuation);
        }
    }
};
```

而 future 持有一个指向 promise 的裸指针（raw pointer）：

```cpp
template <typename T>
class future {
    promise<T>* _promise = nullptr;  // 指向配对的 promise
    // 或者，如果已就绪：
    future_state<T> _local_state;    // 本地缓存的状态
    // ...
};
```

### 4.2 指针交叉引用

Promise 和 future 之间通过 **互相持有裸指针** 来维护配对关系：

```
┌──────────────┐         ┌──────────────┐
│   promise<T> │         │   future<T>  │
│              │         │              │
│  _future ────┼────────►│              │
│              │         │  _promise ───┼──────►│
│  _state      │◄────────┼──────────────┘       │
│  (嵌入的     │         │                      │
│   状态数据)  │         │                      │
└──────────────┘         └──────────────┘
```

这种设计的优势：

- **零堆分配**：在最常见的使用场景中（promise 和 future 在同一个栈帧或连续的续体链中），整个过程不需要任何堆分配。
- **缓存友好（Cache-friendly）**：相关数据在内存中紧密排列，有利于 CPU 缓存命中。
- **低开销**：没有引用计数（reference counting）的原子操作开销。

### 4.3 生命周期管理

由于使用裸指针而非智能指针，生命周期管理需要格外小心。Seastar 通过以下机制确保安全：

1. **移动语义（Move Semantics）**：Future 和 promise 都是 move-only 类型。移动时会更新对方持有的指针。
2. **析构函数中的断链**：当 promise 被销毁时，如果还有配对的 future，需要将 future 标记为"broken promise"（以异常状态完成）。反之亦然。
3. **单一所有权**：每个 promise 最多对应一个 future，每个 future 最多对应一个 promise。不存在多对多的情况。

```cpp
template <typename T>
promise<T>::~promise() noexcept {
    if (_future) {
        // Promise 被销毁但 future 还在等待
        // 设置一个 "broken promise" 异常
        _future->_promise = nullptr;
        _future->set_exception(
            std::make_exception_ptr(broken_promise()));
    }
}
```

---

## 5. 自动展开（Auto-unwrap）机制

### 5.1 问题：`future<future<U>>`

在链式异步调用中，一个常见的场景是：续体函数本身返回一个 future。例如：

```cpp
future<int> read_value();
future<std::string> format_value(int v);

auto result = read_value().then([](int v) {
    return format_value(v);  // 返回 future<std::string>
});
```

如果没有自动展开机制，`result` 的类型将是 `future<future<std::string>>`——这显然不是我们想要的。我们期望 `result` 的类型是 `future<std::string>`。

### 5.2 `futurize<T>` 特征（Trait）

Seastar 通过 `futurize<T>` 这个类型特征（type trait）来实现自动展开：

```cpp
// 基本情况：非 future 类型
template <typename T>
struct futurize {
    using type = future<T>;

    // 将普通值包装为 future
    static type convert(T&& value) {
        return make_ready_future<T>(std::move(value));
    }

    // 将函数调用结果包装为 future
    template <typename Func, typename... Args>
    static type apply(Func&& func, Args&&... args) {
        try {
            return convert(func(std::forward<Args>(args)...));
        } catch (...) {
            return make_exception_future<T>(std::current_exception());
        }
    }
};

// 特化：如果 T 已经是 future<U>，则不再包装
template <typename U>
struct futurize<future<U>> {
    using type = future<U>;   // 注意：不是 future<future<U>>

    static type convert(future<U>&& f) {
        return std::move(f);  // 直接传递，不再包装
    }

    template <typename Func, typename... Args>
    static type apply(Func&& func, Args&&... args) {
        try {
            return func(std::forward<Args>(args)...);
        } catch (...) {
            return make_exception_future<U>(std::current_exception());
        }
    }
};
```

### 5.3 `then()` 中的展开逻辑

当 `future<T>::then(func)` 被调用时，Seastar 使用 `futurize` 来确定续体链的正确类型：

```cpp
template <typename T>
template <typename Func>
auto future<T>::then(Func&& func) {
    // 推导 func 的返回类型
    using raw_return = std::invoke_result_t<Func, T>;
    // 通过 futurize 展开（如果需要的话）
    using futurized = futurize<raw_return>;
    using result_future = typename futurized::type;

    // 创建 continuation，返回的 future 类型是展开后的类型
    // ...
    return result_future(/* ... */);
}
```

这意味着：

- 如果 `func` 返回 `int`，则 `then()` 返回 `future<int>`。
- 如果 `func` 返回 `future<int>`，则 `then()` 返回的仍然是 `future<int>`（而非 `future<future<int>>`）。

这个机制对于编写流畅的异步代码至关重要，使得链式调用自然而直观。

---

## 6. 错误传播路径

### 6.1 基于 `exception_ptr` 的异常传递

在 Seastar 的 future/promise 模型中，错误以 `std::exception_ptr` 的形式存储在 `future_state` 中。当一个 future 处于异常状态时，后续的普通 `.then()` 续体会被 **自动跳过（skip）**，异常会沿着续体链向下传播，直到遇到一个错误处理器。

传播逻辑的简化版本如下：

```cpp
template <typename T>
template <typename Func>
auto future<T>::then(Func&& func) -> future<...> {
    if (has_exception()) {
        // 不调用 func，直接将异常传播到下一个 future
        return make_exception_future<...>(get_exception());
    }
    // 正常路径：调用 func
    return futurize<...>::apply(std::forward<Func>(func), get());
}
```

这类似于同步代码中的异常机制——异常会"穿过"正常的执行流，直到被 `catch` 捕获。

### 6.2 `handle_exception()` 模式

`handle_exception()` 是 Seastar 提供的错误处理机制，类似于同步代码中的 `catch` 块：

```cpp
future<int> perform_operation() {
    return async_read()
        .then([](std::string data) {
            return parse_int(data);  // 可能抛出异常
        })
        .then([](int value) {
            return value * 2;  // 如果上一步抛出异常，这里会被跳过
        })
        .handle_exception([](std::exception_ptr ep) -> int {
            // 捕获并处理异常
            try {
                std::rethrow_exception(ep);
            } catch (const parse_error& e) {
                fmt::print("解析错误: {}\n", e.what());
                return -1;  // 提供默认值
            }
            // 如果不处理，重新抛出
            return make_exception_future<int>(ep);
        });
}
```

`handle_exception` 只在 future 处于异常状态时被调用。如果 future 正常完成，它会被跳过。

### 6.3 `then_wrapped()` 模式

`then_wrapped()` 是一个更底层的工具，它无论 future 是成功还是失败，都会被调用。续体函数接收整个 `future<T>` 对象，由用户自行判断状态：

```cpp
future<int> robust_operation() {
    return async_compute()
        .then_wrapped([](future<int> f) -> int {
            if (f.failed()) {
                // 处理错误
                fmt::print("操作失败: {}\n",
                    f.get_exception());
                return 0;
            }
            return f.get();  // 提取成功的值
        });
}
```

`then_wrapped()` 在需要统一处理成功和失败情况时非常有用，例如资源清理、日志记录等场景。

### 6.4 异常传播的完整链路

下图展示了异常在续体链中的传播路径：

```
future<A> ──.then(f1)──► future<B> ──.then(f2)──► future<C>
                                          │
                                    f1 抛出异常
                                          │
                                          ▼
                              future<B> 变为异常状态
                                          │
                                    f2 被自动跳过
                                          │
                                          ▼
                              future<C> 继承异常状态
                                          │
                              .handle_exception(h)
                                          │
                                          ▼
                              h 被调用，异常被处理
                              future<C> 恢复为正常状态
```

---

## 7. 与 Reactor 的交互

### 7.1 Reactor 事件循环概述

Seastar 的 Reactor 是一个单线程事件循环（event loop），运行在每个 CPU 核心上。它的主循环大致如下：

```cpp
void reactor::run() {
    while (!_stopped) {
        // 1. 轮询 I/O 完成事件（epoll / io_uring / DPDK）
        poll_io();

        // 2. 处理定时器
        process_timers();

        // 3. 执行就绪的任务（从任务队列中取出并运行）
        run_tasks();

        // 4. 如果空闲，可以做一些低优先级工作
        if (idle()) {
            do_idle_work();
        }
    }
}

void reactor::run_tasks() {
    while (!_task_queue.empty()) {
        auto task = _task_queue.front();
        _task_queue.pop_front();
        task->run_and_dispose();  // 执行并释放

        // 检查是否需要让出 CPU（协作式调度）
        if (need_preempt()) {
            break;
        }
    }
}
```

### 7.2 续体的调度策略

当 promise 被 resolve 时，**续体不会被立即内联执行**。相反，续体（作为一个 `task` 对象）会被放入 Reactor 的任务队列中：

```cpp
template <typename T>
void promise<T>::set_value(T&& value) {
    _state.set(std::move(value));
    if (_future && _future->_continuation) {
        // 关键：不是直接调用 _continuation->run_and_dispose()
        // 而是放入 Reactor 的任务队列
        engine().add_task(_future->_continuation);
        _future->_continuation = nullptr;
    }
}
```

这个设计决策对协作式调度至关重要：

1. **防止栈溢出**：如果续体被内联执行，长链式调用可能导致深度递归和栈溢出。
2. **公平性（Fairness）**：通过将续体放入队列，Reactor 可以在不同的任务之间公平地分配 CPU 时间。
3. **抢占检查（Preemption Check）**：Reactor 在执行每个任务后都会检查是否需要让出 CPU（例如，检查是否有待处理的 I/O 事件）。如果续体被内联执行，这些检查就会被绕过。

### 7.3 调度组（Scheduling Groups）

Seastar 还支持 **调度组（scheduling group）** 的概念，允许用户为不同类型的工作分配不同的 CPU 时间配额：

```cpp
// 创建调度组
scheduling_group sg_reads = create_scheduling_group("reads", 80);  // 80% CPU
scheduling_group sg_compaction = create_scheduling_group("compaction", 20); // 20% CPU

// 在指定调度组中执行异步操作
with_scheduling_group(sg_reads, [&] {
    return handle_read_request();
});
```

每个 `task` 对象都携带其所属的调度组信息。Reactor 在从任务队列取出任务时，会根据调度组的配额策略来决定执行哪个任务。这使得用户可以对不同类型的异步操作进行精细的资源控制。

### 7.4 I/O 完成与 Future 的连接

当一个异步 I/O 操作（如网络读取、磁盘写入）完成时，底层 I/O 子系统（例如 epoll 或 io_uring 的完成回调）会调用对应 promise 的 `set_value()` 方法：

```cpp
// 伪代码：I/O 完成回调
void on_io_complete(io_request* req, ssize_t result) {
    if (result >= 0) {
        req->promise.set_value(result);  // 触发续体调度
    } else {
        req->promise.set_exception(
            std::make_exception_ptr(io_error(result)));
    }
}
```

这样，从 I/O 完成到续体执行，形成了一条完整的数据流管道：

```
I/O 完成 → promise::set_value() → task 入队 → Reactor 调度 → task::run_and_dispose() → 用户续体执行
```

---

## 8. 代码示例

### 8.1 基本的 Future/Promise 用法

```cpp
#include <seastar/core/future.hh>
#include <seastar/core/sleep.hh>
#include <fmt/core.h>

using namespace seastar;

// 创建一个已就绪的 future
future<int> get_value() {
    return make_ready_future<int>(42);
}

// 创建一个延迟完成的 future
future<int> delayed_value() {
    return sleep(std::chrono::seconds(1)).then([] {
        return 42;
    });
}

// 手动使用 promise
future<std::string> manual_promise_example() {
    auto pr = promise<std::string>();
    auto fut = pr.get_future();

    // 模拟异步操作完成后 resolve promise
    // 实际中这通常由 I/O 完成回调触发
    pr.set_value("hello from promise");

    return fut;
}
```

### 8.2 链式 `.then()` 续体

```cpp
future<> chain_example() {
    return make_ready_future<int>(10)
        .then([](int value) {
            fmt::print("第一步: value = {}\n", value);
            return value * 2;   // 返回 int，自动包装为 future<int>
        })
        .then([](int value) {
            fmt::print("第二步: value = {}\n", value);
            return std::to_string(value);  // 返回 std::string
        })
        .then([](std::string s) {
            fmt::print("第三步: 结果字符串 = \"{}\"\n", s);
            // 返回 void，即 future<>
        });
}

// 输出:
// 第一步: value = 10
// 第二步: value = 20
// 第三步: 结果字符串 = "20"
```

### 8.3 错误处理与 `handle_exception`

```cpp
future<int> risky_computation(int input) {
    if (input < 0) {
        return make_exception_future<int>(
            std::runtime_error("负数输入"));
    }
    return make_ready_future<int>(input * input);
}

future<> error_handling_example() {
    return risky_computation(-5)
        .then([](int result) {
            // 这个续体会被跳过，因为 future 处于异常状态
            fmt::print("计算结果: {}\n", result);
            return result;
        })
        .handle_exception([](std::exception_ptr ep) -> int {
            try {
                std::rethrow_exception(ep);
            } catch (const std::runtime_error& e) {
                fmt::print("捕获异常: {}\n", e.what());
            }
            return 0;  // 提供恢复值
        })
        .then([](int value) {
            // 异常已被处理，此续体正常执行
            fmt::print("恢复后的值: {}\n", value);
        });
}

// 输出:
// 捕获异常: 负数输入
// 恢复后的值: 0
```

### 8.4 自动展开行为

```cpp
future<int> fetch_user_id(std::string name) {
    // 模拟异步数据库查询
    return make_ready_future<int>(12345);
}

future<std::string> fetch_user_email(int user_id) {
    // 模拟另一个异步查询
    return make_ready_future<std::string>("user@example.com");
}

future<> auto_unwrap_example() {
    return fetch_user_id("alice")
        .then([](int id) {
            fmt::print("用户 ID: {}\n", id);
            // 返回值类型是 future<std::string>
            // 自动展开：外层 then() 返回 future<std::string>
            // 而不是 future<future<std::string>>
            return fetch_user_email(id);
        })
        .then([](std::string email) {
            // 直接接收 std::string，而非 future<std::string>
            fmt::print("用户邮箱: {}\n", email);
        });
}

// 输出:
// 用户 ID: 12345
// 用户邮箱: user@example.com
```

### 8.5 使用 `then_wrapped` 进行统一处理

```cpp
future<> then_wrapped_example() {
    return make_ready_future<int>(100)
        .then([](int v) -> int {
            if (v > 50) {
                throw std::runtime_error("值太大");
            }
            return v;
        })
        .then_wrapped([](future<int> f) {
            if (f.failed()) {
                try {
                    std::rethrow_exception(f.get_exception());
                } catch (const std::exception& e) {
                    fmt::print("then_wrapped 捕获异常: {}\n", e.what());
                }
            } else {
                fmt::print("then_wrapped 获取值: {}\n", f.get());
            }
        });
}

// 输出:
// then_wrapped 捕获异常: 值太大
```

---

## 9. 总结

Seastar 原版 future/promise 架构是一个为极致性能而精心设计的异步编程模型。其核心设计决策可以归纳为以下几点：

| 设计决策 | 目的 | 效果 |
|----------|------|------|
| Union-based `future_state` | 紧凑的三态存储 | 避免 `std::optional` 的额外开销 |
| Promise 嵌入状态，裸指针交叉引用 | 避免堆分配 | 快速路径零 `new`/`delete` |
| 单 `task*` 续体指针 | 极简的续体存储 | 无动态容器开销 |
| `task` 类层次结构 | 统一的可调度工作单元 | `continuation<>`, `lambda_task<>` 等灵活组合 |
| Queue-based 续体调度 | 续体入队而非内联执行 | 支持协作式调度，防止栈溢出 |
| `futurize<T>` 自动展开 | 避免 `future<future<U>>` | 链式调用直观自然 |
| `exception_ptr` 异常传播 | 错误沿续体链自动传递 | 类似同步异常的错误处理体验 |

这套设计使得 Seastar 在高吞吐量、低延迟的场景下（如数据库引擎、消息中间件）能够充分发挥硬件性能。每个 future/promise 操作在快速路径上的开销仅为几次指针操作和一次虚函数调用，远低于传统基于 `std::shared_ptr` 和堆分配的 future 实现。

理解这些内部机制，不仅有助于正确使用 Seastar API，更能帮助开发者在遇到性能问题时做出正确的判断和优化决策。Seastar 的 future/promise 系统证明了：通过精心的系统级设计，C++ 的异步编程可以同时兼顾表达力和极致性能。

---

> **参考资源**
>
> - [Seastar 官方文档](https://seastar.io/futures-promises/)
> - [Seastar GitHub 仓库](https://github.com/scylladb/seastar)
> - [ScyllaDB 技术博客](https://www.scylladb.com/tech/)
> - Avi Kivity, "Asynchronous Programming with Seastar" (Seastar Tutorial)
