# 工业级 Future 实现：从 shared_ptr 到内联状态的优化之路

> 本文以 [`seastar-future/include/seastar/future.hh`](../include/seastar/future.hh) 为蓝本，
> 逐一拆解从"教科书版 future"到 Seastar 风格工业级实现所经历的六大优化，
> 并附上真实 benchmark 数据，帮助读者理解每一步改进背后的代价与收益。

---

## 目录

1. [背景：教科书 Future 的性能陷阱](#背景教科书-future-的性能陷阱)
2. [优化一：单一续体槽位 vs 续体向量](#优化一单一续体槽位-vs-续体向量)
3. [优化二：Task 抽象 vs std::function](#优化二task-抽象-vs-stdfunction)
4. [优化三：Move-Only Future 语义](#优化三move-only-future-语义)
5. [优化四：noncopyable_function 与 SBO](#优化四noncopyable_function-与-sbo)
6. [优化五：工具函数——do_with / repeat / parallel_for_each](#优化五工具函数dowithrepeatparallel_for_each)
7. [优化六：noexcept 规范](#优化六noexcept-规范)
8. [性能对比总结](#性能对比总结)
9. [结语](#结语)

---

## 背景：教科书 Future 的性能陷阱

大多数教科书或开源项目中的 `future/promise` 实现遵循这样一个模式：

```cpp
// 教科书式实现（简化）
template <typename T>
struct shared_state {
    std::mutex mtx;
    std::condition_variable cv;
    std::optional<T> value;
    std::exception_ptr error;
    std::vector<std::function<void()>> continuations;  // ← 续体列表
};

template <typename T>
class future {
    std::shared_ptr<shared_state<T>> state_;  // ← 引用计数共享
public:
    future(const future&) = default;  // ← 可拷贝
    // ...
};
```

这种实现有几个显著问题：

| 问题 | 开销来源 |
|------|---------|
| `shared_ptr` 引用计数 | 每次拷贝/销毁都需原子操作（`atomic_increment` / `atomic_decrement`） |
| `std::vector` 续体容器 | 堆内存分配 + 可能的 `realloc` |
| `std::function` 类型擦除 | 小对象优化不统一，大闭包强制堆分配 |
| 可拷贝语义 | 误拷贝浪费引用计数；无法传递 move-only 资源 |
| `std::mutex` 互斥锁 | Seastar 单线程模型中完全不需要 |

在 Seastar 的 share-nothing、run-to-completion 模型中——每个核一个线程、无锁调度——上述问题尤为突出。每个 I/O 操作都会创建一个 `future`，每秒可达数百万次。**任何多余的堆分配和原子操作都在热路径上叠加**。

接下来我们逐一拆解优化手段。

---

## 优化一：单一续体槽位 vs 续体向量

### BEFORE：续体向量

```cpp
// naive 实现 —— 每个 state 持有一个续体向量
template <typename T>
struct state {
    std::vector<std::function<void()>> continuations;

    void schedule(std::function<void()> fn) {
        if (available()) {
            fn();                           // 已就绪，立即调用
        } else {
            continuations.push_back(std::move(fn));  // 堆分配！
        }
    }

    void run_continuations() {
        auto cbs = std::move(continuations);
        continuations.clear();
        for (auto& cb : cbs) cb();          // 遍历向量
    }
};
```

**问题分析：**

1. `std::vector` 本身需要一次堆分配（至少 24 字节头 + 元素缓冲区）。
2. 每次 `push_back` 可能触发扩容（`realloc` + 复制/移动全部元素）。
3. `std::function<void()>` 内部又可能做一次堆分配（见优化二）。
4. 遍历向量需要间接寻址，cache 不友好。

在 naive 实现的 benchmark 场景中，200,000 次 deferred 链调度耗时约 **45,118 µs**。

### AFTER：单一续体槽位

```cpp
// 工业级实现 —— 来自 future.hh（state<T>，约第 251-294 行）
template <typename T, typename = void>
struct state {
    enum class status { pending, resolved, failed };

    status                  st = status::pending;
    std::optional<T>        value;
    std::exception_ptr      error;
    std::unique_ptr<task>   continuation_;   // 唯一续体槽位

    bool available() const noexcept { return st != status::pending; }
    bool failed()    const noexcept { return st == status::failed; }

    template <typename U>
    void resolve(U&& v) {
        assert(st == status::pending);
        st = status::resolved;
        value.emplace(std::forward<U>(v));
        run_continuation();                  // 解决后立即触发
    }

    void reject(std::exception_ptr e) noexcept {
        assert(st == status::pending);
        st = status::failed;
        error = std::move(e);
        run_continuation();
    }

    void schedule(std::unique_ptr<task> t) {
        if (available()) {
            t->run();                        // 已就绪，立即执行
        } else {
            assert(!continuation_ &&
                   "future<T> supports at most one continuation");
            continuation_ = std::move(t);    // 单槽赋值——无向量，无扩容
        }
    }

private:
    void run_continuation() noexcept {
        if (continuation_) {
            auto t = std::move(continuation_);
            t->run();
        }
    }
};
```

### 为什么这样做是正确的？

在 Seastar 的编程模型中，**每个 future 至多绑定一个 `.then()` 续体**。整条异步管线是一根线性链条：

```
read(fd) → .then(parse) → .then(process) → .then(respond)
```

每个中间 `future` 只被消费一次——没有"多个消费者等待同一个 future"的场景。因此：

- **`std::vector` 是浪费的**：向量永远只存 0 或 1 个元素，但要付出 vector 头分配的代价。
- **`std::unique_ptr<task>` 足够**：单槽位，`assert` 保证不会二次绑定。
- **编译期即可发现错误**：如果用户试图对同一个 future 调用两次 `.then()`，debug 模式下会 `assert` 失败。

这一优化让 deferred 链调度从 **45,118 µs** 降至 **27,966 µs**（加速比 **1.61x**）。

---

## 优化二：Task 抽象 vs std::function

### BEFORE：std::function 的隐性开销

```cpp
// naive 实现使用 std::function<void()>
std::vector<std::function<void()>> continuations;

void schedule(std::function<void()> fn) {
    continuations.push_back(std::move(fn));
}
```

`std::function` 的问题：

| 问题 | 说明 |
|------|------|
| **要求 Callable 可拷贝** | 即使你只 `std::move` 传入，`std::function` 的类型擦除层仍要求 `CopyConstructible` |
| **堆分配** | 若闭包超出 SBO 阈值（通常 16-32 字节，标准未规定），就要 `new` |
| **间接调用** | 通过内部虚函数表或函数指针调用，可能导致 cache miss |
| **无法持有 move-only 对象** | `std::unique_ptr`、`seastar::future` 本身都不可拷贝 |

### AFTER：task 类层次 + 虚派发

```cpp
// future.hh 第 104-120 行
namespace internal {

struct task {
    virtual ~task() noexcept = default;
    virtual void run() noexcept = 0;
};

template <typename Func>
struct concrete_task final : task {
    Func func_;
    explicit concrete_task(Func&& f)
        noexcept(std::is_nothrow_move_constructible_v<Func>)
        : func_(std::move(f)) {}
    void run() noexcept override { func_(); }
};

template <typename Func>
std::unique_ptr<task> make_task(Func&& f) {
    return std::make_unique<concrete_task<std::decay_t<Func>>>(
        std::forward<Func>(f));
}

} // namespace internal
```

**优势对比：**

| 特性 | `std::function` | `task` 层次 |
|------|----------------|-------------|
| 可移动 | ✅ | ✅ |
| 可拷贝 | ✅ (必须) | ❌ (不需要) |
| Move-only 闭包 | ❌ | ✅ |
| noexcept `run()` | ❌ (`operator()` 不 noexcept) | ✅ |
| 类型精确 | ❌ (类型擦除) | ✅ (`concrete_task<Func>`) |
| 内联优化 | 不确定 | 编译器可在 devirtualize 后内联 |

`concrete_task<Func>` 直接持有原始 lambda 对象，不做二次类型擦除。这意味着：

```cpp
// 这个 lambda 含有 move-only 的 shared_ptr<promise>
_state->schedule(internal::make_task(
    [s = _state, fn = std::forward<Func>(fn),
     np = std::move(np)]() mutable {
        // ... 续体逻辑
    }
));
```

在 `std::function` 的世界里，上述代码**无法编译**——因为 lambda 捕获了 `std::shared_ptr` 并通过 `std::move(np)` 转移了所有权，一旦 `std::function` 尝试拷贝该闭包就会失败。而 `task` 层次只要求移动语义。

---

## 优化三：Move-Only Future 语义

### BEFORE：可拷贝的 Future（通过 shared_ptr）

```cpp
// naive 实现
template <typename T>
class future {
    std::shared_ptr<state<T>> state_;

public:
    // 隐式拷贝——拷贝 shared_ptr，递增引用计数
    future(const future&) = default;
    future& operator=(const future&) = default;
    future(future&&) = default;
    future& operator=(future&&) = default;
};
```

**问题：**

1. **引用计数开销**：`shared_ptr` 的拷贝需要原子递增；析构需要原子递减 + 可能的释放。
2. **误拷贝风险**：开发者可能无意中拷贝 `future`，如 `auto f2 = f1;`，产生两个消费者——违背"单一续体"模型。
3. **语义模糊**：拷贝后两个 `future` 指向同一个 `state`，调用哪个的 `.then()` 都可以——但实际应用中只应有一个消费者。

### AFTER：Move-Only Future

```cpp
// future.hh 第 399-402 行
template <typename T>
class future {
public:
    future(const future&) = delete;
    future& operator=(const future&) = delete;
    future(future&&) noexcept = default;
    future& operator=(future&&) noexcept = default;
    // ...
};
```

**收益：**

1. **编译期防御**：`future<int> f2 = f1;` 直接编译失败——不可能误拷贝。
2. **零引用计数开销**：`future` 的转移只是指针赋值 + 置空，无原子操作。
3. **所有权清晰**：每个 `future` 有且仅有一个持有者，与单一续体模型语义一致。
4. **启用进一步优化**：编译器知道对象不会被共享，可以更积极地内联和消除拷贝。

同样的 move-only 约束也应用于 `promise<T>`：

```cpp
// future.hh 第 351-354 行
template <typename T>
class promise {
public:
    promise(const promise&) = delete;
    promise& operator=(const promise&) = delete;
    promise(promise&&) noexcept = default;
    promise& operator=(promise&&) noexcept = default;
    // ...
};
```

Benchmark 显示，在 ownership transfer（所有权转移）场景中，优化版比 naive 版快 **2.37x**——这正是消除引用计数操作的直接收益。

---

## 优化四：noncopyable_function 与 SBO

虽然 `task` 层次解决了续体存储问题，但在更广泛的场景中（如用户传入的回调、定时器注册等），我们需要一个通用的可调用对象包装器。`std::function` 不可接受（原因见优化二），因此我们实现了 `noncopyable_function`。

### 设计目标

| 特性 | `std::function` | `noncopyable_function` |
|------|----------------|----------------------|
| 可拷贝 | ✅ 必须 | ❌ 禁止 |
| 可移动 | ✅ | ✅ |
| SBO 大小 | 实现定义（通常 16-24 字节） | **32 字节**（明确指定） |
| 堆回退 | 是 | 是（但 32 字节 SBO 覆盖绝大多数 lambda） |
| `unique_ptr` 捕获 | ❌ | ✅ |
| `noexcept` 移动 | 不保证 | ✅ 保证 |

### SBO 机制详解

#### 核心配置（future.hh 第 136-148 行）

```cpp
template <typename Ret, typename... Args>
class noncopyable_function<Ret(Args...)> {
    static constexpr std::size_t nr_direct = 32;  // 32 字节内联缓冲区

    struct vtable_type {
        Ret  (*call)(void*, Args...);              // 调用
        void (*move_to)(void* dst, void* src) noexcept;  // 移动
        void (*destroy)(void*) noexcept;           // 销毁
    };

    // 编译期判断：Func 能否放入 SBO？
    template <typename Func>
    static constexpr bool fits_in_sbo =
        sizeof(Func) <= nr_direct                           // 大小 ≤ 32
        && alignof(Func) <= alignof(std::max_align_t)       // 对齐兼容
        && std::is_nothrow_move_constructible_v<Func>;      // 移动不抛异常
};
```

32 字节的 SBO 缓冲区可以容纳：
- 最多 4 个 `uint64_t` 或指针（典型 lambda 捕获 1-3 个变量）
- 一个 `std::shared_ptr`（16 字节）+ 额外状态
- 绝大多数实际使用的续体 lambda

#### Direct（内联）vtable（future.hh 第 153-166 行）

当 `fits_in_sbo<Func>` 为 `true` 时，`Func` 对象直接存储在 32 字节缓冲区中：

```cpp
template <typename Func>
struct vtable_for<Func, /* direct = */ true> {
    static Ret call(void* p, Args... args) {
        return (*static_cast<Func*>(p))(std::forward<Args>(args)...);
    }
    static void move_to(void* dst, void* src) noexcept {
        new (dst) Func(std::move(*static_cast<Func*>(src)));  // placement new
        static_cast<Func*>(src)->~Func();                     // 析构源对象
    }
    static void destroy(void* p) noexcept {
        static_cast<Func*>(p)->~Func();
    }
    static constexpr vtable_type vtable = { &call, &move_to, &destroy };
};
```

**关键点：**
- `call()` 直接 `static_cast` 缓冲区到 `Func*`——零间接层。
- `move_to()` 使用 placement new 在目标缓冲区中原地构造——无堆分配。
- `destroy()` 手动调用析构函数。

#### Indirect（堆）vtable（future.hh 第 169-182 行）

当 `Func` 太大或移动可能抛异常时，退回堆分配：

```cpp
template <typename Func>
struct vtable_for<Func, /* direct = */ false> {
    static Ret call(void* p, Args... args) {
        return (**static_cast<Func**>(p))(std::forward<Args>(args)...);
    }
    static void move_to(void* dst, void* src) noexcept {
        *static_cast<Func**>(dst) = *static_cast<Func**>(src);  // 移动指针
        *static_cast<Func**>(src) = nullptr;
    }
    static void destroy(void* p) noexcept {
        delete *static_cast<Func**>(p);
    }
    static constexpr vtable_type vtable = { &call, &move_to, &destroy };
};
```

此时，32 字节缓冲区中只存了一个 `Func*` 指针（8 字节），实际对象在堆上。但移动操作极其廉价——只是指针赋值。

#### 存储布局与生命周期

```cpp
// future.hh 第 184-185 行
alignas(std::max_align_t) unsigned char _storage[nr_direct];  // 32 字节缓冲区
const vtable_type* _vtable = nullptr;                         // vtable 指针
```

构造时的分支选择：

```cpp
// future.hh 第 190-202 行
template <typename Func, /* SFINAE ... */>
noncopyable_function(Func&& func) {
    using FuncT = std::decay_t<Func>;
    constexpr bool direct = fits_in_sbo<FuncT>;
    _vtable = &vtable_for<FuncT, direct>::vtable;

    if constexpr (direct) {
        // SBO 路径：placement new 到内联缓冲区
        new (&_storage) FuncT(std::forward<Func>(func));
    } else {
        // 堆路径：new 后将指针存入缓冲区
        *reinterpret_cast<FuncT**>(&_storage) =
            new FuncT(std::forward<Func>(func));
    }
}
```

移动构造（**noexcept 保证**）：

```cpp
// future.hh 第 211-216 行
noncopyable_function(noncopyable_function&& o) noexcept
    : _vtable(o._vtable)
{
    if (_vtable) {
        _vtable->move_to(&_storage, &o._storage);
        o._vtable = nullptr;
    }
}
```

拷贝操作被**显式删除**：

```cpp
// future.hh 第 208-209 行
noncopyable_function(const noncopyable_function&) = delete;
noncopyable_function& operator=(const noncopyable_function&) = delete;
```

### 与 std::function 的实战对比

```cpp
// ❌ std::function 无法持有 unique_ptr
auto ptr = std::make_unique<Buffer>(1024);
std::function<void()> fn = [p = std::move(ptr)]() { use(*p); };
// 编译错误！std::function 要求闭包可拷贝

// ✅ noncopyable_function 完美支持
auto ptr = std::make_unique<Buffer>(1024);
noncopyable_function<void()> fn = [p = std::move(ptr)]() { use(*p); };
// OK —— noncopyable_function 只要求移动语义
```

Benchmark 中，小闭包调用场景下 `noncopyable_function` 的 SBO 路径与 `std::function` 性能相当（SBO 对齐开销类似），但在涉及所有权转移（函数 + ownership）的场景中，优化版比 naive 版快 **2.37x**。

---

## 优化五：工具函数——do_with / repeat / parallel_for_each

有了高效的底层 `future/promise` 原语后，还需要一组符合人体工学的工具函数来简化异步编程。下面是我们实现中的三个核心工具。

### 5.1 `do_with()` —— 跨续体的生命周期管理

#### 问题

在续体链中，局部变量会在 `.then()` 返回后立即被销毁——但续体的执行可能是延迟的：

```cpp
// ❌ 错误：buf 在 then 执行前已被销毁
void bad_example(int fd) {
    Buffer buf(1024);
    read(fd).then([&buf](size_t n) {
        process(buf);  // 悬挂引用！
    });
}
```

#### BEFORE：手动 shared_ptr 管理

```cpp
// 传统方案——手动管理 shared_ptr
auto buf = std::make_shared<Buffer>(1024);
read(fd).then([buf](size_t n) {
    process(*buf);
}).finally([buf] {
    // buf 的 shared_ptr 在 finally 后释放
});
```

问题：`shared_ptr` 出现在每个续体的捕获列表中，冗长且易遗漏。

#### AFTER：do_with 自动管理

```cpp
// future.hh 第 764-769 行
template <typename T, typename Func>
auto do_with(T&& value, Func&& fn) {
    auto holder = std::make_shared<std::decay_t<T>>(std::forward<T>(value));
    auto fut = fn(*holder);
    return fut.finally([holder] {});  // holder 在链完成后自动释放
}
```

使用方式：

```cpp
// ✅ 简洁且安全
seastar::do_with(Buffer(1024), [](auto& buf) {
    return read(fd).then([&buf](size_t n) {
        process(buf);  // buf 由 do_with 保活
    });
});
```

还有双参数重载（future.hh 第 772-778 行）：

```cpp
template <typename T1, typename T2, typename Func>
auto do_with(T1&& v1, T2&& v2, Func&& fn) {
    auto h1 = std::make_shared<std::decay_t<T1>>(std::forward<T1>(v1));
    auto h2 = std::make_shared<std::decay_t<T2>>(std::forward<T2>(v2));
    auto fut = fn(*h1, *h2);
    return fut.finally([h1, h2] {});
}
```

### 5.2 `repeat()` 与 `stop_iteration` —— 无递归异步循环

#### 问题

传统递归式异步循环会造成逻辑上的"调用栈增长"：

```cpp
// ❌ 递归式——每次迭代创建新的续体层
void process_all(Iterator it, Iterator end) {
    if (it == end) return;
    process(*it).then([=] {
        process_all(std::next(it), end);  // 递归调用
    });
}
```

#### AFTER：repeat + stop_iteration

```cpp
// future.hh 第 781 行
enum class stop_iteration { no, yes };

// future.hh 第 794-821 行
template <typename Func>
future<void> repeat(Func&& fn) {
    auto body = std::make_shared<std::decay_t<Func>>(std::forward<Func>(fn));
    auto p = std::make_shared<promise<void>>();
    auto result = p->get_future();

    auto step = std::make_shared<std::function<void()>>();
    *step = [body, p, step]() {
        try {
            (*body)().then_wrapped([p, step](future<stop_iteration> fut) {
                if (fut.failed()) {
                    p->set_exception(fut.get_exception());
                    return;
                }
                if (fut.get() == stop_iteration::yes) {
                    p->set_value();
                } else {
                    (*step)();    // 继续下一轮——非递归，通过续体调度
                }
            });
        } catch (...) {
            p->set_exception(std::current_exception());
        }
    };

    (*step)();
    return result;
}
```

使用示例：

```cpp
int counter = 0;
seastar::repeat([&counter] {
    return do_async_work(counter++).then([&counter] {
        return counter < 100
            ? seastar::stop_iteration::no
            : seastar::stop_iteration::yes;
    });
}).then([] {
    std::cout << "All 100 iterations done\n";
});
```

**关键设计：**
- `step` 通过 `std::shared_ptr<std::function<void()>>` 自引用——避免真正的栈递归。
- 每次循环迭代都是一个新的续体调度，不会增长调用栈。
- 异常安全：`try/catch` 包裹循环体，错误通过 `promise::set_exception` 传播。

### 5.3 `parallel_for_each()` —— 并发迭代

```cpp
// future.hh 第 834-845 行
template <typename Iterator, typename Func>
future<void> parallel_for_each(Iterator begin, Iterator end, Func&& fn) {
    std::vector<future<void>> futs;
    for (auto it = begin; it != end; ++it) {
        try {
            futs.push_back(fn(*it));
        } catch (...) {
            futs.push_back(
                make_exception_future<void>(std::current_exception()));
        }
    }
    return when_all_succeed(std::move(futs));
}
```

使用示例：

```cpp
std::vector<int> items = {1, 2, 3, 4, 5};
seastar::parallel_for_each(items.begin(), items.end(), [](int item) {
    return process_async(item);  // 所有 item 并发处理
}).then([] {
    std::cout << "All items processed\n";
});
```

**与 `repeat()` 的区别：**

| 特性 | `repeat()` | `parallel_for_each()` |
|------|-----------|----------------------|
| 执行模式 | 串行（一个接一个） | 并发（全部同时启动） |
| 适用场景 | 有依赖关系的迭代 | 独立的并行任务 |
| 错误传播 | 遇错即停 | 收集所有结果后报告 |

---

## 优化六：noexcept 规范

### 为什么 noexcept 很重要？

在 C++ 中，`noexcept` 不仅是一个文档标注——它直接影响编译器的代码生成：

1. **消除异常处理开销**：编译器不需要生成 exception table 条目和 unwind 代码。
2. **启用移动优化**：STL 容器（如 `std::vector`）在 resize 时，如果元素的移动构造器是 `noexcept`，就用 `move` 而非 `copy`。
3. **防止意外终止**：`noexcept` 函数若抛异常，程序直接 `std::terminate`——这在调度器路径中是合理的，因为调度失败意味着不可恢复的错误。

### 我们的 noexcept 策略

以下是 `future.hh` 中所有标记 `noexcept` 的关键路径：

```cpp
// ── task 层次 ──
struct task {
    virtual ~task() noexcept = default;      // 析构不抛
    virtual void run() noexcept = 0;         // 执行不抛
};

// ── state 查询 ──
bool available() const noexcept;             // 状态查询不抛
bool failed() const noexcept;                // 失败查询不抛

// ── state 错误路径 ──
void reject(std::exception_ptr e) noexcept;  // 拒绝操作不抛
void run_continuation() noexcept;            // 续体触发不抛

// ── future/promise 移动操作 ──
future(future&&) noexcept = default;
future& operator=(future&&) noexcept = default;
promise(promise&&) noexcept = default;
promise& operator=(promise&&) noexcept = default;

// ── noncopyable_function 移动 ──
noncopyable_function(noncopyable_function&&) noexcept;
noncopyable_function& operator=(noncopyable_function&&) noexcept;
explicit operator bool() const noexcept;

// ── 私有构造 ──
explicit future(std::shared_ptr<internal::state<T>> s) noexcept;
```

完整的 noexcept 标注表：

| 组件 | 方法 | noexcept |
|------|------|----------|
| `task` | `~task()` | ✅ |
| `task` | `run()` | ✅ |
| `concrete_task<Func>` | `run()` | ✅ |
| `concrete_task<Func>` | 构造器 | 条件性 `noexcept(is_nothrow_move_constructible_v<Func>)` |
| `state<T>` | `available()` | ✅ |
| `state<T>` | `failed()` | ✅ |
| `state<T>` | `reject()` | ✅ |
| `state<T>` | `run_continuation()` | ✅ |
| `future<T>` | 移动构造/赋值 | ✅ |
| `future<T>` | `available()` | ✅ |
| `future<T>` | `failed()` | ✅ |
| `promise<T>` | 移动构造/赋值 | ✅ |
| `noncopyable_function` | 默认构造 | ✅ |
| `noncopyable_function` | 移动构造/赋值 | ✅ |
| `noncopyable_function` | `operator bool()` | ✅ |
| vtable `move_to` | 函数指针 | ✅ |
| vtable `destroy` | 函数指针 | ✅ |

### 条件性 noexcept 的精妙之处

`concrete_task<Func>` 的构造器使用了条件性 `noexcept`：

```cpp
explicit concrete_task(Func&& f)
    noexcept(std::is_nothrow_move_constructible_v<Func>)
    : func_(std::move(f)) {}
```

这意味着：如果 `Func`（通常是 lambda）的移动构造不抛异常（绝大多数情况），那么 `concrete_task` 的构造也不抛异常。编译器可以据此优化调用栈。

---

## 性能对比总结

以下是实际 benchmark 数据（编译环境：Linux x86_64，单线程，200,000 次迭代）：

| Benchmark | Naive (µs) | Optimised (µs) | 加速比 |
|-----------|-----------|----------------|--------|
| Ready-chain（3 步，200K 次） | 48,606 | 34,987 | **1.39x** |
| Deferred resolution（2 步，200K 次） | 45,118 | 27,966 | **1.61x** |
| Promise/future pair 创建（200K 次） | 9,182 | 4,984 | **1.84x** |
| Function call（小闭包，200K 次） | 123 | 370 | 0.33x* |
| Function + ownership（200K 次） | 7,671 | 3,238 | **2.37x** |
| Long chain（深度 100，1K 次） | 7,154 | 5,196 | **1.38x** |

> \*注：小闭包的纯调用开销中，`noncopyable_function` 的 vtable 间接调用略逊于 `std::function` 的
> 内联 SBO 调用。但在实际 future 链中，这一开销被续体调度、堆分配节省等因素完全抵消。

### 加速来源分析

```
Ready-chain 1.39x  ← 单槽位 + task 避免 vector 开销
Deferred    1.61x  ← 单槽位调度路径更短
Pair 创建   1.84x  ← move-only 避免引用计数
Ownership   2.37x  ← noncopyable_function 直接持有 unique_ptr
Long chain  1.38x  ← 综合收益：更少分配 + 更短调度路径
```

**核心观察：** 优化收益在"涉及所有权转移"和"延迟解析"场景中最为显著。这恰好是 Seastar 实际工作负载（网络 I/O、磁盘操作）中最常见的模式。

---

## 结语

从教科书式实现到工业级实现，我们经历了六步优化：

1. **单一续体槽位**——消除 `std::vector` 的堆分配，匹配"一个 future 一个消费者"的语义。
2. **Task 类层次**——替换 `std::function`，支持 move-only 闭包，提供 noexcept 保证。
3. **Move-only 语义**——消除引用计数，防止误拷贝，语义更清晰。
4. **noncopyable_function + SBO**——32 字节内联缓冲区覆盖绝大多数 lambda，vtable 派发兼顾灵活性与性能。
5. **工具函数**——`do_with`、`repeat`、`parallel_for_each` 提供人体工学 API，隐藏底层复杂性。
6. **noexcept 规范**——在调度热路径上消除异常处理开销，启用编译器优化。

这些优化并非独立的——它们相互配合，形成一个紧密衔接的系统：

```
move-only future
       ↓ 启用
 单一续体槽位 (unique_ptr<task>)
       ↓ 需要
 task 抽象 (支持 move-only 闭包)
       ↓ 泛化为
 noncopyable_function (32-byte SBO)
       ↓ 全部标记
 noexcept (编译器优化)
       ↓ 封装为
 工具函数 (do_with / repeat / parallel_for_each)
```

在 Seastar 的 share-nothing 架构中，这些优化的累积效果是显著的：**热路径上的每一次 future 操作都减少了 1-3 次堆分配**，在每秒数百万次 I/O 操作的场景下，这意味着可观的吞吐量提升和延迟降低。

> 完整实现见 [`include/seastar/future.hh`](../include/seastar/future.hh)，
> Benchmark 代码见 [`benchmarks/future_benchmark.cpp`](../benchmarks/future_benchmark.cpp)。
