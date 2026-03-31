/// @file future_test.cpp
/// @brief Tests for the Seastar-style future/promise implementation.
///
/// A lightweight test harness (no external deps) so the library stays
/// dependency-free.

#include <seastar/future.hh>

#include <cassert>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

static int tests_run    = 0;
static int tests_passed = 0;

#define TEST(name)                                                           \
    static void test_##name();                                               \
    struct register_##name {                                                  \
        register_##name() {                                                  \
            ++tests_run;                                                     \
            try {                                                            \
                test_##name();                                               \
                ++tests_passed;                                              \
                std::cout << "  PASS  " #name "\n";                          \
            } catch (const std::exception& e) {                              \
                std::cout << "  FAIL  " #name " — " << e.what() << "\n";     \
            } catch (...) {                                                  \
                std::cout << "  FAIL  " #name " — unknown exception\n";      \
            }                                                                \
        }                                                                    \
    } instance_##name;                                                       \
    static void test_##name()

#define ASSERT_EQ(a, b) do {                        \
    auto _a = (a); auto _b = (b);                   \
    if (_a != _b) {                                  \
        throw std::runtime_error(                    \
            std::string(#a " == " #b " failed"));    \
    }                                                \
} while(0)

#define ASSERT_TRUE(x)  do { if (!(x)) throw std::runtime_error(#x " is false"); } while(0)
#define ASSERT_FALSE(x) do { if ( (x)) throw std::runtime_error(#x " is true");  } while(0)
#define ASSERT_THROWS(expr) do {           \
    bool caught = false;                   \
    try { expr; } catch (...) { caught = true; } \
    if (!caught) throw std::runtime_error(#expr " did not throw"); \
} while(0)

// ===========================================================================
// Promise / Future basics
// ===========================================================================

TEST(pending_future) {
    seastar::promise<int> p;
    auto f = p.get_future();
    ASSERT_FALSE(f.available());
}

TEST(resolve_with_value) {
    seastar::promise<int> p;
    auto f = p.get_future();
    p.set_value(42);
    ASSERT_TRUE(f.available());
    ASSERT_FALSE(f.failed());
    ASSERT_EQ(f.get(), 42);
}

TEST(reject_with_exception) {
    seastar::promise<int> p;
    auto f = p.get_future();
    p.set_exception(std::runtime_error("boom"));
    ASSERT_TRUE(f.available());
    ASSERT_TRUE(f.failed());
    ASSERT_THROWS(f.get());
}

TEST(get_pending_throws) {
    seastar::promise<int> p;
    auto f = p.get_future();
    ASSERT_THROWS(f.get());
}

// ===========================================================================
// make_ready_future / make_exception_future
// ===========================================================================

TEST(make_ready_future_int) {
    auto f = seastar::make_ready_future(99);
    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get(), 99);
}

TEST(make_ready_future_void) {
    auto f = seastar::make_ready_future();
    ASSERT_TRUE(f.available());
    ASSERT_FALSE(f.failed());
}

TEST(make_exception_future_int) {
    auto f = seastar::make_exception_future<int>(std::runtime_error("oops"));
    ASSERT_TRUE(f.available());
    ASSERT_TRUE(f.failed());
    ASSERT_THROWS(f.get());
}

TEST(make_exception_future_void) {
    auto f = seastar::make_exception_future<void>(std::runtime_error("fail"));
    ASSERT_TRUE(f.available());
    ASSERT_TRUE(f.failed());
    ASSERT_THROWS(f.get());
}

// ===========================================================================
// .then() — synchronous continuations
// ===========================================================================

TEST(then_chain_ready) {
    auto f = seastar::make_ready_future(10)
        .then([](int v) { return v * 2; })
        .then([](int v) { return std::to_string(v); });

    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get(), std::string("20"));
}

TEST(then_chain_deferred) {
    seastar::promise<int> p;
    auto f = p.get_future()
        .then([](int v) { return v + 1; })
        .then([](int v) { return v * 3; });

    ASSERT_FALSE(f.available());
    p.set_value(5);
    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get(), 18); // (5+1)*3
}

TEST(then_unwrap_inner_future) {
    auto f = seastar::make_ready_future(3)
        .then([](int v) { return seastar::make_ready_future(v * 7); });

    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get(), 21);
}

