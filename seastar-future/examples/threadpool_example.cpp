/// @file threadpool_example.cpp
/// @brief Demonstrates thread-pool dispatch + result gathering via future/then.
///
/// Seastar's reactor is single-threaded per core; blocking or CPU-heavy work
/// must be offloaded to a separate thread pool.  This example models that
/// pattern: a tiny thread pool accepts work items and resolves a promise when
/// each item completes, so the "reactor" side can chain .then() continuations.
///
/// Advantages demonstrated:
///   - Non-blocking dispatch: submit returns future<T> immediately.
///   - when_all_succeed gathers results without manual synchronisation.
///   - Error propagation: an exception in the worker surfaces in the chain.
///   - .finally ensures cleanup even on failure.

#include <seastar/future.hh>

#include <chrono>
#include <condition_variable>
#include <functional>
#include <iostream>
#include <mutex>
#include <numeric>
#include <queue>
#include <string>
#include <thread>
#include <vector>

// ---------------------------------------------------------------------------
// Minimal thread pool (stands in for Seastar's alien / posix thread pool)
// ---------------------------------------------------------------------------

class ThreadPool {
public:
    explicit ThreadPool(std::size_t n) {
        for (std::size_t i = 0; i < n; ++i) {
            workers_.emplace_back([this] { worker_loop(); });
        }
    }

    ~ThreadPool() { shutdown(); }

    /// Submit a callable; returns a future resolved with the result.
    template <typename Func>
    seastar::future<std::invoke_result_t<Func>> submit(Func&& fn) {
        using R = std::invoke_result_t<Func>;
        auto p = std::make_shared<seastar::promise<R>>();
        auto f = p->get_future();

        {
            std::lock_guard<std::mutex> lk(mu_);
            tasks_.push([p, fn = std::forward<Func>(fn)]() mutable {
                try {
                    if constexpr (std::is_void_v<R>) {
                        fn();
                        p->set_value();
                    } else {
                        p->set_value(fn());
                    }
                } catch (...) {
                    p->set_exception(std::current_exception());
                }
            });
        }
        cv_.notify_one();
        return f;
    }

    void shutdown() {
        {
            std::lock_guard<std::mutex> lk(mu_);
            stop_ = true;
        }
        cv_.notify_all();
        for (auto& w : workers_) {
            if (w.joinable()) w.join();
        }
    }

private:
    void worker_loop() {
        for (;;) {
            std::function<void()> task;
            {
                std::unique_lock<std::mutex> lk(mu_);
                cv_.wait(lk, [this] { return stop_ || !tasks_.empty(); });
                if (stop_ && tasks_.empty()) return;
                task = std::move(tasks_.front());
                tasks_.pop();
            }
            task();
        }
    }

    std::vector<std::thread>           workers_;
    std::queue<std::function<void()>>  tasks_;
    std::mutex                         mu_;
    std::condition_variable            cv_;
    bool                               stop_ = false;
};

// ---------------------------------------------------------------------------
// Example 1 — dispatch work and gather results with when_all_succeed
// ---------------------------------------------------------------------------

void parallel_sum(ThreadPool& pool) {
    std::cout << "--- parallel sum ---\n";

    // Split a sum of 1..100 across 4 pool tasks.
    auto chunk = [](int lo, int hi) {
        return [lo, hi]() {
            int s = 0;
            for (int i = lo; i <= hi; ++i) s += i;
            return s;
        };
    };

    std::vector<seastar::future<int>> parts;
    parts.push_back(pool.submit(chunk(1, 25)));
    parts.push_back(pool.submit(chunk(26, 50)));
    parts.push_back(pool.submit(chunk(51, 75)));
    parts.push_back(pool.submit(chunk(76, 100)));

    auto total = seastar::when_all_succeed(std::move(parts))
        .then([](std::vector<int> vals) {
            return std::accumulate(vals.begin(), vals.end(), 0);
        });

    // Give pool threads time to complete.
    std::this_thread::sleep_for(std::chrono::milliseconds(20));

    std::cout << "  sum(1..100) = " << total.get() << "\n";
}

// ---------------------------------------------------------------------------
// Example 2 — post-processing chain on pool result
// ---------------------------------------------------------------------------

void transform_result(ThreadPool& pool) {
    std::cout << "\n--- transform result ---\n";

    auto f = pool.submit([]() { return 21; })
        .then([](int v) { return v * 2; })           // runs after pool resolves
        .then([](int v) { return "answer=" + std::to_string(v); })
        .finally([]() { std::cout << "  transform done\n"; });

    std::this_thread::sleep_for(std::chrono::milliseconds(10));

    std::cout << "  " << f.get() << "\n";
}

// ---------------------------------------------------------------------------
// Example 3 — error in pool task propagates through the chain
// ---------------------------------------------------------------------------

void error_propagation(ThreadPool& pool) {
    std::cout << "\n--- error propagation ---\n";

    auto f = pool.submit([]() -> int {
            throw std::runtime_error("worker crash");
        })
        .then([](int v) {
            std::cout << "  this is skipped\n";
            return v;
        })
        .handle_exception([](std::exception_ptr ep) {
            try { std::rethrow_exception(ep); }
            catch (const std::exception& e) {
                std::cout << "  recovered: " << e.what() << "\n";
            }
            return -1;
        });

    std::this_thread::sleep_for(std::chrono::milliseconds(10));

    std::cout << "  fallback value = " << f.get() << "\n";
}

// ---------------------------------------------------------------------------

int main() {
    std::cout << "=== Thread-pool example ===\n\n";

    ThreadPool pool(4);

    parallel_sum(pool);
    transform_result(pool);
    error_propagation(pool);

    pool.shutdown();

    std::cout << "\nAll thread-pool examples done.\n";
    return 0;
}
