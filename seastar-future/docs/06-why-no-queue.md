# 简化 Future 为什么不依赖 Queue —— 设计取舍分析

> 本文档解释 `seastar-future` 库为什么使用单一 `unique_ptr<task>` 续体槽位（single continuation slot），而不像 Seastar 原版架构那样依赖 Reactor 任务队列（task queue）进行续体调度。文末列出这种简化设计的优势与劣势。

---

## 1. 原版 Seastar 的 Queue 机制

在完整的 Seastar 框架中，续体的执行依赖一套多层队列体系：

```
promise::set_value()
    └─→ 将续体 task* 提交到 Reactor 的任务队列
            └─→ Reactor 事件循环按调度组（scheduling_group）取出 task
                    └─→ task::run_and_dispose()
```

### 关键组件

| 组件 | 作用 |
|------|------|
| **Reactor 事件循环** | 每个 CPU 核心运行一个 reactor，循环轮询 I/O 事件和任务队列 |
| **任务队列（task queue）** | 每个 `scheduling_group` 对应一个 FIFO 队列，reactor 按权重轮询 |
| **scheduling_group** | 定义任务优先级和公平调度权重，防止低优先级任务饿死 |
| **task::run_and_dispose()** | 续体执行完毕后自行释放（`delete this`），reactor 不持有所有权 |

### 为什么需要 Queue

1. **协作式调度（cooperative scheduling）**：Seastar 要求每个续体快速返回，不能阻塞。续体放入队列后由 reactor 统一调度，确保 I/O 事件和其他任务能公平获得 CPU 时间。
2. **公平性保证**：通过 `scheduling_group` 和权重配置，reactor 可以限制某类任务占用的 CPU 比例（例如 compaction vs user query）。
3. **背压控制（backpressure）**：队列深度可以反映系统负载，reactor 可据此决定是否接受新连接或暂缓 I/O。
4. **跨 shard 通信**：`smp::submit_to()` 需要将 task 投递到目标核心的队列中，queue 是跨核消息传递的基础设施。

---

## 2. 简化 Future 的设计选择

`seastar-future` 库做了两个关键简化：

### 2.1 单一续体槽位（Single Continuation Slot）

```cpp
struct state {
    std::unique_ptr<task> continuation_;   // 不是 vector，不是 queue

    void schedule(std::unique_ptr<task> t) {
        if (available()) {
            t->run();                      // 已就绪 → 立即执行
        } else {
            continuation_ = std::move(t);  // 单指针赋值
        }
    }
};
```

每个 future 最多持有 **一个** 续体。这不是 queue，也不是 vector，而是一个裸指针槽位。

### 2.2 同步执行（无 Reactor 调度）

当 promise 被 resolve 时，续体在**当前调用栈**上立即执行：

```cpp
void resolve(T v) {
    st = status::resolved;
    value.emplace(std::move(v));
    run_continuation();       // ← 直接调用，不入队
}

void run_continuation() noexcept {
    if (continuation_) {
        auto t = std::move(continuation_);
        t->run();             // ← 当前线程立即执行
    }
}
```

对比原版 Seastar：resolve 后将 task 投递到 reactor 的任务队列，等待下一轮事件循环取出执行。

---

## 3. 为什么这样做是正确的

### 3.1 `.then()` 链天然是线性的

在 `.then()` 链式调用模型中，每个中间 future 只会被消费一次：

```
read(fd) → .then(parse) → .then(process) → .then(respond)
```

每个箭头产生一个新的 future，旧的 future 被 move 走。**没有"多个消费者等待同一个 future"的场景**。因此 `vector` 或 queue 永远只会存 0 或 1 个元素——使用它们纯属浪费。

### 3.2 原版 Seastar 也是单续体

值得注意的是，即使在原版 Seastar 中，每个 future 也只持有 **一个** `task*` 续体指针（不是续体 vector）。queue 存在于 **reactor 层面**，不在 future 内部。区别在于：

| | 原版 Seastar | seastar-future |
|---|---|---|
| future 内部续体数 | 1 个 `task*` | 1 个 `unique_ptr<task>` |
| resolve 后续体去向 | 投递到 reactor task queue | 当前栈立即执行 |
| 调度决策 | 由 reactor + scheduling_group 控制 | 无调度，立即运行 |

