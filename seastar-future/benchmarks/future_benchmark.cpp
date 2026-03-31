/// @file future_benchmark.cpp
/// @brief Performance comparison benchmark for the Seastar-style future library.
///
/// Compares the industrial-grade implementation against a naive baseline to
/// demonstrate measurable efficiency improvements:
///
///   1. Single unique_ptr<task> continuation  vs  vector<function<void()>>
///   2. Move-only future (no accidental copies) vs copyable future
///   3. noncopyable_function with SBO  vs  std::function
///   4. Chain throughput (ready-future fast path)
///   5. Deferred-resolution throughput
///
/// Build:
///   cmake --build . --target future_benchmark
/// Run:
///   ./future_benchmark

#include <seastar/future.hh>

#include <chrono>
#include <cstddef>
#include <cstdint>
#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

// ---------------------------------------------------------------------------
// Timing helper
// ---------------------------------------------------------------------------
struct timer {
    using clock = std::chrono::high_resolution_clock;
    clock::time_point start;
    timer() : start(clock::now()) {}
    double elapsed_us() const {
        return std::chrono::duration<double, std::micro>(clock::now() - start).count();
    }
};

// ---------------------------------------------------------------------------
// Naive baseline (vector<function> + copyable future)
// ---------------------------------------------------------------------------
namespace naive {

template <typename T>
struct state {
    enum class status { pending, resolved, failed };
    status st = status::pending;
    std::optional<T> value;
    std::exception_ptr error;
    std::vector<std::function<void()>> continuations;

    bool available() const { return st != status::pending; }
    bool failed()    const { return st == status::failed; }

    void resolve(T v) {
        st = status::resolved;
        value.emplace(std::move(v));
        auto cbs = std::move(continuations);
        continuations.clear();
        for (auto& cb : cbs) cb();
    }
    void reject(std::exception_ptr e) {
        st = status::failed;
        error = std::move(e);
        auto cbs = std::move(continuations);
        continuations.clear();
        for (auto& cb : cbs) cb();
    }
    void schedule(std::function<void()> fn) {
        if (available()) fn();
        else continuations.push_back(std::move(fn));
    }
};

template <typename T> class future;

template <typename T>
class promise {
public:
    promise() : _s(std::make_shared<state<T>>()) {}
    future<T> get_future();
    void set_value(T v) { _s->resolve(std::move(v)); }
    void set_exception(std::exception_ptr e) { _s->reject(std::move(e)); }
private:
    std::shared_ptr<state<T>> _s;
    template <typename U> friend class future;
};

template <typename T>
class future {
public:
    future() : _s(std::make_shared<state<T>>()) {}
    bool available() const { return _s->available(); }
    T get() { return std::move(*_s->value); }

    template <typename Func>
    auto then(Func&& fn) -> future<decltype(fn(std::declval<T>()))> {
        using R = decltype(fn(std::declval<T>()));
        auto np = std::make_shared<promise<R>>();
        auto nf = np->get_future();
        _s->schedule([s = _s, fn = std::forward<Func>(fn), np]() mutable {
            if (s->failed()) {
                np->set_exception(s->error);
            } else {
                try { np->set_value(fn(std::move(*s->value))); }
                catch (...) { np->set_exception(std::current_exception()); }
            }
        });
        return nf;
    }

    std::shared_ptr<state<T>> _s;
    template <typename U> friend class promise;
};

template <typename T>
future<T> promise<T>::get_future() {
    future<T> f;
    f._s = _s;
    return f;
}

template <typename T>
future<T> make_ready(T v) {
    future<T> f;
    f._s->resolve(std::move(v));
    return f;
}

} // namespace naive

// ---------------------------------------------------------------------------
// Benchmark helpers
// ---------------------------------------------------------------------------

static constexpr std::size_t ITERATIONS = 200'000;

static void print_row(const std::string& name, double naive_us, double opt_us) {
    double speedup = naive_us / opt_us;
    std::printf("  %-40s %10.1f µs  %10.1f µs  %6.2fx\n",
                name.c_str(), naive_us, opt_us, speedup);
}

// ---------------------------------------------------------------------------
// Benchmark 1: Chain throughput on ready futures
// ---------------------------------------------------------------------------

static double bench_ready_chain_naive(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        auto f = naive::make_ready(static_cast<int>(i))
            .then([](int v) { return v + 1; })
            .then([](int v) { return v * 2; })
            .then([](int v) { return v - 1; });
        (void)f.get();
    }
    return t.elapsed_us();
}

static double bench_ready_chain_opt(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        auto f = seastar::make_ready_future(static_cast<int>(i))
            .then([](int v) { return v + 1; })
            .then([](int v) { return v * 2; })
            .then([](int v) { return v - 1; });
        (void)f.get();
    }
    return t.elapsed_us();
}

// ---------------------------------------------------------------------------
// Benchmark 2: Deferred resolution (promise→future→.then())
// ---------------------------------------------------------------------------

static double bench_deferred_naive(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        naive::promise<int> p;
        auto f = p.get_future()
            .then([](int v) { return v + 1; })
            .then([](int v) { return v * 2; });
        p.set_value(static_cast<int>(i));
        (void)f.get();
    }
    return t.elapsed_us();
}

static double bench_deferred_opt(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        seastar::promise<int> p;
        auto f = p.get_future()
            .then([](int v) { return v + 1; })
            .then([](int v) { return v * 2; });
        p.set_value(static_cast<int>(i));
        (void)f.get();
    }
    return t.elapsed_us();
}