TEST(then_unwrap_deferred_inner) {
    seastar::promise<std::string> inner;
    auto f = seastar::make_ready_future(1)
        .then([&inner](int) { return inner.get_future(); });

    ASSERT_FALSE(f.available());
    inner.set_value("hello");
    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get(), std::string("hello"));
}

TEST(then_propagates_error) {
    auto f = seastar::make_exception_future<int>(std::runtime_error("err"))
        .then([](int v) { return v + 1; })
        .then([](int v) { return v * 2; });

    ASSERT_TRUE(f.available());
    ASSERT_TRUE(f.failed());
    ASSERT_THROWS(f.get());
}

TEST(then_catches_thrown_exception) {
    auto f = seastar::make_ready_future(1)
        .then([](int) -> int { throw std::runtime_error("inside"); });

    ASSERT_TRUE(f.available());
    ASSERT_TRUE(f.failed());
    ASSERT_THROWS(f.get());
}

// ===========================================================================
// void future .then()
// ===========================================================================

TEST(void_then_chain) {
    int side_effect = 0;
    auto f = seastar::make_ready_future()
        .then([&]() { side_effect = 1; })
        .then([&]() { side_effect += 10; });

    ASSERT_TRUE(f.available());
    ASSERT_EQ(side_effect, 11);
}

TEST(void_then_returns_value) {
    auto f = seastar::make_ready_future()
        .then([]() { return 42; });

    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get(), 42);
}

TEST(void_then_returns_future) {
    auto f = seastar::make_ready_future()
        .then([]() { return seastar::make_ready_future(7); });

    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get(), 7);
}

TEST(void_then_propagates_error) {
    auto f = seastar::make_exception_future<void>(std::runtime_error("v"))
        .then([]() { return 1; });

    ASSERT_TRUE(f.failed());
}

// ===========================================================================
// .then_wrapped()
// ===========================================================================

TEST(then_wrapped_receives_resolved) {
    auto f = seastar::make_ready_future(10)
        .then_wrapped([](seastar::future<int> fut) {
            ASSERT_TRUE(fut.available());
            ASSERT_FALSE(fut.failed());
            return fut.get() + 5;
        });

    ASSERT_EQ(f.get(), 15);
}

TEST(then_wrapped_receives_failed) {
    auto f = seastar::make_exception_future<int>(std::runtime_error("e"))
        .then_wrapped([](seastar::future<int> fut) -> int {
            ASSERT_TRUE(fut.failed());
            return 0;
        });

    ASSERT_EQ(f.get(), 0);
}

// ===========================================================================
// .handle_exception()
// ===========================================================================

TEST(handle_exception_recovers) {
    auto f = seastar::make_exception_future<int>(std::runtime_error("oh no"))
        .handle_exception([](std::exception_ptr) { return -1; });

    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get(), -1);
}

TEST(handle_exception_passthrough) {
    auto f = seastar::make_ready_future(42)
        .handle_exception([](std::exception_ptr) { return -1; });

    ASSERT_EQ(f.get(), 42);
}

TEST(handle_exception_void) {
    bool caught = false;
    auto f = seastar::make_exception_future<void>(std::runtime_error("v"))
        .handle_exception([&](std::exception_ptr) { caught = true; });

    ASSERT_TRUE(f.available());
    ASSERT_FALSE(f.failed());
    ASSERT_TRUE(caught);
}

// ===========================================================================
// .finally()
// ===========================================================================

TEST(finally_on_success) {
    bool ran = false;
    auto f = seastar::make_ready_future(5)
        .finally([&]() { ran = true; });

    ASSERT_EQ(f.get(), 5);
    ASSERT_TRUE(ran);
}

TEST(finally_on_failure) {
    bool ran = false;
    auto f = seastar::make_exception_future<int>(std::runtime_error("f"))
        .finally([&]() { ran = true; });

    ASSERT_TRUE(f.failed());
    ASSERT_TRUE(ran);
}

// ===========================================================================
// .discard_result()
// ===========================================================================

TEST(discard_result) {
    auto f = seastar::make_ready_future(999).discard_result();
    ASSERT_TRUE(f.available());
    ASSERT_FALSE(f.failed());
}

