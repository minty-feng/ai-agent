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

## Classic usage example / 经典用法示例

The snippet below chains `then`, error recovery, `finally`, and `when_all_succeed` to merge multiple async results while guaranteeing that cleanup still runs.（下面的例子把链式 `then`、错误恢复、`finally` 以及 `when_all_succeed` 组合在一起，展示如何把多个异步结果汇总，并确保清理逻辑始终执行：）

```cpp
#include <seastar/future.hh>
#include <iostream>
#include <numeric>
#include <thread>
#include <vector>

// Simulate async producer with a thread; real scenarios can trigger set_value via callbacks/events.
// （通过线程模拟异步生产者，真实场景可换成回调 / 事件触发 set_value。）
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
                        return 0; // Fallback return to keep the chain going（兜底返回，继续链路）
                    })
                    .finally([] {
                        std::cout << "cleanup\n"; // Executes regardless of success or failure（无论成功或失败都会执行）
                    });

    std::cout << "total = " << total.get() << "\n";
}
```

## How it works / 原理简述

- Each `future<T>`/`promise<T>` pair shares an `internal::state<T>` that stores status, value/exception_ptr, and queued continuations (参见 `include/seastar/future.hh` 中的 `state` 定义）。
- `promise::set_value` / `set_exception` flips the state and calls `run_continuations`, running callbacks that were registered while pending（pending 期间注册的回调会被依次触发）。
- `.then` uses `_state->schedule` to run or defer a continuation; if it returns `future<U>` we auto-unwrap via `forward_to` to avoid `future<future<...>>`（保持链式体验）。
- `.handle_exception` / `.finally` are built on `then_wrapped` for recovery and cleanup, and `when_all_succeed` aggregates multiple futures with the first error short-circuiting（首个错误立即传递给聚合 promise）。

## Differences from Seastar upstream / 与 Seastar 原版的差异

- API mirrors Seastar, but this header-only extraction uses the C++ standard library (`std::shared_ptr`, `std::function`, `std::optional`) instead of intrusive_ptr and custom continuation queues（牺牲部分优化，换取零依赖、可移植实现）.
- Continuations run synchronously on the current call stack (`schedule` executes immediately when ready), not on Seastar's reactor/scheduling groups/blocked-futures machinery（因此可在任意线程使用，但不提供调度公平性）.
- `future::get()` throws if the value is not ready, which suits examples/tests; Seastar's runtime is typically driven by its event loop rather than synchronous waiting（原版偏向协程/事件驱动场景）.

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