// ---------------------------------------------------------------------------
// Benchmark 3: Promise/future pair creation overhead
// ---------------------------------------------------------------------------

static double bench_pair_creation_naive(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        naive::promise<int> p;
        auto f = p.get_future();
        p.set_value(static_cast<int>(i));
        (void)f.get();
    }
    return t.elapsed_us();
}

static double bench_pair_creation_opt(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        seastar::promise<int> p;
        auto f = p.get_future();
        p.set_value(static_cast<int>(i));
        (void)f.get();
    }
    return t.elapsed_us();
}

// ---------------------------------------------------------------------------
// Benchmark 4: noncopyable_function vs std::function
// ---------------------------------------------------------------------------

static double bench_std_function(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        std::function<int(int)> fn = [](int x) { return x * 2 + 1; };
        volatile int r = fn(static_cast<int>(i));
        (void)r;
    }
    return t.elapsed_us();
}

static double bench_noncopyable_function(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        seastar::noncopyable_function<int(int)> fn = [](int x) { return x * 2 + 1; };
        volatile int r = fn(static_cast<int>(i));
        (void)r;
    }
    return t.elapsed_us();
}

// ---------------------------------------------------------------------------
// Benchmark 5: noncopyable_function with move-only capture
// ---------------------------------------------------------------------------

static double bench_std_function_capture(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        // std::function requires copyable capture – must use shared_ptr
        auto ptr = std::make_shared<int>(static_cast<int>(i));
        std::function<int()> fn = [ptr]() { return *ptr; };
        volatile int r = fn();
        (void)r;
    }
    return t.elapsed_us();
}

static double bench_noncopyable_function_capture(std::size_t n) {
    timer t;
    for (std::size_t i = 0; i < n; ++i) {
        // noncopyable_function supports unique_ptr directly – no shared_ptr needed
        auto ptr = std::make_unique<int>(static_cast<int>(i));
        seastar::noncopyable_function<int()> fn = [p = std::move(ptr)]() { return *p; };
        volatile int r = fn();
        (void)r;
    }
    return t.elapsed_us();
}

// ---------------------------------------------------------------------------
// Benchmark 6: Long chain depth
// ---------------------------------------------------------------------------

static double bench_long_chain_naive(std::size_t depth) {
    timer t;
    for (std::size_t rep = 0; rep < 1000; ++rep) {
        auto f = naive::make_ready(0);
        for (std::size_t d = 0; d < depth; ++d) {
            f = f.then([](int v) { return v + 1; });
        }
        (void)f.get();
    }
    return t.elapsed_us();
}

static double bench_long_chain_opt(std::size_t depth) {
    timer t;
    for (std::size_t rep = 0; rep < 1000; ++rep) {
        auto f = seastar::make_ready_future(0);
        for (std::size_t d = 0; d < depth; ++d) {
            f = std::move(f).then([](int v) { return v + 1; });
        }
        (void)f.get();
    }
    return t.elapsed_us();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

int main() {
    std::cout << "\n╔══════════════════════════════════════════════════════════════════════════╗\n"
              << "║            Seastar Future – Industrial-Grade Performance Benchmark       ║\n"
              << "║  Comparing: naive (vector<function>) vs optimised (single task + SBO)    ║\n"
              << "╚══════════════════════════════════════════════════════════════════════════╝\n\n";

    std::printf("  %-40s %12s  %12s  %s\n",
                "Benchmark", "Naive", "Optimised", "Speedup");
    std::cout << "  " << std::string(78, '-') << "\n";

    // Warm up
    bench_ready_chain_naive(1000);
    bench_ready_chain_opt(1000);

    // Run benchmarks
    auto t1n = bench_ready_chain_naive(ITERATIONS);
    auto t1o = bench_ready_chain_opt(ITERATIONS);
    print_row("Ready-chain (3-step, " + std::to_string(ITERATIONS) + "x)", t1n, t1o);

    auto t2n = bench_deferred_naive(ITERATIONS);
    auto t2o = bench_deferred_opt(ITERATIONS);
    print_row("Deferred (2-step, " + std::to_string(ITERATIONS) + "x)", t2n, t2o);

    auto t3n = bench_pair_creation_naive(ITERATIONS);
    auto t3o = bench_pair_creation_opt(ITERATIONS);
    print_row("Promise/future pair (" + std::to_string(ITERATIONS) + "x)", t3n, t3o);

    auto t4n = bench_std_function(ITERATIONS);
    auto t4o = bench_noncopyable_function(ITERATIONS);
    print_row("Function call (small, " + std::to_string(ITERATIONS) + "x)", t4n, t4o);

    auto t5n = bench_std_function_capture(ITERATIONS);
    auto t5o = bench_noncopyable_function_capture(ITERATIONS);
    print_row("Function + ownership (" + std::to_string(ITERATIONS) + "x)", t5n, t5o);

    auto t6n = bench_long_chain_naive(100);
    auto t6o = bench_long_chain_opt(100);
    print_row("Long chain (depth=100, 1000x)", t6n, t6o);

    std::cout << "\n  Notes:\n"
              << "    - Lower is better.  Speedup > 1.0 means optimised version is faster.\n"
              << "    - 'Naive' uses vector<function<void()>> continuations (copyable future).\n"
              << "    - 'Optimised' uses single unique_ptr<task> (move-only future + SBO).\n"
              << "    - Benchmark runs in a single thread; no reactor overhead.\n\n";

    return 0;
}