TEST(discard_result_error_propagates) {
    auto f = seastar::make_exception_future<int>(std::runtime_error("d"))
        .discard_result();
    ASSERT_TRUE(f.failed());
}

// ===========================================================================
// when_all_succeed
// ===========================================================================

TEST(when_all_succeed_empty) {
    auto f = seastar::when_all_succeed(std::vector<seastar::future<int>>{});
    ASSERT_TRUE(f.available());
    ASSERT_EQ(f.get().size(), 0u);
}

TEST(when_all_succeed_ready) {
    std::vector<seastar::future<int>> futs;
    futs.push_back(seastar::make_ready_future(1));
    futs.push_back(seastar::make_ready_future(2));
    futs.push_back(seastar::make_ready_future(3));

    auto f = seastar::when_all_succeed(std::move(futs));
    auto v = f.get();
    ASSERT_EQ(v.size(), 3u);
    ASSERT_EQ(v[0], 1);
    ASSERT_EQ(v[1], 2);
    ASSERT_EQ(v[2], 3);
}

TEST(when_all_succeed_deferred) {
    seastar::promise<int> p1, p2;
    std::vector<seastar::future<int>> futs;
    futs.push_back(p1.get_future());
    futs.push_back(p2.get_future());

    auto f = seastar::when_all_succeed(std::move(futs));
    ASSERT_FALSE(f.available());

    p1.set_value(10);
    ASSERT_FALSE(f.available());

    p2.set_value(20);
    ASSERT_TRUE(f.available());
    auto v = f.get();
    ASSERT_EQ(v[0], 10);
    ASSERT_EQ(v[1], 20);
}

TEST(when_all_succeed_fails) {
    std::vector<seastar::future<int>> futs;
    futs.push_back(seastar::make_ready_future(1));
    futs.push_back(seastar::make_exception_future<int>(std::runtime_error("bad")));
    futs.push_back(seastar::make_ready_future(3));

    auto f = seastar::when_all_succeed(std::move(futs));
    ASSERT_TRUE(f.failed());
}

TEST(when_all_succeed_void) {
    std::vector<seastar::future<void>> futs;
    futs.push_back(seastar::make_ready_future());
    futs.push_back(seastar::make_ready_future());

    auto f = seastar::when_all_succeed(std::move(futs));
    ASSERT_TRUE(f.available());
    ASSERT_FALSE(f.failed());
}

// ===========================================================================
// Complex chaining
// ===========================================================================

TEST(complex_multi_step_pipeline) {
    seastar::promise<int> p;
    auto f = p.get_future()
        .then([](int v) { return v * 2; })               // 10
        .then([](int v) { return seastar::make_ready_future(v + 3); }) // 13
        .then([](int v) { return std::to_string(v) + "!"; });         // "13!"

    p.set_value(5);
    ASSERT_EQ(f.get(), std::string("13!"));
}

TEST(complex_error_recovery_mid_chain) {
    auto f = seastar::make_ready_future(1)
        .then([](int) -> int { throw std::runtime_error("mid"); })
        .handle_exception([](std::exception_ptr) { return 100; })
        .then([](int v) { return v + 1; });

    ASSERT_EQ(f.get(), 101);
}

TEST(complex_deferred_inner_mid_chain) {
    seastar::promise<int> inner;
    auto f = seastar::make_ready_future(1)
        .then([&inner](int) { return inner.get_future(); })
        .then([](int v) { return v + 10; });

    ASSERT_FALSE(f.available());
    inner.set_value(5);
    ASSERT_EQ(f.get(), 15);
}

TEST(forward_to_promise) {
    seastar::promise<int> src;
    seastar::promise<int> dst;
    auto dst_future = dst.get_future();

    src.get_future().forward_to(dst);
    ASSERT_FALSE(dst_future.available());

    src.set_value(77);
    ASSERT_TRUE(dst_future.available());
    ASSERT_EQ(dst_future.get(), 77);
}

// ===========================================================================

int main() {
    std::cout << "\n" << tests_passed << "/" << tests_run << " tests passed.\n";
    if (tests_passed != tests_run) {
        std::cout << (tests_run - tests_passed) << " FAILED.\n";
        return 1;
    }
    return 0;
}
