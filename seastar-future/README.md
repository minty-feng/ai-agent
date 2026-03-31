# seastar-future

Standalone, header-only C++17 library that extracts the core **future / promise / .then()** continuation model from the [Seastar](https://seastar.io/) framework.

Drop `include/seastar/future.hh` into your project — no other dependencies required.

## Quick start

```cpp
#include <seastar/future.hh>
#include <iostream>

int main() {
    // --- immediate (ready) futures ---
    auto f = seastar::make_ready_future(21)
        .then([](int v) { return v * 2; })
        .then([](int v) { return std::to_string(v); });
    std::cout << f.get() << "\n"; // "42"

    // --- deferred (async) futures ---
    seastar::promise<int> p;
    auto g = p.get_future()
        .then([](int v) { return v + 1; })
        .then([](int v) { return v * 3; });

    // ... later, on some callback / event ...
    p.set_value(5);
    std::cout << g.get() << "\n"; // 18  =  (5+1)*3
}
```

## Features

| Feature | API |
|---------|-----|
| Value continuation | `future.then(fn)` |
| Auto-unwrap inner future | `future.then(fn)` where fn returns `future<U>` |
| Wrapped continuation | `future.then_wrapped(fn)` — fn receives the whole future |
| Error recovery | `future.handle_exception(fn)` |
| Finally (cleanup) | `future.finally(fn)` |
| Discard value | `future.discard_result()` → `future<void>` |
| Forward to promise | `future.forward_to(promise)` |
| Ready future | `make_ready_future(val)` / `make_ready_future()` |
| Failed future | `make_exception_future<T>(ex)` |
| Wait all | `when_all_succeed(vector<future<T>>)` |

## 经典用法示例

下面的例子把链式 `then`、错误恢复、`finally` 以及 `when_all_succeed` 组合在一起，展示如何把多个异步结果汇总，并确保清理逻辑始终执行：

```cpp
#include <seastar/future.hh>
#include <iostream>
#include <numeric>
#include <thread>
#include <vector>

// 通过线程模拟异步生产者，真实场景可换成回调/事件触发 set_value。
seastar::future<int> async_add(int a, int b) {
    seastar::promise<int> p;
    auto f = p.get_future();
    std::thread([p = std::move(p), a, b]() mutable {
        p.set_value(a + b);
    }).detach();
    return f;
}

int main() {
    auto total = seastar::when_all_succeed(std::vector<seastar::future<int>>{
                        async_add(1, 2),
                        async_add(3, 4),
                    })
                    .then([](std::vector<int> vals) {
                        return std::accumulate(vals.begin(), vals.end(), 0);
                    })
                    .handle_exception([](std::exception_ptr ep) {
                        try { std::rethrow_exception(ep); }
                        catch (const std::exception& e) {
                            std::cerr << "error: " << e.what() << "\n";
                        }
                        return 0; // 兜底返回，继续链路
                    })
                    .finally([] {
                        std::cout << "cleanup\n"; // 无论成功或失败都会执行
                    });

    std::cout << "total = " << total.get() << "\n";
}
```

## 原理简述

- 每个 `future<T>`/`promise<T>` 共享一个 `internal::state<T>`（参见 `include/seastar/future.hh`），状态包含 `status`、`value/exception_ptr` 以及待运行的 `continuations` 列表。
- `promise::set_value` / `set_exception` 会切换状态并调用 `run_continuations`，依次执行在 pending 期间注册的回调。
- `.then` 通过 `_state->schedule` 将 continuation 立即执行或挂起；当返回值是 `future<U>` 时使用 `forward_to` 自动“拆套”，保持无 `future<future<...>>` 的链式体验。
- `.handle_exception` 和 `.finally` 都基于 `then_wrapped`，分别实现错误恢复与无论结果如何的收尾动作；`when_all_succeed` 则用多个 `then_wrapped` 聚合结果并在首个错误时短路。

## 与 Seastar 原版的差异

- API 与 Seastar 保持一致，但实现上改用标准库（`std::shared_ptr`、`std::function`、`std::optional`），省去了 Seastar 中的 intrusive_ptr、自定义 continuation 队列等优化，换取可移植的头文件实现。
- Continuation 在当前调用栈上同步执行（`schedule` 如果状态已就绪会直接 `fn()`），不会像 Seastar 那样与 reactor、调度组、阻塞计数等运行时集成；这让示例可以在任何线程/环境中使用，但不提供调度公平性。
- `future::get()` 如果值未就绪会抛出异常，用于示例/测试场景；Seastar 的原版面向协程/调度环境，通常依赖事件循环驱动而非同步等待。

## Build & test

```bash
cd seastar-future
mkdir build && cd build
cmake ..
cmake --build .
ctest --output-on-failure
```

## Requirements

- C++17 compiler (GCC ≥ 7, Clang ≥ 5, MSVC ≥ 2017)
- Header-only — no link-time dependencies
