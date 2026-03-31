#pragma once

/// @file future.hh
/// @brief Industrial-grade Seastar-style future/promise with continuation-based
///        .then() chaining.
///
/// This is a **standalone, header-only** extraction of the core future/then
/// abstraction inspired by the Seastar framework. It is intentionally minimal
/// and dependency-free so it can be dropped into any C++17 project.
///
/// Industrial-grade improvements over a naive implementation:
///   - **Single continuation slot** – matches original Seastar's model; avoids
///     std::vector overhead per future.
///   - **task abstraction** – polymorphic task replaces std::function<void()>,
///     eliminating the copy-constructible requirement and reducing type-erasure
///     overhead.
///   - **Move-only future/promise** – prevents accidental sharing, mirrors
///     Seastar's ownership semantics.
///   - **noncopyable_function** – move-only callable wrapper with SBO, suitable
///     for move-only captures.
///   - **Utility functions** – do_with(), repeat(), parallel_for_each() for
///     common async patterns.
///   - **noexcept** on move operations and internal scheduling paths.
///
/// Key concepts (mirroring Seastar):
///   - future<T>  – a value of type T that may not yet be available.
///   - promise<T> – the producer side; fulfills exactly one associated future.
///   - .then(fn)  – register a continuation that runs when the future resolves.
///                  If fn returns future<U>, the result is automatically
///                  unwrapped to future<U> (no future<future<U>>).
///   - Errors are carried as std::exception_ptr and propagate through chains.
///
/// Usage example:
/// @code
///   seastar::promise<int> p;
///   auto f = p.get_future()
///              .then([](int v) { return v * 2; })
///              .then([](int v) { return std::to_string(v); });
///   p.set_value(21);
///   assert(f.get() == "42");
/// @endcode

#include <cassert>
#include <exception>
#include <functional>
#include <memory>
#include <optional>
#include <stdexcept>
#include <type_traits>
#include <utility>
#include <vector>

namespace seastar {

// Forward declarations
template <typename T = void> class future;
template <typename T = void> class promise;

// ---------------------------------------------------------------------------
// Type-trait helpers
// ---------------------------------------------------------------------------

template <typename T>
struct is_future : std::false_type {};
template <typename T>
struct is_future<future<T>> : std::true_type {};
template <typename T>
inline constexpr bool is_future_v = is_future<T>::value;

template <typename T>
struct future_inner_type { using type = T; };
template <typename T>
struct future_inner_type<future<T>> { using type = T; };
template <typename T>
using future_inner_type_t = typename future_inner_type<T>::type;

/// Compute invoke_result_t for Func(T), handling T=void as Func().
template <typename Func, typename T, typename = void>
struct continuation_result;

template <typename Func, typename T>
struct continuation_result<Func, T, std::enable_if_t<!std::is_void_v<T>>> {
    using type = std::invoke_result_t<Func, T>;
};

template <typename Func>
struct continuation_result<Func, void, void> {
    using type = std::invoke_result_t<Func>;
};

template <typename Func, typename T>
using continuation_result_t = typename continuation_result<Func, T>::type;

// ---------------------------------------------------------------------------
// Internal: polymorphic task abstraction
// ---------------------------------------------------------------------------
namespace internal {

/// Lightweight polymorphic task – replaces std::function<void()> for
/// continuation storage, eliminating the copy-constructible requirement
/// and reducing type-erasure overhead.  Each continuation is stored as a
/// single unique_ptr<task>, matching the original Seastar model where
/// every future has at most one continuation.
struct task {
    virtual ~task() noexcept = default;
    virtual void run() noexcept = 0;
};

template <typename Func>
struct concrete_task final : task {
    Func func_;
    explicit concrete_task(Func&& f) noexcept(std::is_nothrow_move_constructible_v<Func>)
        : func_(std::move(f)) {}
    void run() noexcept override { func_(); }
};

template <typename Func>
std::unique_ptr<task> make_task(Func&& f) {
    return std::make_unique<concrete_task<std::decay_t<Func>>>(std::forward<Func>(f));
}

} // namespace internal

// ---------------------------------------------------------------------------
// noncopyable_function – move-only callable wrapper with SBO
// ---------------------------------------------------------------------------

/// A move-only replacement for std::function that supports move-only captures.
/// Uses small-buffer optimisation (SBO) to avoid heap allocation for small
/// callables, matching the pattern used in the original Seastar codebase.
template <typename Signature>
class noncopyable_function;

template <typename Ret, typename... Args>
class noncopyable_function<Ret(Args...)> {
    static constexpr std::size_t nr_direct = 32;

