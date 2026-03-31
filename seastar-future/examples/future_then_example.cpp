/// @file future_then_example.cpp
/// @brief Comprehensive demo of future/then advantages: auto-unwrap, error
///        recovery, finally, when_all_succeed, and deferred resolution.
///
/// This single file exercises every major feature of the library so readers
/// can see how the patterns compose.

#include <seastar/future.hh>

#include <chrono>
#include <iostream>
#include <numeric>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

// ---------------------------------------------------------------------------
// 1) Auto-unwrap: returning future<T> inside .then() stays flat
// ---------------------------------------------------------------------------

void demo_auto_unwrap() {
    std::cout << "--- auto-unwrap ---\n";

    auto f = seastar::make_ready_future<int>(3)
        .then([](int v) {
            // Inner future is automatically unwrapped — no future<future<int>>.
            return seastar::make_ready_future<int>(v * 7);
        })
        .then([](int v) { return v + 1; });

    std::cout << "  3 * 7 + 1 = " << f.get() << "\n"; // 22
}

// ---------------------------------------------------------------------------
// 2) Error propagation + handle_exception
// ---------------------------------------------------------------------------

void demo_error_recovery() {
    std::cout << "\n--- error propagation + recovery ---\n";

    auto f = seastar::make_ready_future<int>(1)
        .then([](int) -> int {
            throw std::runtime_error("stage-2 failure");
        })
        // This .then() is skipped because the chain is in error state.
        .then([](int v) {
            std::cout << "  (skipped) v=" << v << "\n";
            return v;
        })
        // Recover gracefully.
        .handle_exception([](std::exception_ptr ep) {
            try { std::rethrow_exception(ep); }
            catch (const std::exception& e) {
                std::cout << "  caught: " << e.what() << "\n";
            }
            return -1; // fallback
        })
        .then([](int v) { return v + 100; });

    std::cout << "  recovered value + 100 = " << f.get() << "\n"; // 99
}

// ---------------------------------------------------------------------------
// 3) .finally() — cleanup regardless of outcome
// ---------------------------------------------------------------------------

void demo_finally() {
    std::cout << "\n--- finally (success) ---\n";

    bool cleaned = false;
    auto f = seastar::make_ready_future<int>(42)
        .finally([&cleaned]() {
            cleaned = true;
            std::cout << "  cleanup ran (success path)\n";
        });
    f.get();

    std::cout << "\n--- finally (failure) ---\n";

    auto g = seastar::make_exception_future<int>(std::runtime_error("boom"))
        .finally([]() {
            std::cout << "  cleanup ran (failure path)\n";
        });
    // g is still failed after finally.
    try { g.get(); } catch (...) {
        std::cout << "  exception still propagated after finally\n";
    }
}

// ---------------------------------------------------------------------------
// 4) Deferred resolution with promise + continuation chain
// ---------------------------------------------------------------------------

void demo_deferred() {
    std::cout << "\n--- deferred resolution ---\n";

    seastar::promise<int> p;
    auto f = p.get_future()
        .then([](int v) { return v * 2; })
        .then([](int v) { return std::to_string(v) + "!"; });

    std::cout << "  future available before resolve: " << f.available() << "\n";

    // Resolve from a background thread (simulates an event / callback).
    std::thread([p = std::move(p)]() mutable {
        std::this_thread::sleep_for(std::chrono::milliseconds(5));
        p.set_value(21);
    }).detach();

    std::this_thread::sleep_for(std::chrono::milliseconds(20));
    std::cout << "  result = " << f.get() << "\n"; // "42!"
}

// ---------------------------------------------------------------------------
// 5) when_all_succeed — fan-out / fan-in
// ---------------------------------------------------------------------------

seastar::future<int> async_compute(int v) {
    seastar::promise<int> p;
    auto f = p.get_future();
    std::thread([p = std::move(p), v]() mutable {
        std::this_thread::sleep_for(std::chrono::milliseconds(2));
        p.set_value(v * v);
    }).detach();
    return f;
}

void demo_when_all() {
    std::cout << "\n--- when_all_succeed ---\n";

    std::vector<seastar::future<int>> futs;
    for (int i = 1; i <= 4; ++i) {
        futs.push_back(async_compute(i));
    }

    auto sum = seastar::when_all_succeed(std::move(futs))
        .then([](std::vector<int> vals) {
            int s = std::accumulate(vals.begin(), vals.end(), 0);
            return s;
        });

    std::this_thread::sleep_for(std::chrono::milliseconds(20));
    std::cout << "  1^2 + 2^2 + 3^2 + 4^2 = " << sum.get() << "\n"; // 30
}

// ---------------------------------------------------------------------------
// 6) discard_result — convert future<T> to future<void>
// ---------------------------------------------------------------------------

void demo_discard_result() {
    std::cout << "\n--- discard_result ---\n";

    auto f = seastar::make_ready_future<int>(999)
        .then([](int v) {
            std::cout << "  processed value " << v << "\n";
            return v;
        })
        .discard_result() // future<int> → future<void>
        .then([]() {
            std::cout << "  value discarded, void continuation\n";
        });

    f.get();
}

// ---------------------------------------------------------------------------

int main() {
    std::cout << "=== Future/then comprehensive example ===\n\n";

    demo_auto_unwrap();
    demo_error_recovery();
    demo_finally();
    demo_deferred();
    demo_when_all();
    demo_discard_result();

    std::cout << "\nAll demos complete.\n";
    return 0;
}
