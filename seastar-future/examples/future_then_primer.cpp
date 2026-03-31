#include <seastar/future.hh>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<const char*> points = {
        "Why seastar future.then:",
        "- Shard-local continuations: avoids cross-core contention and extra context switches.",
        "- Auto-unwrap: returning future<T> keeps chains flat (no future<future<T>>).",
        "- Error propagation with handle_exception for graceful recovery.",
        "- finally for cleanup regardless of success/failure.",
        "seastar future.then 的优点：",
        "- continuation 默认在本 shard 执行，减少跨核争用与切换。",
        "- 返回 future<T> 会自动拆套，链路扁平、易读。",
        "- 异常通过 exception_ptr 传播，可用 handle_exception 做恢复。",
        "- finally 让清理逻辑无论成功/失败都能执行。"
    };

    for (auto* b : points) std::cout << b << "\n";

    // Tiny demo: auto-unwrap + error recovery
    auto f = seastar::make_ready_future<int>(7)
        .then([](int v) { return seastar::make_ready_future<int>(v * 2); }) // auto-unwrap
        .then([](int v) { return v + 1; })
        .handle_exception([](std::exception_ptr) { return -1; });

    std::cout << "demo result = " << f.get() << "\n";
    return 0;
}
