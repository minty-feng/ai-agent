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
#include <chrono>
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

    // Small wait to let the detached threads publish their results before calling get().
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    std::cout << "total = " << total.get() << "\n";
}
```

## More examples / 更多示例

### 1) Error recovery fallback / 错误回退

```cpp
// Start from a failed future and recover with a default value.
auto recovered = seastar::make_exception_future<int>(std::runtime_error("oops"))
    .handle_exception([](std::exception_ptr ep) {
        try { std::rethrow_exception(ep); }
        catch (const std::exception& e) {
            std::cerr << "recovering from: " << e.what() << "\n";
        }
        return 42; // fallback value（兜底返回值）
    });
std::cout << recovered.get() << "\n"; // prints 42
```

### 2) discard_result + finally / 丢弃结果并清理

```cpp
seastar::promise<int> p;
auto f = p.get_future()
    .then([](int v) { return v * 2; })
    .discard_result()      // convert to future<void>（将结果丢弃）
    .finally([] {          // always runs（总会执行）
        std::cout << "cleanup done\n";
    });

p.set_value(10);
f.get(); // waits for cleanup to finish
```

### 3) Unwrapping nested futures / 拆套嵌套 future

```cpp
seastar::promise<int> p;
auto f = p.get_future()
    .then([](int v) {
        // return an inner future; outer will auto-unwrap（返回内层 future，外层自动拆套）
        return seastar::make_ready_future<int>(v + 1)
            .then([](int x) { return x * 3; });
    });

p.set_value(5);
std::cout << f.get() << "\n"; // prints 18
```

## Seastar concepts / Seastar 核心概念

The descriptions below summarise how Seastar's architecture shapes the way you use `future`/`.then()`.

### Network / 网络模型

- **One reactor per CPU core** — connections stay on the owning shard, so `future.then` continuations run shard-local without extra hops.（每核一个 reactor，连接固定在所属 shard 上，continuation 默认在本 shard 执行。）
- **Message passing between shards** avoids cross-core locks and minimises cache bouncing; use `smp::submit_to` to hop shards explicitly.（shard 间以消息传递代替共享锁，降低跨核缓存抖动。）
- **Zero-copy friendly** — leverages kernel offloads and DMA where available; keep continuations small to benefit from reactor pacing.（贴合零拷贝 / DMA 场景，reactor 节奏要求 continuation 足够短小。）
- **Backpressure** via `smp_service_group` and fair queueing; keep handlers fast to avoid stalling the reactor.（背压依赖公平队列，处理逻辑应保持快速。）

### Memory / 内存模型

- **Per-core memory pools** — keep data shard-local so `future.then` continuations avoid cross-core sharing of mutable state.（每核独立内存池，continuation 应尽量在本 shard 处理数据。）
- **Cross-shard transfer** uses explicit serialisation / pass-by-value style; move ownership through continuations.（跨 shard 传递需显式序列化或值传递。）
- Prefer `std::unique_ptr` / move semantics to keep ownership clear and avoid ref-count traffic.（推荐移动语义，确保所有权清晰。）

### Threading & scheduling / 线程与调度

- **Cooperative, reactor-driven** — avoid blocking syscalls inside `future.then` continuations.（以 reactor 驱动的协作式模型，不要在 continuation 内阻塞。）
- Use `seastar::smp::submit_to` to hop shards; keep continuations small to preserve fairness.（跨 shard 用 `smp::submit_to`，continuation 拆得小一点保证公平。）
- For **blocking or CPU-heavy work**, hand off to a Seastar thread pool (posix / alien) before returning to the reactor.（阻塞或重 CPU 任务先交给线程池处理。）

### Why `.then()` / `future.then` 的优点

- **Shard-local continuations** — avoids cross-core contention and extra context switches.（continuation 默认在本 shard 执行，减少跨核争用。）
- **Auto-unwrap** — returning `future<T>` inside `.then()` keeps chains flat (no `future<future<T>>`).（返回 future 会自动拆套，链路扁平。）
- **Error propagation** via `exception_ptr`, with `handle_exception` for graceful recovery.（异常自动传播，可用 handle_exception 做恢复。）
- **`finally`** ensures cleanup runs regardless of success or failure.（finally 让清理逻辑始终执行。）

## Runnable examples / 可运行示例

The `examples/` directory contains four executables that **actually use** the `seastar::future` library (not just printed descriptions).  Build them with CMake:

```bash
cd seastar-future/build
cmake --build .
./example_network       # async network I/O pipeline
./example_memory        # ownership transfer through continuations
./example_threadpool    # thread-pool dispatch + when_all_succeed
./example_future_then   # comprehensive feature tour
```

| Binary | What it demonstrates |
|--------|---------------------|
| `example_network` | Simulated accept → read → process → respond pipeline, all chained with `.then()`. Uses threads to mimic async I/O, `handle_exception` for error recovery, and `.finally` for connection cleanup. |
| `example_memory` | `unique_ptr` moving through `.then()` chains (zero-copy, single-owner), `shared_ptr` fan-out with `when_all_succeed`, and error-path ownership cleanup. |
| `example_threadpool` | A small thread pool where `submit()` returns `future<T>`. Shows parallel work dispatch, result gathering via `when_all_succeed`, post-processing `.then()` chains, and error propagation from workers. |
| `example_future_then` | Auto-unwrap, error recovery, `.finally`, deferred resolution via `promise`, `when_all_succeed` fan-out/fan-in, and `discard_result`. |

## How it works / 原理简述

- Each `future<T>`/`promise<T>` pair shares an `internal::state<T>` that stores status, `value` / `exception_ptr`, and queued continuations (参见 `include/seastar/future.hh` 中的 `state` 定义。) 
- `promise::set_value` / `set_exception` flips the state and calls `run_continuations`, running callbacks that were registered while pending（pending 期间注册的回调会被依次触发。)
- `.then` schedules the continuation immediately when the state is ready or defers it until resolution; if it returns `future<U>` we auto-unwrap via `forward_to` to avoid `future<future<...>>`（保持链式体验。)
- `.handle_exception` / `.finally` are built on `then_wrapped` for recovery and cleanup, and `when_all_succeed` aggregates multiple futures with the first error short-circuiting（首个错误立即传递给聚合 promise。)

## Differences from Seastar upstream / 与 Seastar 原版的差异

- API mirrors Seastar, but this header-only extraction uses the C++ standard library (`std::shared_ptr`, `std::function`, `std::optional`) instead of intrusive_ptr and custom continuation queues（牺牲部分优化，换取零依赖、可移植实现。)
- Continuations run synchronously on the current call stack (`schedule` executes immediately when ready), not on Seastar's reactor/scheduling groups/blocked-futures machinery（因此可在任意线程使用，但不提供调度公平性。)
- `future::get()` throws if the value is not ready, which suits examples/tests; Seastar's runtime is typically driven by its event loop rather than synchronous waiting（原版偏向协程/事件驱动场景。)

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
