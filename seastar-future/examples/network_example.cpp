/// @file network_example.cpp
/// @brief Simulates an async network server pipeline using seastar future/then.
///
/// Models the classic accept → read → process → respond flow where each stage
/// is non-blocking and chained with .then().  Threads stand in for real async
/// I/O — in Seastar proper, the reactor handles the polling.
///
/// Advantages demonstrated:
///   - Continuations stay on the resolving shard (no lock contention).
///   - Errors propagate automatically through the chain.
///   - .handle_exception provides graceful recovery.
///   - .finally guarantees cleanup (e.g. closing a connection).

#include <seastar/future.hh>

#include <chrono>
#include <iostream>
#include <numeric>
#include <string>
#include <thread>
#include <vector>

// ---------------------------------------------------------------------------
// Simulated async helpers (threads mimic kernel / DMA completions)
// ---------------------------------------------------------------------------

/// Simulate accepting a new connection: resolves with a connection-id.
seastar::future<int> async_accept() {
    seastar::promise<int> p;
    auto f = p.get_future();
    std::thread([p = std::move(p)]() mutable {
        std::this_thread::sleep_for(std::chrono::milliseconds(2));
        p.set_value(42); // connection id
    }).detach();
    return f;
}

/// Simulate reading a request payload from the connection.
seastar::future<std::string> async_read(int conn_id) {
    seastar::promise<std::string> p;
    auto f = p.get_future();
    std::thread([p = std::move(p), conn_id]() mutable {
        std::this_thread::sleep_for(std::chrono::milliseconds(2));
        p.set_value("GET /hello conn=" + std::to_string(conn_id));
    }).detach();
    return f;
}

/// Simulate writing a response back to the connection.
seastar::future<void> async_write(int conn_id, const std::string& body) {
    seastar::promise<void> p;
    auto f = p.get_future();
    std::thread([p = std::move(p), conn_id, body]() mutable {
        std::this_thread::sleep_for(std::chrono::milliseconds(2));
        std::cout << "[conn " << conn_id << "] << " << body << "\n";
        p.set_value();
    }).detach();
    return f;
}

// ---------------------------------------------------------------------------
// Request pipeline — every stage is a .then() continuation
// ---------------------------------------------------------------------------

/// Process a single connection: read → parse → respond → cleanup.
seastar::future<void> handle_connection(int conn_id) {
    return async_read(conn_id)
        .then([conn_id](std::string request) {
            // "Parse" the request and build a response body.
            std::cout << "[conn " << conn_id << "] >> " << request << "\n";
            return async_write(conn_id, "HTTP/1.1 200 OK — Hello!");
        })
        .handle_exception([conn_id](std::exception_ptr ep) {
            try { std::rethrow_exception(ep); }
            catch (const std::exception& e) {
                std::cerr << "[conn " << conn_id << "] error: "
                          << e.what() << "\n";
            }
        })
        .finally([conn_id]() {
            std::cout << "[conn " << conn_id << "] connection closed\n";
        });
}

// ---------------------------------------------------------------------------
// main — accept N connections in parallel, wait for all to finish
// ---------------------------------------------------------------------------

int main() {
    constexpr int num_connections = 3;

    std::cout << "=== Network pipeline example ===\n";
    std::cout << "Accepting " << num_connections << " connections...\n\n";

    // Launch N independent connection pipelines.
    std::vector<seastar::future<void>> pipelines;
    for (int i = 0; i < num_connections; ++i) {
        auto pipeline = async_accept().then([](int conn_id) {
            return handle_connection(conn_id);
        });
        pipelines.push_back(std::move(pipeline));
    }

    // Wait for all pipelines to complete (simulates reactor draining).
    auto all = seastar::when_all_succeed(std::move(pipelines));

    // Give detached threads time to finish.
    std::this_thread::sleep_for(std::chrono::milliseconds(50));

    all.get();
    std::cout << "\nAll connections handled.\n";
    return 0;
}
