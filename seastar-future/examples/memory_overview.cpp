#include <iostream>
#include <vector>

int main() {
    std::vector<const char*> points = {
        "Seastar memory model (with future/then implications):",
        "- Per-core memory pools; keep data shard-local so future.then continuations avoid cross-core sharing.",
        "- Cross-shard transfer uses explicit serialization/pass-by-value style; move ownership through continuations.",
        "- Prefer std::unique_ptr / move semantics to keep ownership clear and avoid ref-count traffic.",
        "Seastar 内存模型（结合 future/then）：",
        "- 每核独立内存池，future.then 的 continuation 也应尽量在本 shard 处理数据，避免跨核共享可变状态。",
        "- 跨 shard 传递需显式序列化或值传递，在 continuation 中移动所有权。",
        "- 推荐 unique_ptr / 移动语义，减少引用计数开销，确保所有权清晰。"
    };

    for (auto* p : points) {
        std::cout << p << "\n";
    }
    return 0;
}