    struct vtable_type {
        Ret  (*call)(void*, Args...);
        void (*move_to)(void* dst, void* src) noexcept;
        void (*destroy)(void*) noexcept;
    };

    template <typename Func>
    static constexpr bool fits_in_sbo =
        sizeof(Func) <= nr_direct
        && alignof(Func) <= alignof(std::max_align_t)
        && std::is_nothrow_move_constructible_v<Func>;

    // --- direct (SBO) vtable ------------------------------------------------
    template <typename Func, bool Direct> struct vtable_for;

    template <typename Func>
    struct vtable_for<Func, true> {
        static Ret call(void* p, Args... args) {
            return (*static_cast<Func*>(p))(std::forward<Args>(args)...);
        }
        static void move_to(void* dst, void* src) noexcept {
            new (dst) Func(std::move(*static_cast<Func*>(src)));
            static_cast<Func*>(src)->~Func();
        }
        static void destroy(void* p) noexcept {
            static_cast<Func*>(p)->~Func();
        }
        static constexpr vtable_type vtable = { &call, &move_to, &destroy };
    };

    // --- indirect (heap) vtable ---------------------------------------------
    template <typename Func>
    struct vtable_for<Func, false> {
        static Ret call(void* p, Args... args) {
            return (**static_cast<Func**>(p))(std::forward<Args>(args)...);
        }
        static void move_to(void* dst, void* src) noexcept {
            *static_cast<Func**>(dst) = *static_cast<Func**>(src);
            *static_cast<Func**>(src) = nullptr;
        }
        static void destroy(void* p) noexcept {
            delete *static_cast<Func**>(p);
        }
        static constexpr vtable_type vtable = { &call, &move_to, &destroy };
    };

    alignas(std::max_align_t) unsigned char _storage[nr_direct];
    const vtable_type* _vtable = nullptr;

public:
    noncopyable_function() noexcept = default;

    template <typename Func,
              std::enable_if_t<!std::is_same_v<std::decay_t<Func>,
                                               noncopyable_function>, int> = 0>
    noncopyable_function(Func&& func) {
        using FuncT = std::decay_t<Func>;
        constexpr bool direct = fits_in_sbo<FuncT>;
        _vtable = &vtable_for<FuncT, direct>::vtable;
        if constexpr (direct) {
            new (&_storage) FuncT(std::forward<Func>(func));
        } else {
            *reinterpret_cast<FuncT**>(&_storage) = new FuncT(std::forward<Func>(func));
        }
    }

    ~noncopyable_function() {
        if (_vtable) _vtable->destroy(&_storage);
    }

    noncopyable_function(const noncopyable_function&) = delete;
    noncopyable_function& operator=(const noncopyable_function&) = delete;

    noncopyable_function(noncopyable_function&& o) noexcept : _vtable(o._vtable) {
        if (_vtable) {
            _vtable->move_to(&_storage, &o._storage);
            o._vtable = nullptr;
        }
    }

    noncopyable_function& operator=(noncopyable_function&& o) noexcept {
        if (this != &o) {
            if (_vtable) _vtable->destroy(&_storage);
            _vtable = o._vtable;
            if (_vtable) {
                _vtable->move_to(&_storage, &o._storage);
                o._vtable = nullptr;
            }
        }
        return *this;
    }

    explicit operator bool() const noexcept { return _vtable != nullptr; }

    Ret operator()(Args... args) {
        assert(_vtable);
        return _vtable->call(&_storage, std::forward<Args>(args)...);
    }
};

// ---------------------------------------------------------------------------
// Internal shared state
// ---------------------------------------------------------------------------
namespace internal {

/// Shared state for non-void futures.
///
/// Industrial-grade improvements:
///   - Single continuation slot (unique_ptr<task>) instead of
///     vector<function<void()>>.  This matches the original Seastar
///     model where every future has at most one .then() continuation
///     and avoids heap allocation / resizing overhead of std::vector.
///   - noexcept on resolution / rejection scheduling paths.
template <typename T, typename = void>
struct state {
    enum class status { pending, resolved, failed };