因此，本库的简化并不是"去掉了 future 内部的 queue"，而是**去掉了 reactor 层面的任务队列调度**，让续体在 resolve 时直接执行。

---

## 4. 优势

### 4.1 更低的延迟

续体在 resolve 时立即执行，无需等待 reactor 下一轮事件循环轮询。对于已就绪的 future，整条 `.then()` 链在一次函数调用中全部完成。

### 4.2 更少的内存分配

- 无 `std::vector` 头部开销（24 bytes on 64-bit）。
- 无 reactor task queue 的分配和管理开销。
- `unique_ptr<task>` 只有 8 字节指针大小。

### 4.3 零依赖、可嵌入

去除 reactor 和 task queue 后，库变成纯头文件（header-only），不依赖线程池、事件循环或操作系统特定 API。可以直接嵌入任何 C++17 项目。

### 4.4 更简单的心智模型

开发者不需要理解 scheduling_group、reactor 轮询策略、任务队列权重等概念。`.then()` 的语义简单明确：resolve 时立即执行续体。

### 4.5 线程安全性更可控

没有 reactor 的全局状态，使用者可以自行决定在哪个线程上创建和 resolve promise。续体在 resolve 调用者的线程上运行，行为完全可预测。

---

## 5. 劣势

### 5.1 无公平调度

没有 reactor 的调度组机制，如果一条 `.then()` 链非常长或续体执行时间较长，它会独占当前线程，无法让出 CPU 给其他任务。在原版 Seastar 中，reactor 可以在续体之间插入检查点（preemption check），确保其他任务获得执行机会。

### 5.2 无背压控制

缺少任务队列意味着无法通过队列深度感知系统负载。在高并发场景下，大量 resolve 可能导致续体递归执行，栈深度不可控。原版 Seastar 的 queue 充当了天然的缓冲区和流量整形器。

### 5.3 栈深度风险

同步执行意味着深层 `.then()` 链会导致深层函数调用栈。例如 `repeat()` 在同步模式下如果每次迭代都立即就绪，会产生递归调用。原版 Seastar 通过将续体投递到 queue 来打断递归，保持栈深度恒定。

> 本库的 `repeat()` 实现对此有一定缓解——当 future 已就绪时在循环内直接处理，但极端场景仍可能出现栈溢出。

### 5.4 无跨核调度

原版 Seastar 的 `smp::submit_to()` 通过向目标核心的 queue 投递 task 实现跨核通信。本库没有此机制，跨线程通信需要使用者自行设计（如使用锁、原子变量或第三方消息队列）。

### 5.5 无优先级控制

所有续体以 FIFO 顺序（实际是立即执行）运行，无法区分高优先级任务（如用户请求）和低优先级任务（如后台 compaction）。

---

## 6. 适用场景

| 场景 | 是否适合 |
|------|---------|
| 学习 Seastar future/promise 编程模型 | ✅ 非常适合 |
| 嵌入式或资源受限环境 | ✅ 零依赖、轻量 |
| 单线程事件驱动应用 | ✅ 配合外部事件循环使用 |
| 短链异步操作（网络请求、文件 I/O 回调） | ✅ 延迟低、开销小 |
| 高吞吐量服务器（百万级 QPS） | ⚠️ 需要自行实现调度和背压 |
| 多核并行处理 | ⚠️ 需要自行管理跨线程通信 |
| 需要公平调度的混合负载 | ❌ 缺少 scheduling_group 机制 |

---

## 7. 总结

`seastar-future` 的简化设计本质上是一种 **"移除 reactor 调度层，保留 future 语义层"** 的取舍。它让库变得简单、轻量、零依赖，适合学习和嵌入式使用；代价是失去了原版 Seastar 中 reactor 提供的公平调度、背压控制和跨核通信能力。

对于需要完整调度能力的生产级系统，应使用完整的 Seastar 框架。对于只需要 future/promise 编程模型的场景（教学、原型验证、轻量级异步回调），本库是更合适的选择。
