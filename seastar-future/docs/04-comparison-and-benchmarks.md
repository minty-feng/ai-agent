# 写法对比与性能分析：原版 vs 工业级 Future 实现

> 本文以 [`seastar-future/include/seastar/future.hh`](../include/seastar/future.hh) 为蓝本，
> 通过大量 **并排代码对比**（side-by-side code comparison），直观展示"教科书式"实现
> 与 Seastar 风格工业级实现在写法、内存布局和运行时效率上的差异，
> 并附上真实 benchmark 数据量化每一项改进的收益。

---

## 目录

1. [续体存储写法对比](#1-续体存储写法对比)
2. [资源所有权写法对比](#2-资源所有权写法对比)
3. [异步循环写法对比](#3-异步循环写法对比)
4. [并行处理写法对比](#4-并行处理写法对比)
5. [可调用对象写法对比](#5-可调用对象写法对比)
6. [完整 Pipeline 写法对比](#6-完整-pipeline-写法对比)
7. [性能数据分析](#7-性能数据分析)
8. [总结与最佳实践](#8-总结与最佳实践)

---

## 1. 续体存储写法对比

这是最核心的结构差异：一个 `future` 完成后如何触发后续逻辑。

### 1.1 Naive 写法：`vector<function>`

```cpp
// internal::state – naive version
// 每个 future 持有一个续体向量，允许注册任意多个回调
struct state {
    std::vector<std::function<void()>> continuations;

    void schedule(std::function<void()> fn) {
        if (available()) {
            fn();                                         // 已就绪 → 立即执行
        } else {
            continuations.push_back(std::move(fn));       // 未就绪 → 入队
        }
    }

    void run_continuations() {
        auto cbs = std::move(continuations);
        continuations.clear();
        for (auto& cb : cbs) cb();                        // 逐个触发
    }
};
```

**问题分析：**

| 开销来源 | 具体代价 |
|---------|---------|
| `std::vector` 空容器 | 至少 3 个指针 = **24 bytes**（64 位系统：`begin`、`end`、`capacity`） |
| `push_back` | 可能触发 **realloc**，将已有元素逐一移动到新内存 |
| `std::function` | 每个实例需要 type-erasure：vtable 指针 + 可能的堆分配（闭包 > SBO 阈值时） |
| 拷贝语义 | `std::function` 要求闭包可拷贝——无法直接捕获 `unique_ptr` 等 move-only 资源 |

> 💡 **关键洞察**：在 Seastar 的 `then()` 链式调用模型中，每个 `future` 至多只会有**一个**续体。
> 用 `vector` 存储续体是完全不必要的过度设计。

### 1.2 Industrial 写法：`unique_ptr<task>`

```cpp
// internal::state – industrial version
// 单一续体槽位，零容器开销
struct state {
    std::unique_ptr<task> continuation_;

    void schedule(std::unique_ptr<task> t) {
        if (available()) {
            t->run();                                     // 已就绪 → 立即执行
        } else {
            continuation_ = std::move(t);                 // 单指针交换，O(1)
        }
    }

    void run_continuation() noexcept {
        if (continuation_) {
            auto t = std::move(continuation_);
            t->run();                                     // noexcept 保证
        }
    }
};
```

**改进总结：**

| 维度 | Naive | Industrial | 改进幅度 |
|------|-------|-----------|---------|
| 空状态大小 | 24 bytes（vector） | **8 bytes**（单指针） | 3× 内存节省 |
| 注册续体 | `push_back` + 可能 realloc | 指针 swap | **O(n) → O(1)** |
| 类型擦除 | `std::function` vtable | `task` 虚函数 | 更可控，无 SBO 歧义 |
| 异常安全 | `run_continuations()` 可抛异常 | `run_continuation() noexcept` | 编译器可优化 |
| Move-only 捕获 | ❌ 不支持 | ✅ 天然支持 | — |

内存布局对比（64 位系统）：

```
Naive state:
┌─────────────────────────────────────────────────────────┐
│ vector::begin*  │ vector::end*  │ vector::capacity*     │  ← 24 bytes 固定
│ [function₀]     │ [function₁]   │ ...                   │  ← 堆上分配
│  └─ vtable*     │  └─ vtable*   │                       │  ← 每个 function 额外开销
└─────────────────────────────────────────────────────────┘

Industrial state:
┌──────────────────┐
│ continuation_*   │  ← 8 bytes，单指针，指向堆上的 task 对象
└──────────────────┘
```

---

## 2. 资源所有权写法对比

异步编程中最常见的错误之一：闭包捕获的资源在链式调用中的生命周期管理。

### 2.1 Naive 写法：被迫使用 `shared_ptr`

```cpp
// ❌ 典型反模式：因为 std::function 要求可拷贝，
//    被迫将 unique 所有权资源升级为 shared 所有权
auto buffer = std::make_shared<std::vector<char>>(1024);

async_read(fd).then([buffer](size_t n) {
    // buffer 通过 shared_ptr 引用计数保持存活
    process(buffer->data(), n);
}).then([buffer]() {
    // 每次 lambda 拷贝都会 atomic_increment 引用计数
    return async_write(fd, *buffer);
}).finally([buffer]() {
    // buffer 在最后一个 shared_ptr 析构时释放
    // 但何时释放取决于运行时——不可预测
});
```

**问题分析：**

```
shared_ptr 内存布局：
┌──────────────────────────────────────────┐
│ Control Block (16+ bytes)                │
│  ├─ strong_count: atomic<size_t>         │  ← 每次拷贝：atomic_increment
│  ├─ weak_count:   atomic<size_t>         │  ← 每次析构：atomic_decrement
│  └─ deleter / allocator                  │
├──────────────────────────────────────────┤
│ Managed Object: vector<char>(1024)       │  ← 实际数据
└──────────────────────────────────────────┘

每个 lambda 捕获 shared_ptr 时：
  拷贝 → atomic_increment(strong_count)     // ~5-40ns on x86
  析构 → atomic_decrement(strong_count)     // ~5-40ns on x86
  3 个 then() → 至少 6 次原子操作
```

### 2.2 Industrial 写法：`do_with` + 引用捕获

```cpp
// ✅ 工业级写法：do_with 在堆上分配资源，
//    保证其生命周期覆盖整个 future 链，闭包仅捕获引用
seastar::do_with(std::vector<char>(1024), [](auto& buffer) {
    return async_read(fd).then([&buffer](size_t n) {
        // buffer 是引用——零开销
        process(buffer.data(), n);
    }).then([&buffer]() {
        // 依然是引用——零原子操作
        return async_write(fd, buffer);
    });
});
// do_with 在 future 链完成后自动释放 buffer
```

**`do_with` 的实现原理：**

```cpp
// 简化版 do_with 实现
template <typename T, typename Func>
auto do_with(T&& val, Func&& func) {
    // 1. 在堆上分配资源（单次 new）
    auto ptr = std::make_unique<T>(std::forward<T>(val));
    auto& ref = *ptr;

    // 2. 执行用户函数，传入引用
    // 3. 在 future 链完成后释放资源
    return func(ref).finally([p = std::move(ptr)] {
        // p 在此析构 → 资源释放
    });
}
```

**内存开销对比：**

| 维度 | `shared_ptr` 方案 | `do_with` 方案 | 差异 |
|------|------------------|---------------|------|
| 堆分配次数 | 1（control block + 对象） | **1**（仅对象） | 持平或更优 |
| 控制块开销 | 16+ bytes | **0 bytes** | 节省 ≥16 bytes |
| 每次捕获的原子操作 | 2（inc + dec） | **0** | 完全消除 |
| 3 步链总原子操作 | ~6 次 | **0 次** | 6× 改进 |
| 资源释放时机 | 不确定（最后一个 holder 析构） | **确定**（链结束） | 更可预测 |

---

## 3. 异步循环写法对比

异步循环是服务端编程的核心模式之一：逐条处理请求、逐行读取文件、逐个发送消息。

### 3.1 Naive 写法：手动递归 + `shared_ptr<promise>`

```cpp
// ❌ 手动递归：难以阅读、容易遗漏错误处理、需要 shared_ptr 传递 promise
void process_items(std::vector<Item>& items, size_t idx,
                   std::shared_ptr<promise<void>> done) {
    if (idx >= items.size()) {
        done->set_value();                        // 终止条件
        return;
    }
    process_one(items[idx]).then([&items, idx, done]() {
        process_items(items, idx + 1, done);      // 手动递归调用
    }).handle_exception([done](std::exception_ptr e) {
        done->set_exception(e);                   // 手动传播异常
    });
}

// 调用侧
auto done = std::make_shared<promise<void>>();
auto fut = done->get_future();
process_items(items, 0, done);
return fut;
```

**问题清单：**

1. **可读性差**：递归结构隐藏了循环语义
2. **`shared_ptr<promise>`**：需要共享 promise 以便在异步回调中设置结果
3. **错误处理**：每层递归都要手动 `handle_exception`，遗漏任何一层就会导致 silent failure
4. **栈使用**：虽然 Seastar 的 future 是 continuation-based 不会爆栈，但代码结构仍暗示递归——令人困惑

### 3.2 Industrial 写法：`repeat` + `stop_iteration`

```cpp
// ✅ 声明式异步循环：意图清晰、错误自动传播
seastar::do_with(std::move(items), size_t(0),
    [](auto& items, auto& idx) {
        return seastar::repeat([&items, &idx]() -> future<stop_iteration> {
            if (idx >= items.size()) {
                return make_ready_future<stop_iteration>(stop_iteration::yes);
            }
            return process_one(items[idx++]).then([] {
                return stop_iteration::no;              // 继续循环
            });
        });
    }
);
```

**逐行对比：**

| 特性 | 手动递归 | `repeat` |
|------|---------|----------|
| 终止条件 | `if (idx >= size) done->set_value()` | `return stop_iteration::yes` |
| 递进逻辑 | `process_items(items, idx+1, done)` | `idx++` + `return stop_iteration::no` |
| 错误传播 | 手动 `handle_exception` | **自动**（future 链内建） |
| Promise 管理 | 需要 `shared_ptr<promise>` | **无需** |
| 代码行数 | ~15 行 | **~10 行** |

**更强大的变体——`repeat_until_value`：**

```cpp
// 循环直到产生结果（类似 Iterator::find）
seastar::repeat_until_value([&items, &idx]() -> future<std::optional<Item>> {
    if (idx >= items.size()) {
        return make_ready_future<std::optional<Item>>(std::nullopt);  // 未找到
    }
    return check_item(items[idx++]).then([](bool match, Item item) 
        -> std::optional<Item> {
        return match ? std::optional(std::move(item)) : std::nullopt;
    });
}).then([](Item found) {
    // 处理找到的元素
});
```

---

## 4. 并行处理写法对比

当需要同时处理多个独立任务并等待全部完成时。

### 4.1 Naive 写法：手动收集 `future` 向量

```cpp
// ❌ 手动创建 future 向量 + when_all_succeed
std::vector<future<void>> futs;
futs.reserve(items.size());                       // 需要手动 reserve

for (auto& item : items) {
    futs.push_back(process(item));                // 逐个收集
}

when_all_succeed(std::move(futs)).then([](auto) {
    std::cout << "all done\n";
}).handle_exception([](std::exception_ptr e) {
    std::cerr << "error: " << e << "\n";          // 手动错误处理
});
```

**问题：**

- `std::vector<future<void>>` 本身需要堆分配
- `push_back` 可能触发 realloc
- `when_all_succeed` 需要遍历整个 vector 注册回调
- 错误处理需要额外显式编写

### 4.2 Industrial 写法：`parallel_for_each`

```cpp
// ✅ 一行表达并行意图，错误自动聚合
seastar::parallel_for_each(items.begin(), items.end(), [](auto& item) {
    return process(item);
}).then([] {
    std::cout << "all done\n";
});
```

**`parallel_for_each` 的内部优化：**

```cpp
// 简化版实现，展示核心思想
template <typename Iterator, typename Func>
future<> parallel_for_each(Iterator begin, Iterator end, Func func) {
    // 关键优化：已就绪的 future 不需要入队
    std::vector<future<>> pending;
    while (begin != end) {
        auto f = func(*begin++);
        if (!f.available()) {
            pending.push_back(std::move(f));       // 仅收集未完成的
        } else if (f.failed()) {
            return std::move(f);                   // 快速失败
        }
        // 已完成且成功 → 直接跳过，不收集
    }
    // pending 中只有真正需要等待的 future
    return when_all_succeed(std::move(pending));
}
```

> 💡 **关键优化**：如果所有任务都是同步完成的（例如缓存命中），
> `parallel_for_each` 可能 **零堆分配**——pending vector 始终为空。

**对比表格：**

| 特性 | 手动 vector | `parallel_for_each` |
|------|-----------|-------------------|
| 堆分配 | 至少 1 次（vector） | 仅在有未完成任务时 |
| 同步完成快速路径 | ❌ 仍然收集 | ✅ 直接跳过 |
| 错误传播 | 手动 | 自动 |
| 代码量 | ~8 行 | **~3 行** |

---

## 5. 可调用对象写法对比

`std::function` 的可拷贝要求在异步编程中造成了严重的限制。

### 5.1 Naive 写法：`std::function` 的限制

```cpp
// ❌ std::function 要求闭包可拷贝——无法捕获 unique_ptr！
auto ptr = std::make_unique<Connection>(fd);

// 编译错误！std::function 会尝试拷贝 lambda，
// 而 lambda 捕获了 move-only 的 unique_ptr
// std::function<void()> fn = [p = std::move(ptr)]() {
//     p->close();
// };  // ERROR: call to deleted copy constructor

// 被迫妥协：将 unique_ptr 升级为 shared_ptr
auto ptr2 = std::make_shared<Connection>(fd);
std::function<void()> fn = [ptr2]() {
    ptr2->close();
};
// 代价：引用计数开销 + 所有权语义模糊
```

**`std::function` 的内部成本：**

```
std::function<void()> 内存布局（典型实现，如 libstdc++）：

小闭包（≤ 16 bytes）→ SBO（Small Buffer Optimization）：
┌────────────────────────────────────────┐
│ vtable_ptr*  │ [inline storage: 16B]   │  ← 总共 ~32 bytes
└────────────────────────────────────────┘

大闭包（> 16 bytes）→ 堆分配：
┌────────────────────────────────────────┐
│ vtable_ptr*  │ heap_ptr* → [closure]   │  ← 32 bytes + 堆上闭包
└────────────────────────────────────────┘

核心问题：
1. SBO 阈值因编译器/平台不同而不同（16B / 24B / 32B）
2. 超过阈值 → 强制堆分配
3. 必须支持拷贝 → 无法存储 move-only 对象
```

### 5.2 Industrial 写法：`noncopyable_function`

```cpp
// ✅ noncopyable_function 允许 move-only 捕获
auto ptr = std::make_unique<Connection>(fd);
seastar::noncopyable_function<void()> fn = [p = std::move(ptr)]() {
    p->close();  // 完美工作！
};

// 更常见的场景：作为 then() 的回调
auto conn = std::make_unique<Connection>(fd);
some_future.then([c = std::move(conn)]() mutable {
    return c->send_response();    // 直接使用 unique_ptr
    // c 在 lambda 析构时自动释放 Connection
});
```

**`noncopyable_function` 的实现要点：**

```cpp
// 简化版实现
template <typename Signature>
class noncopyable_function;

template <typename Ret, typename... Args>
class noncopyable_function<Ret(Args...)> {
    static constexpr size_t nr_direct = 32;   // SBO 缓冲区大小

    union [[gnu::may_alias]] storage {
        char direct[nr_direct];               // 内联存储（32 bytes）
        void* indirect;                       // 堆指针（大闭包）
    };

    struct vtable {
        void (*move)(noncopyable_function&, noncopyable_function&) noexcept;
        void (*destroy)(noncopyable_function&) noexcept;
        Ret  (*call)(const noncopyable_function&, Args...);
        // 注意：没有 copy！
    };

    storage _storage;
    const vtable* _vtable;

public:
    noncopyable_function(const noncopyable_function&) = delete;  // 禁止拷贝
    noncopyable_function(noncopyable_function&&) noexcept;       // 仅允许移动
    // ...
};
```

**对比表格：**

| 特性 | `std::function` | `noncopyable_function` |
|------|----------------|----------------------|
| 拷贝语义 | 可拷贝（required） | **禁止拷贝** |
| Move-only 捕获 | ❌ 不支持 | ✅ 支持 |
| SBO 阈值 | ~16 bytes（平台依赖） | **32 bytes**（可控） |
| vtable 操作 | move + **copy** + destroy + call | move + destroy + call |
| `noexcept` move | 不保证 | ✅ 保证 |

### 5.3 实际影响：任务队列的区别

```cpp
// Naive：任务队列必须用 shared_ptr 传递资源
class NaiveTaskQueue {
    std::queue<std::function<void()>> tasks_;
    // 每个 task 可能堆分配，大闭包性能不可预测
};

// Industrial：任务队列可以直接持有 move-only 资源
class IndustrialTaskQueue {
    std::queue<std::unique_ptr<task>> tasks_;
    // 每个 task 精确控制分配，析构确定性高
};
```

---

## 6. 完整 Pipeline 写法对比

以一个典型的 HTTP 请求处理流程为例，展示两种风格在实际场景中的差异。

### 6.1 Naive 写法：冗长且脆弱

```cpp
// ❌ Naive HTTP handler：大量 shared_ptr，手动错误处理
future<Response> handle_request_naive(Request req) {
    // 必须用 shared_ptr，因为多个 then() 需要共享
    auto conn = std::make_shared<DBConnection>(db_pool.get());
    auto response = std::make_shared<Response>();
    auto timer = std::make_shared<Timer>();

    timer->start();

    return validate_request(req).then([conn, req]() {
        // 查询数据库
        return conn->query("SELECT * FROM users WHERE id = ?", req.user_id);
    }).then([conn, response](QueryResult result) {
        // 处理查询结果
        response->set_body(serialize(result));
        response->set_status(200);
        return conn->query("INSERT INTO audit_log VALUES (?)", result.id);
    }).then([response](QueryResult) {
        // 忽略审计日志结果
        return make_ready_future<Response>(*response);
    }).handle_exception([response, timer](std::exception_ptr e) {
        // 手动构造错误响应
        response->set_status(500);
        response->set_body("Internal Server Error");
        timer->stop();
        log_error(e);
        return make_ready_future<Response>(*response);
    }).finally([conn, timer]() {
        // 清理资源——但 shared_ptr 可能还被其他地方持有
        timer->stop();
        conn->release();
        // conn 和 timer 的实际析构时机不确定
    });
}
```

**问题：**
- 4 个 `shared_ptr`：`conn`、`response`、`timer`、加上 lambda 捕获的拷贝
- 每个 `then()` 拷贝 `shared_ptr` → 原子操作
- `handle_exception` 和 `finally` 中重复清理逻辑
- `response` 在异常路径中可能处于不一致状态

### 6.2 Industrial 写法：简洁且安全

```cpp
// ✅ Industrial HTTP handler：do_with 管理生命周期，错误自动传播
future<Response> handle_request_industrial(Request req) {
    return do_with(
        DBConnection(db_pool.get()),  // 由 do_with 管理生命周期
        Response(),
        Timer(),
        [req = std::move(req)](auto& conn, auto& response, auto& timer) {
            timer.start();

            return validate_request(req).then([&conn, &req] {
                return conn.query("SELECT * FROM users WHERE id = ?",
                                  req.user_id);
            }).then([&conn, &response](QueryResult result) {
                response.set_body(serialize(result));
                response.set_status(200);
                return conn.query("INSERT INTO audit_log VALUES (?)",
                                  result.id);
            }).then([&response](QueryResult) {
                return std::move(response);
            }).handle_exception([&response](std::exception_ptr e) {
                log_error(e);
                response.set_status(500);
                response.set_body("Internal Server Error");
                return std::move(response);
            }).finally([&conn, &timer] {
                timer.stop();
                conn.release();
                // conn 和 timer 在 do_with 结束时确定性析构
            });
        }
    );
}
```

**逐项对比：**

| 维度 | Naive | Industrial |
|------|-------|-----------|
| 智能指针类型 | `shared_ptr` × 3 | **无**（`do_with` + 引用） |
| 原子操作总数 | ~18 次（3 指针 × 6 次捕获） | **0 次** |
| 资源析构时机 | 不确定（引用计数归零时） | **确定**（`do_with` 作用域结束） |
| 代码行数 | ~30 行 | **~25 行** |
| 可读性 | 被 `shared_ptr` 噪音干扰 | 清晰的引用语义 |
| 异常安全性 | 手动且容易遗漏 | `finally` 保证清理 |

### 6.3 编译期优化差异

```cpp
// Naive 写法中，编译器看到的 lambda 签名：
[conn, response, timer]()  // 拷贝 3 个 shared_ptr
// → 编译器无法优化掉原子操作（可能在多线程环境）

// Industrial 写法中，编译器看到的 lambda 签名：
[&conn, &response, &timer]()  // 3 个引用（本质上是指针）
// → 零额外代码，编译器可以内联整个 lambda
```

在 Seastar 的单线程模型下，`shared_ptr` 的原子操作是**纯浪费**——永远不会有第二个线程竞争引用计数。而 `do_with` + 引用完全消除了这个问题。

---

## 7. 性能数据分析

以下数据基于我们项目中的 [`benchmarks/future_benchmark.cpp`](../benchmarks/future_benchmark.cpp) 基准测试，
在典型 x86-64 环境下测量。

### 7.1 基准测试结果总览

| 基准测试 | Naive (µs) | 优化版 (µs) | 加速比 | 关键优化点 |
|---------|-----------|------------|-------|----------|
| Ready-chain（3 步，200K 次） | ~50,400 | ~37,000 | **1.36×** | 单续体槽位 + noexcept |
| Deferred（2 步，200K 次） | ~44,700 | ~30,200 | **1.48×** | task 抽象替代 std::function |
| Promise/Future 创建（200K 次） | ~9,150 | ~4,980 | **1.84×** | 消除 shared_ptr + vector 初始化 |
| 资源所有权转移（200K 次） | ~7,620 | ~3,240 | **2.35×** | do_with 替代 shared_ptr |
| 深链（depth=100，1K 次） | ~7,160 | ~5,250 | **1.36×** | 续体链尾递归优化 |

### 7.2 逐项分析

#### Ready-chain（1.36× 加速）

```
测试内容：创建一个已就绪的 future，链式调用 3 个 then()，重复 200K 次。

Naive 热路径：
  make_ready_future →
    then() → new std::function{lambda} → push_back(vector) →
    then() → new std::function{lambda} → push_back(vector) →
    then() → new std::function{lambda} → push_back(vector) →
    run_continuations() → iterate vector → call each function

Industrial 热路径：
  make_ready_future →
    then() → 检测 available() → 直接内联执行 lambda →
    then() → 检测 available() → 直接内联执行 lambda →
    then() → 检测 available() → 直接内联执行 lambda
    // 零堆分配！零续体注册！
```

> 🔑 **Ready future 快速路径**是最关键的优化。在实际服务中，大量操作（缓存命中、
> 本地计算、已完成的 I/O）返回的都是 ready future。工业级实现直接内联执行后续逻辑，
> 完全绕过续体注册和调度机制。

#### Deferred（1.48× 加速）

```
测试内容：创建 promise/future 对，注册 2 个 then()，然后 set_value()，重复 200K 次。

Naive：
  每个 then() → new std::function（type erasure + 可能堆分配）→ push_back
  set_value() → iterate vector → call each std::function

Industrial：
  每个 then() → new task（精确大小分配）→ 单指针赋值
  set_value() → 调用 continuation_->run()
```

加速原因：
1. `task` 的虚函数调用比 `std::function` 的间接调用更高效（少一层间接）
2. 单指针赋值 vs `vector::push_back`
3. `run_continuation() noexcept` 允许编译器省略异常处理代码

#### Promise/Future 创建（1.84× 加速）

```
测试内容：反复创建 promise + 获取 future + 销毁，200K 次。

Naive 构造成本：
  promise() → new shared_state{
      .mutex = std::mutex(),          // 40 bytes on Linux
      .cv = std::condition_variable(),// 48 bytes on Linux
      .value = std::optional<T>(),
      .error = std::exception_ptr(),
      .continuations = std::vector()  // 24 bytes
  };
  // 总共 ~130+ bytes，需要 shared_ptr 包裹

Industrial 构造成本：
  promise() → 初始化内联 state{
      .continuation_ = nullptr,       // 8 bytes
      .value_ = uninitialized,
      .state_ = state_flag::invalid
  };
  // 总共 ~20-30 bytes，无 shared_ptr
```

**1.84× 加速**主要来自：
- 消除 `shared_ptr` 的 control block 分配
- 消除 `mutex` 和 `condition_variable` 的初始化（Seastar 单线程不需要）
- 消除 `vector` 的初始化

#### 资源所有权转移（2.35× 加速）

```
测试内容：模拟 do_with 场景 vs shared_ptr 捕获场景，200K 次。

Naive：
  make_shared<Resource>()            // 1 alloc + control block
  → lambda capture (copy shared_ptr) // atomic_increment
  → then() lambda capture            // atomic_increment
  → then() lambda capture            // atomic_increment
  → 链完成，逐个析构                   // 3 × atomic_decrement
  // 总计：1 alloc + 6 atomic ops

Industrial：
  do_with(Resource{})                // 1 alloc（make_unique）
  → lambda capture (reference)       // 零开销
  → then() lambda capture            // 零开销
  → then() lambda capture            // 零开销
  → 链完成，unique_ptr 析构           // 1 dealloc
  // 总计：1 alloc + 0 atomic ops
```

**2.35× 是所有测试中最大的加速比**，因为原子操作在现代 CPU 上的代价远超普通内存操作：
- 原子操作需要 cache-line 独占（MESI 协议的 Exclusive 状态）
- 即使在单线程中，`atomic_increment`/`decrement` 也会发出 `lock` 前缀指令
- `lock` 前缀在 x86 上意味着 memory fence，阻止乱序执行优化

#### 深链（1.36× 加速）

```
测试内容：构造 depth=100 的 then() 链，设置值后触发执行，1K 次。

Naive：
  100 个 std::function 对象入队 vector
  → vector 多次 realloc（1→2→4→8→16→32→64→128 容量增长）
  → 遍历 100 个 function 并调用

Industrial：
  每个 then() 将前一个 future 包裹进新的 continuation_task
  → 形成链式 task 结构（类似链表）
  → set_value() 触发第一个 task，逐级展开
```

深链场景的加速较温和（1.36×），因为：
- 两种方案都需要 O(n) 次堆分配
- Industrial 的优势主要在于避免 vector realloc 和更紧凑的 task 对象

### 7.3 性能热力图

```
                        加速比分布
                 1.0×    1.5×    2.0×    2.5×
                  │       │       │       │
Ready-chain      ████████████████░░░░░░░░░░  1.36×
Deferred         ██████████████████████░░░░  1.48×
Promise创建      ████████████████████████████████  1.84×
资源所有权       ████████████████████████████████████████████  2.35×
深链             ████████████████░░░░░░░░░░  1.36×
                  │       │       │       │
                 1.0×    1.5×    2.0×    2.5×

█ = 实际加速比    ░ = 参考刻度
```

### 7.4 综合分析

从数据中可以提取出一个清晰的优化优先级：

1. **消除不必要的原子操作**（2.35×）—— `shared_ptr` → `do_with` + 引用
2. **消除不必要的对象构造**（1.84×）—— 精简 state 结构
3. **消除不必要的间接调用**（1.48×）—— `task` 替代 `std::function`
4. **利用 ready-future 快速路径**（1.36×）—— 同步完成时跳过调度
5. **避免容器 realloc**（1.36×）—— 单槽位替代 vector

这些优化并非互斥，而是**叠加生效**。在实际 Seastar 应用中（如 ScyllaDB），每秒处理数百万个 future，上述每一项优化都直接映射到可观测的吞吐量和尾延迟改善。

---

## 8. 总结与最佳实践

### 8.1 核心设计原则

经过前面七个章节的对比分析，我们可以提炼出工业级 Future 实现的核心设计原则：

| 原则 | Naive 做法 | Industrial 做法 |
|------|-----------|----------------|
| **所有权明确** | `shared_ptr` 到处传递 | `unique_ptr` / `do_with` 引用 |
| **最小化分配** | vector + function + shared_state | 单指针槽位 + 内联 state |
| **零原子操作** | `shared_ptr` 引用计数 | 单线程模型，无需原子 |
| **快速路径优先** | 统一走调度路径 | ready future 直接执行 |
| **Move-only 语义** | 可拷贝（被迫） | 禁止拷贝（by design） |

### 8.2 写法速查表

根据场景选择合适的工具：

```
需要跨 then() 共享资源？
  └─ 用 do_with()，闭包捕获引用

需要异步循环？
  └─ 简单循环 → repeat() + stop_iteration
  └─ 搜索型  → repeat_until_value()

需要并行处理集合？
  └─ parallel_for_each()

需要在闭包中移动 unique_ptr？
  └─ 直接 move 捕获——noncopyable_function 已支持

需要创建已知结果的 future？
  └─ make_ready_future<T>(value)
  └─ make_exception_future<T>(ex)

需要确保资源清理？
  └─ .finally([&] { cleanup(); })
```

### 8.3 常见反模式与修正

**反模式 1：不必要的 `shared_ptr`**

```cpp
// ❌ 反模式
auto data = std::make_shared<Data>();
return do_something().then([data] { use(*data); });

// ✅ 修正
return do_with(Data(), [](auto& data) {
    return do_something().then([&data] { use(data); });
});
```

**反模式 2：手动递归实现循环**

```cpp
// ❌ 反模式
void loop(int i, promise<> p) {
    if (i == 0) { p.set_value(); return; }
    step().then([i, p = std::move(p)]() mutable {
        loop(i - 1, std::move(p));
    });
}

// ✅ 修正
do_with(int(n), [](auto& i) {
    return repeat([&i] {
        if (i-- == 0) return make_ready_future(stop_iteration::yes);
        return step().then([] { return stop_iteration::no; });
    });
});
```

**反模式 3：忽略 ready-future 快速路径**

```cpp
// ❌ 反模式：总是通过 promise 创建 future
promise<int> p;
p.set_value(42);
return p.get_future();

// ✅ 修正：直接使用 make_ready_future
return make_ready_future<int>(42);
```

### 8.4 最终对比：完整开销矩阵

| 操作 | Naive 实现 | 工业级实现 |
|------|-----------|-----------|
| 创建 future | `new shared_state` + `shared_ptr` | 内联 state 初始化 |
| 注册 then() | `new function` + `vector::push_back` | `new task` + 指针赋值 |
| Ready future then() | 仍需注册续体 | **直接内联执行** |
| 跨 then() 传值 | `shared_ptr` + 原子操作 | `do_with` + 引用 |
| 异步循环 | 手动递归 + `shared_ptr<promise>` | `repeat` + `stop_iteration` |
| 并行执行 | `vector<future>` + `when_all` | `parallel_for_each` |
| Move-only 资源 | ❌ 需要 shared_ptr 妥协 | ✅ 原生支持 |

> **核心思想**：工业级 Future 实现的每一项优化都遵循同一个哲学——
> **不为你不使用的特性付费**（You don't pay for what you don't use）。
> 单线程不需要原子操作，单续体不需要 vector，move-only 不需要拷贝语义。
> 在每秒数百万次 future 操作的场景下，这些"微小"的差异累积成巨大的性能鸿沟。
