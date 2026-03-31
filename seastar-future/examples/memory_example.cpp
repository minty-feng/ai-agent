/// @file memory_example.cpp
/// @brief Demonstrates ownership transfer through future/then continuation chains.
///
/// In Seastar's per-core memory model every allocation lives on one shard.
/// Continuations should move (not copy) data to keep ownership clear and avoid
/// ref-count / cross-core traffic.
///
/// Advantages demonstrated:
///   - std::unique_ptr moves through .then() — zero-copy, single-owner.
///   - Shared buffers via std::shared_ptr when fan-out is needed.
///   - Error propagation preserves ownership semantics.
///   - .finally runs cleanup even when earlier stages fail.

#include <seastar/future.hh>

#include <cassert>
#include <cstring>
#include <iostream>
#include <memory>
#include <numeric>
#include <string>
#include <vector>

// ---------------------------------------------------------------------------
// A simple "Buffer" to represent a shard-local memory region.
// ---------------------------------------------------------------------------
struct Buffer {
    std::vector<char> data;
    explicit Buffer(std::size_t n) : data(n, '\0') {}
    std::size_t size() const { return data.size(); }
};

// ---------------------------------------------------------------------------
// Example 1 — unique_ptr ownership transfer through a pipeline
// ---------------------------------------------------------------------------

/// Simulate allocating a buffer (shard-local), filling it, checksumming it,
/// then releasing it — all via .then() with move semantics.
void unique_ptr_pipeline() {
    std::cout << "--- unique_ptr pipeline ---\n";

    auto f = seastar::make_ready_future<std::unique_ptr<Buffer>>(
                 std::make_unique<Buffer>(64))
        // Stage 1: fill the buffer (ownership moved in).
        .then([](std::unique_ptr<Buffer> buf) {
            std::memset(buf->data.data(), 0xAB, buf->size());
            std::cout << "  filled " << buf->size() << " bytes\n";
            return buf; // move out
        })
        // Stage 2: compute a checksum.
        .then([](std::unique_ptr<Buffer> buf) {
            int sum = std::accumulate(buf->data.begin(), buf->data.end(), 0);
            std::cout << "  checksum = " << sum << "\n";
            return buf; // move out
        })
        // Stage 3: "send" it (consume).
        .then([](std::unique_ptr<Buffer> buf) {
            std::cout << "  sent buffer (" << buf->size() << " bytes)\n";
            // buf is destroyed here — single owner, deterministic cleanup.
        })
        .finally([]() {
            std::cout << "  pipeline done\n";
        });

    f.get();
}

// ---------------------------------------------------------------------------
// Example 2 — shared_ptr fan-out (broadcast a buffer to multiple consumers)
// ---------------------------------------------------------------------------

void shared_ptr_fanout() {
    std::cout << "\n--- shared_ptr fan-out ---\n";

    auto buf = std::make_shared<Buffer>(32);
    std::memset(buf->data.data(), 0xCD, buf->size());

    // Two consumers share the same buffer without copying the payload.
    auto consumer_a = seastar::make_ready_future(std::shared_ptr<Buffer>(buf))
        .then([](std::shared_ptr<Buffer> b) {
            int sum = std::accumulate(b->data.begin(), b->data.end(), 0);
            std::cout << "  consumer A checksum = " << sum << "\n";
        });

    auto consumer_b = seastar::make_ready_future(std::shared_ptr<Buffer>(buf))
        .then([](std::shared_ptr<Buffer> b) {
            std::cout << "  consumer B size = " << b->size() << "\n";
        });

    std::vector<seastar::future<void>> tasks;
    tasks.push_back(std::move(consumer_a));
    tasks.push_back(std::move(consumer_b));

    seastar::when_all_succeed(std::move(tasks)).get();
    std::cout << "  fan-out done  (use_count after = " << buf.use_count() << ")\n";
}

// ---------------------------------------------------------------------------
// Example 3 — error path preserves ownership cleanup
// ---------------------------------------------------------------------------

void error_ownership() {
    std::cout << "\n--- error ownership ---\n";

    auto f = seastar::make_ready_future<std::unique_ptr<Buffer>>(
                 std::make_unique<Buffer>(16))
        .then([](std::unique_ptr<Buffer>) -> std::unique_ptr<Buffer> {
            throw std::runtime_error("simulated I/O error");
        })
        // The failed future skips this .then() entirely.
        .then([](std::unique_ptr<Buffer> buf) {
            std::cout << "  this line is never reached\n";
            return buf;
        })
        // Recover with a fallback buffer.
        .handle_exception([](std::exception_ptr ep) -> std::unique_ptr<Buffer> {
            try { std::rethrow_exception(ep); }
            catch (const std::exception& e) {
                std::cout << "  recovered from: " << e.what() << "\n";
            }
            return std::make_unique<Buffer>(8); // fallback
        })
        .then([](std::unique_ptr<Buffer> buf) {
            std::cout << "  fallback buffer size = " << buf->size() << "\n";
        });

    f.get();
}

// ---------------------------------------------------------------------------

int main() {
    std::cout << "=== Memory / ownership example ===\n\n";
    unique_ptr_pipeline();
    shared_ptr_fanout();
    error_ownership();
    std::cout << "\nAll memory examples done.\n";
    return 0;
}