    status st = status::pending;
    std::optional<T> value;
    std::exception_ptr error;
    std::unique_ptr<task> continuation_;

    bool available() const noexcept { return st != status::pending; }
    bool failed()    const noexcept { return st == status::failed; }

    template <typename U>
    void resolve(U&& v) {
        assert(st == status::pending);
        st = status::resolved;
        value.emplace(std::forward<U>(v));
        run_continuation();
    }

    void reject(std::exception_ptr e) noexcept {
        assert(st == status::pending);
        st = status::failed;
        error = std::move(e);
        run_continuation();
    }

    void schedule(std::unique_ptr<task> t) {
        if (available()) {
            t->run();
        } else {
            assert(!continuation_ && "future<T> supports at most one continuation");
            continuation_ = std::move(t);
        }
    }

private:
    void run_continuation() noexcept {
        if (continuation_) {
            auto t = std::move(continuation_);
            t->run();
        }
    }
};

/// Specialisation for void.
template <typename T>
struct state<T, std::enable_if_t<std::is_void_v<T>>> {
    enum class status { pending, resolved, failed };

    status st = status::pending;
    std::exception_ptr error;
    std::unique_ptr<task> continuation_;

    bool available() const noexcept { return st != status::pending; }
    bool failed()    const noexcept { return st == status::failed; }

    void resolve() {
        assert(st == status::pending);
        st = status::resolved;
        run_continuation();
    }

    void reject(std::exception_ptr e) noexcept {
        assert(st == status::pending);
        st = status::failed;
        error = std::move(e);
        run_continuation();
    }

    void schedule(std::unique_ptr<task> t) {
        if (available()) {
            t->run();
        } else {
            assert(!continuation_ && "future<void> supports at most one continuation");
            continuation_ = std::move(t);
        }
    }

private:
    void run_continuation() noexcept {
        if (continuation_) {
            auto t = std::move(continuation_);
            t->run();
        }
    }
};

} // namespace internal

// ---------------------------------------------------------------------------
// promise<T>  (defined before future so future methods can use it)
// ---------------------------------------------------------------------------

template <typename T>
class promise {
public:
    promise() : _state(std::make_shared<internal::state<T>>()) {}

    /// Move-only (matches Seastar semantics).
    promise(const promise&) = delete;
    promise& operator=(const promise&) = delete;
    promise(promise&&) noexcept = default;
    promise& operator=(promise&&) noexcept = default;

    /// Obtain the associated future. Defined after future<T>.
    future<T> get_future();

    /// Resolve with a value (non-void).
    template <typename U = T, std::enable_if_t<!std::is_void_v<U>, int> = 0>
    void set_value(U value) {
        _state->resolve(std::move(value));
    }

    /// Resolve (void).
    template <typename U = T, std::enable_if_t<std::is_void_v<U>, int> = 0>
    void set_value() {
        _state->resolve();
    }

    /// Reject with an exception_ptr.
    void set_exception(std::exception_ptr e) {
        _state->reject(std::move(e));
    }

    /// Convenience: reject with an exception object.
    template <typename E>
    void set_exception(E&& ex) {
        _state->reject(std::make_exception_ptr(std::forward<E>(ex)));
    }

private:
    std::shared_ptr<internal::state<T>> _state;

    template <typename U> friend class future;
};

// ---------------------------------------------------------------------------
// future<T>
// ---------------------------------------------------------------------------

template <typename T>
class future {
public:
    using value_type = T;

    /// Move-only (matches Seastar semantics – prevents accidental sharing
    /// and enables optimisations such as single-continuation slots).
    future(const future&) = delete;
    future& operator=(const future&) = delete;
    future(future&&) noexcept = default;
    future& operator=(future&&) noexcept = default;

    /// True when the future already has a value or error.
    bool available() const noexcept { return _state && _state->available(); }

    /// True when resolved with an error (only meaningful when available()).
    bool failed() const noexcept { return _state && _state->failed(); }

