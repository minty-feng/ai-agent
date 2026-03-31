#include <iostream>
#include <vector>

int main() {
    std::vector<const char*> points = {
        "Seastar network model (future/then in practice):",
        "- One reactor (event loop) per CPU core; connections stay on the owning shard, so future.then continuations run shard-local without extra hops.",
        "- Message passing between shards avoids cross-core locks and minimizes cache bouncing; use smp::submit_to to switch shards explicitly.",
        "- Zero-copy friendly: leverages kernel offloads and DMA where available; keep continuations small to benefit from reactor pacing.",
        "- Backpressure via smp_service_group and fair queueing in real Seastar; keep handlers fast to avoid stalling the reactor.",
        "Seastar 网络模型（future/then 如何落地）：",
        "- 每个 CPU 核心一个 reactor（事件循环），连接固定在所属 shard 上，future.then 的 continuation 默认在本 shard 执行，无额外切换。",
        "- shard 间以消息传递代替共享锁，降低跨核缓存抖动；需要跨 shard 时用 smp::submit_to 显式跳转。",
        "- 贴合零拷贝/ DMA 场景，reactor 节奏要求 continuation 足够短小。",
        "- 背压依赖 smp_service_group 与公平队列（在真实 Seastar 中），处理逻辑应保持快速以免阻塞 reactor。"
    };

    for (auto* p : points) {
        std::cout << p << "\n";
    }
    return 0;
}
