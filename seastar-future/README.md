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