    /// Get the value synchronously. Throws if pending or failed.
    T get() {
        if (!_state || !_state->available()) {
            throw std::runtime_error("future is not available yet");
        }
        if (_state->failed()) {
            std::rethrow_exception(_state->error);
        }
        if constexpr (!std::is_void_v<T>) {
            return std::move(*_state->value);
        }
    }

    /// Get the stored exception_ptr. Only valid when failed().
    std::exception_ptr get_exception() const {
        assert(_state && _state->failed());
        return _state->error;
    }

    // ------------------------------------------------------------------
    // .then(fn) – continuation chaining
    // ------------------------------------------------------------------

    /// Chain a continuation. If Func returns future<U>, the result is
    /// auto-unwrapped to future<U>. Errors skip the continuation.
    template <typename Func>
    auto then(Func&& fn)
        -> future<future_inner_type_t<continuation_result_t<Func, T>>>
    {
        using raw_result  = continuation_result_t<Func, T>;
        using result_type = future_inner_type_t<raw_result>;

        auto np = std::make_shared<promise<result_type>>();
        auto nf = np->get_future();

        _state->schedule(internal::make_task(
            [s = _state, fn = std::forward<Func>(fn),
             np = std::move(np)]() mutable {
            if (s->failed()) {
                np->set_exception(s->error);
                return;
            }
            try {
                if constexpr (std::is_void_v<T>) {
                    if constexpr (is_future_v<raw_result>) {
                        auto inner = fn();
                        inner.forward_to(np);
                    } else if constexpr (std::is_void_v<result_type>) {
                        fn();
                        np->set_value();
                    } else {
                        np->set_value(fn());
                    }
                } else {
                    if constexpr (is_future_v<raw_result>) {
                        auto inner = fn(std::move(*s->value));
                        inner.forward_to(np);
                    } else if constexpr (std::is_void_v<result_type>) {
                        fn(std::move(*s->value));
                        np->set_value();
                    } else {
                        np->set_value(fn(std::move(*s->value)));
                    }
                }
            } catch (...) {
                np->set_exception(std::current_exception());
            }
        }));

        return nf;
    }

    // ------------------------------------------------------------------
    // .then_wrapped(fn) – receives the entire future (may be failed)
    // ------------------------------------------------------------------

    template <typename Func>
    auto then_wrapped(Func&& fn)
        -> future<future_inner_type_t<std::invoke_result_t<Func, future<T>>>>
    {
        using raw_result  = std::invoke_result_t<Func, future<T>>;
        using result_type = future_inner_type_t<raw_result>;

        auto np = std::make_shared<promise<result_type>>();
        auto nf = np->get_future();

        _state->schedule(internal::make_task(
            [s = _state, fn = std::forward<Func>(fn),
             np = std::move(np)]() mutable {
            try {
                future<T> wrapped(s);

                if constexpr (is_future_v<raw_result>) {
                    auto inner = fn(std::move(wrapped));
                    inner.forward_to(np);
                } else if constexpr (std::is_void_v<result_type>) {
                    fn(std::move(wrapped));
                    np->set_value();
                } else {
                    np->set_value(fn(std::move(wrapped)));
                }
            } catch (...) {
                np->set_exception(std::current_exception());
            }
        }));

        return nf;
    }

    // ------------------------------------------------------------------
    // .handle_exception(fn) – catch errors; pass through on success
    // ------------------------------------------------------------------

    template <typename Func>
    future<T> handle_exception(Func&& fn) {
        return then_wrapped([fn = std::forward<Func>(fn)](future<T> fut) mutable -> T {
            if (fut.failed()) {
                if constexpr (std::is_void_v<T>) {
                    fn(fut.get_exception());
                    return;
                } else {
                    return fn(fut.get_exception());
                }
            }
            return fut.get();
        });
    }

    // ------------------------------------------------------------------
    // .finally(fn) – side-effect regardless of outcome
    // ------------------------------------------------------------------

    template <typename Func>
    future<T> finally(Func&& fn) {
        return then_wrapped([fn = std::forward<Func>(fn)](future<T> fut) mutable -> T {
            fn();
            return fut.get(); // re-throws if failed
        });
    }

    // ------------------------------------------------------------------
    // .discard_result() – convert to future<void>
    // ------------------------------------------------------------------

