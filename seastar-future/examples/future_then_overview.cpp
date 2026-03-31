#include <seastar/future.hh>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<const char*> bullets = {
        "Seastar future.then advantages:",
        "- Continuations stay on the resolving shard; no extra context switches.",
        "- Auto-unwrap future<future<T>> so chains stay flat and readable.",
        "- Error propagation via exception_ptr, with handle_exception for recovery.",
        "- finally hooks for cleanup regardless of success/failure.",
        "Seastar future.then 优点：",
        "- continuation 保持在完成该 future 的 shard 上执行，避免额外切换。",
        "- 自动拆套 future<future<T>>，链路始终扁平、可读。",
        "- 错误以 exception_ptr 传播，可用 handle_exception 做恢复。",
        "- finally 支持无论成功失败都执行的收尾逻辑。"
    };

    for (auto* b : bullets) {
        std::cout << b << "\n";
    }

    // Minimal demo: composition + auto-unwrap + error handling
    auto composed = seastar::make_ready_future<int>(5)
        .then([](int v) { return seastar::make_ready_future<int>(v * 2); }) // auto-unwrap
        .then([](int v) { return v + 1; })
        .handle_exception([](std::exception_ptr) { return -1; });

    std::cout << "composed result = " << composed.get() << "\n";
    return 0;
}
