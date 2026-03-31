#pragma once

/// @file future.hh
/// @brief Seastar-style future/promise with continuation-based .then() chaining.
///
/// This is a **standalone, header-only** extraction of the core future/then
/// abstraction inspired by the Seastar framework. It is intentionally minimal
/// and dependency-free so it can be dropped into any C++17 project.
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
template <typename T> class future;
template <typename T> class promise;

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
// Internal shared state
// ---------------------------------------------------------------------------
namespace internal {

/// Shared state for non-void futures.
template <typename T, typename = void>
struct state {
    enum class status { pending, resolved, failed };

    status st = status::pending;
    std::optional<T> value;
    std::exception_ptr error;
    std::vector<std::function<void()>> continuations;

    bool available() const noexcept { return st != status::pending; }
    bool failed()    const noexcept { return st == status::failed; }

    template <typename U>
    void resolve(U&& v) {
        assert(st == status::pending);
        st = status::resolved;
        value.emplace(std::forward<U>(v));
        run_continuations();
    }

    void reject(std::exception_ptr e) {
        assert(st == status::pending);
        st = status::failed;
        error = std::move(e);
        run_continuations();
    }

    void schedule(std::function<void()> fn) {
        if (available()) {
            fn();
        } else {
            continuations.push_back(std::move(fn));
        }
    }

private:
    void run_continuations() {
        auto cbs = std::move(continuations);
        continuations.clear();
        for (auto& cb : cbs) cb();
    }
};

/// Specialisation for void.
template <typename T>
struct state<T, std::enable_if_t<std::is_void_v<T>>> {
    enum class status { pending, resolved, failed };

    status st = status::pending;
    std::exception_ptr error;
    std::vector<std::function<void()>> continuations;

    bool available() const noexcept { return st != status::pending; }
    bool failed()    const noexcept { return st == status::failed; }

    void resolve() {
        assert(st == status::pending);
        st = status::resolved;
        run_continuations();
    }

    void reject(std::exception_ptr e) {
        assert(st == status::pending);
        st = status::failed;
        error = std::move(e);
        run_continuations();
    }

    void schedule(std::function<void()> fn) {
        if (available()) {
            fn();
        } else {
            continuations.push_back(std::move(fn));
        }
    }

private:
    void run_continuations() {
        auto cbs = std::move(continuations);
        continuations.clear();
        for (auto& cb : cbs) cb();
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

    future() : _state(std::make_shared<internal::state<T>>()) {}

    /// True when the future already has a value or error.
    bool available() const noexcept { return _state->available(); }

    /// True when resolved with an error (only meaningful when available()).
    bool failed() const noexcept { return _state->failed(); }

    /// Get the value synchronously. Throws if pending or failed.
    T get() {
        if (_state->failed()) {
            std::rethrow_exception(_state->error);
        }
        if (!_state->available()) {
            throw std::runtime_error("future is not available yet");
        }
        if constexpr (!std::is_void_v<T>) {
            return std::move(*_state->value);
        }
    }

    /// Get the stored exception_ptr. Only valid when failed().
    std::exception_ptr get_exception() const {
        assert(_state->failed());
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

        _state->schedule([s = _state, fn = std::forward<Func>(fn),
                          np = std::move(np)]() mutable {
            if (s->failed()) {
                np->set_exception(s->error);
                return;
            }
            try {
                if constexpr (std::is_void_v<T>) {
                    // void source – call fn()
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
                    // non-void source – call fn(value)
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
        });

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

        _state->schedule([s = _state, fn = std::forward<Func>(fn),
                          np = std::move(np)]() mutable {
            try {
                future<T> wrapped;
                wrapped._state = s;

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
        });

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

        _state->schedule([s = _state, np = std::move(np)]() mutable {
            if (s->failed()) {
                np->set_exception(s->error);
            } else {
                np->set_value();
            }
        });

        return nf;
    }

    // ------------------------------------------------------------------
    // forward_to – pipe resolution into another promise
    // ------------------------------------------------------------------

    void forward_to(promise<T>& p) {
        auto target = p._state;
        _state->schedule([s = _state, target = std::move(target)]() {
            if (s->failed()) {
                target->reject(s->error);
            } else {
                if constexpr (std::is_void_v<T>) {
                    target->resolve();
                } else {
                    target->resolve(std::move(*s->value));
                }
            }
        });
    }

    /// Overload taking shared_ptr to keep promise alive.
    void forward_to(std::shared_ptr<promise<T>> p) {
        auto target = p->_state;
        _state->schedule([s = _state, target = std::move(target)]() {
            if (s->failed()) {
                target->reject(s->error);
            } else {
                if constexpr (std::is_void_v<T>) {
                    target->resolve();
                } else {
                    target->resolve(std::move(*s->value));
                }
            }
        });
    }

private:
    std::shared_ptr<internal::state<T>> _state;

    template <typename U> friend class future;
    template <typename U> friend class promise;

    template <typename U>
    friend future<std::decay_t<U>> make_ready_future(U&& value);
    friend future<void> make_ready_future();

    template <typename U>
    friend future<U> make_exception_future(std::exception_ptr e);
};

// ---------------------------------------------------------------------------
// promise<T>::get_future (deferred definition)
// ---------------------------------------------------------------------------

template <typename T>
future<T> promise<T>::get_future() {
    future<T> f;
    f._state = _state;
    return f;
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/// Create a future immediately resolved with the given value.
template <typename T>
future<std::decay_t<T>> make_ready_future(T&& value) {
    future<std::decay_t<T>> f;
    f._state->resolve(std::forward<T>(value));
    return f;
}

/// Create a future<void> that is immediately resolved.
inline future<void> make_ready_future() {
    future<void> f;
    f._state->resolve();
    return f;
}

/// Create a future immediately failed with the given exception_ptr.
template <typename T>
future<T> make_exception_future(std::exception_ptr e) {
    future<T> f;
    f._state->reject(std::move(e));
    return f;
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

} // namespace seastar