    future<void> discard_result() {
        auto np = std::make_shared<promise<void>>();
        auto nf = np->get_future();

        _state->schedule(internal::make_task(
            [s = _state, np = std::move(np)]() mutable {
            if (s->failed()) {
                np->set_exception(s->error);
            } else {
                np->set_value();
            }
        }));

        return nf;
    }

    // ------------------------------------------------------------------
    // forward_to – pipe resolution into another promise
    // ------------------------------------------------------------------

    void forward_to(promise<T>& p) {
        auto target = p._state;
        _state->schedule(internal::make_task(
            [s = _state, target = std::move(target)]() {
            if (s->failed()) {
                target->reject(s->error);
            } else {
                if constexpr (std::is_void_v<T>) {
                    target->resolve();
                } else {
                    target->resolve(std::move(*s->value));
                }
            }
        }));
    }

    /// Overload taking shared_ptr to keep promise alive.
    void forward_to(std::shared_ptr<promise<T>> p) {
        auto target = p->_state;
        _state->schedule(internal::make_task(
            [s = _state, target = std::move(target)]() {
            if (s->failed()) {
                target->reject(s->error);
            } else {
                if constexpr (std::is_void_v<T>) {
                    target->resolve();
                } else {
                    target->resolve(std::move(*s->value));
                }
            }
        }));
    }

private:
    std::shared_ptr<internal::state<T>> _state;

    /// Private constructor from shared state – used by promise::get_future(),
    /// factory helpers, and internal methods like then_wrapped().
    explicit future(std::shared_ptr<internal::state<T>> s) noexcept
        : _state(std::move(s)) {}

    template <typename U> friend class future;
    template <typename U> friend class promise;

    template <typename U>
    friend future<std::decay_t<U>> make_ready_future(U&& value);
    friend future<void> make_ready_future();

    template <typename U>
    friend future<U> make_exception_future(std::exception_ptr e);

