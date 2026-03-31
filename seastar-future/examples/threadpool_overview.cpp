#include <iostream>
#include <vector>

int main() {
    std::vector<const char*> points = {
        "Seastar threading / scheduling (future/then best practices):",
        "- Cooperative, reactor-driven; avoid blocking syscalls inside future.then continuations.",
        "- Use seastar::smp::submit_to to hop shards; keep continuations small to preserve fairness.",
        "- For blocking or CPU-heavy work, hand off to a Seastar thread pool (posix/alien) before returning to the reactor.",
        "Seastar 线程与调度（future/then 最佳实践）：",
        "- 以 reactor 驱动的协作式模型，不要在 future.then 的 continuation 内做阻塞系统调用。",
        "- 跨 shard 用 smp::submit_to，continuation 拆得小一点保证公平。",
        "- 阻塞或重 CPU 任务先交给 Seastar 线程池（posix/alien）处理，再回到 reactor。"
    };

    for (auto* p : points) {
        std::cout << p << "\n";
    }
    return 0;
}