    template <typename U, typename E>
    friend future<U> make_exception_future(E&& ex);
};

// ---------------------------------------------------------------------------
// promise<T>::get_future (deferred definition)
// ---------------------------------------------------------------------------

template <typename T>
future<T> promise<T>::get_future() {
    return future<T>(_state);
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/// Create a future immediately resolved with the given value.
template <typename T>
future<std::decay_t<T>> make_ready_future(T&& value) {
    auto s = std::make_shared<internal::state<std::decay_t<T>>>();
    s->resolve(std::forward<T>(value));
    return future<std::decay_t<T>>(std::move(s));
}

/// Create a future<void> that is immediately resolved.
inline future<void> make_ready_future() {
    auto s = std::make_shared<internal::state<void>>();
    s->resolve();
    return future<void>(std::move(s));
}

/// Create a future immediately failed with the given exception_ptr.
template <typename T>
future<T> make_exception_future(std::exception_ptr e) {
    auto s = std::make_shared<internal::state<T>>();
    s->reject(std::move(e));
    return future<T>(std::move(s));
}

/// Convenience: create a failed future from an exception object.
template <typename T, typename E>
future<T> make_exception_future(E&& ex) {
    return make_exception_future<T>(std::make_exception_ptr(std::forward<E>(ex)));
}

// ---------------------------------------------------------------------------
// Combinators
// ---------------------------------------------------------------------------

/// Wait for all futures to resolve. Returns future<vector<T>>.
/// Fails with the first error encountered.
template <typename T>
future<std::vector<T>> when_all_succeed(std::vector<future<T>> futures) {
    if (futures.empty()) {
        return make_ready_future(std::vector<T>{});
    }

    struct ctx {
        std::vector<T> results;
        std::size_t remaining;
        bool failed = false;
        std::shared_ptr<promise<std::vector<T>>> p;

        ctx(std::size_t n)
            : results(n), remaining(n),
              p(std::make_shared<promise<std::vector<T>>>()) {}
    };

    auto c = std::make_shared<ctx>(futures.size());

    for (std::size_t i = 0; i < futures.size(); ++i) {
        futures[i].then_wrapped([c, i](future<T> fut) {
            if (c->failed) return;
            if (fut.failed()) {
                c->failed = true;
                c->p->set_exception(fut.get_exception());
                return;
            }
            c->results[i] = fut.get();
            if (--c->remaining == 0) {
                c->p->set_value(std::move(c->results));
            }
        });
    }

    return c->p->get_future();
}

/// Specialisation for void futures.
inline future<void> when_all_succeed(std::vector<future<void>> futures) {
    if (futures.empty()) {
        return make_ready_future();
    }

    struct ctx {
        std::size_t remaining;
        bool failed = false;
        std::shared_ptr<promise<void>> p;

        ctx(std::size_t n)
            : remaining(n), p(std::make_shared<promise<void>>()) {}
    };

    auto c = std::make_shared<ctx>(futures.size());

    for (auto& fut : futures) {
        fut.then_wrapped([c](future<void> f) {
            if (c->failed) return;
            if (f.failed()) {
                c->failed = true;
                c->p->set_exception(f.get_exception());
                return;
            }
            if (--c->remaining == 0) {
                c->p->set_value();
            }
        });
    }

    return c->p->get_future();
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/// Keep an object alive for the duration of a continuation chain.
///
/// Seastar-style ownership pattern: the object is allocated on the heap and
/// a reference is passed to the body function. The shared_ptr ensures the
/// object survives until the returned future resolves.
///
/// @code
///   seastar::do_with(std::vector<int>{1,2,3}, [](auto& vec) {
///       return seastar::make_ready_future()
///           .then([&vec] { vec.push_back(4); });
///   });
/// @endcode
template <typename T, typename Func>
auto do_with(T&& value, Func&& fn) {
    auto holder = std::make_shared<std::decay_t<T>>(std::forward<T>(value));
    auto fut = fn(*holder);
    return fut.finally([holder] {});
}

/// Two-argument overload.
template <typename T1, typename T2, typename Func>
auto do_with(T1&& v1, T2&& v2, Func&& fn) {
    auto h1 = std::make_shared<std::decay_t<T1>>(std::forward<T1>(v1));
    auto h2 = std::make_shared<std::decay_t<T2>>(std::forward<T2>(v2));
    auto fut = fn(*h1, *h2);
    return fut.finally([h1, h2] {});
}

/// Used with repeat() to signal whether to continue looping.
enum class stop_iteration { no, yes };

/// Repeatedly call a function until it returns stop_iteration::yes.
///
/// The body function must return future<stop_iteration>.
///
/// @code
///   int counter = 0;
///   seastar::repeat([&counter] {
///       if (++counter >= 5) return seastar::make_ready_future(seastar::stop_iteration::yes);
///       return seastar::make_ready_future(seastar::stop_iteration::no);
///   });
/// @endcode
template <typename Func>
future<void> repeat(Func&& fn) {
    auto body = std::make_shared<std::decay_t<Func>>(std::forward<Func>(fn));
    auto p = std::make_shared<promise<void>>();
    auto result = p->get_future();

    auto step = std::make_shared<std::function<void()>>();
    *step = [body, p, step]() {
        try {
            (*body)().then_wrapped([p, step](future<stop_iteration> fut) {
                if (fut.failed()) {
                    p->set_exception(fut.get_exception());
                    return;
                }
                if (fut.get() == stop_iteration::yes) {
                    p->set_value();
                } else {
                    (*step)();
                }
            });
        } catch (...) {
            p->set_exception(std::current_exception());
        }
    };

    (*step)();
    return result;
}

/// Execute a function for each element in [begin, end) concurrently.
///
/// All invocations are started immediately and the returned future resolves
/// when every element has been processed. Short-circuits on first error.
///
/// @code
///   std::vector<int> items = {1, 2, 3};
///   seastar::parallel_for_each(items.begin(), items.end(), [](int v) {
///       return seastar::make_ready_future();
///   });
/// @endcode
template <typename Iterator, typename Func>
future<void> parallel_for_each(Iterator begin, Iterator end, Func&& fn) {
    std::vector<future<void>> futs;
    for (auto it = begin; it != end; ++it) {
        try {
            futs.push_back(fn(*it));
        } catch (...) {
            futs.push_back(make_exception_future<void>(std::current_exception()));
        }
    }
    return when_all_succeed(std::move(futs));
}

} // namespace seastar
