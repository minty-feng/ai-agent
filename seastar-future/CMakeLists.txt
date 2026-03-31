cmake_minimum_required(VERSION 3.14)
project(seastar-future
    VERSION   1.0.0
    LANGUAGES CXX
    DESCRIPTION "Standalone Seastar-style future/then continuation-based async primitives"
)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ---------------------------------------------------------------------------
# Header-only library target
# ---------------------------------------------------------------------------
add_library(seastar-future INTERFACE)
target_include_directories(seastar-future INTERFACE
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
option(SEASTAR_FUTURE_BUILD_TESTS "Build tests" ON)
option(SEASTAR_FUTURE_BUILD_EXAMPLES "Build examples" ON)

if(SEASTAR_FUTURE_BUILD_TESTS)
    enable_testing()
    add_executable(future_test tests/future_test.cpp)
    target_link_libraries(future_test PRIVATE seastar-future)
    add_test(NAME future_test COMMAND future_test)
endif()

# ---------------------------------------------------------------------------
# Examples — real future/then code demonstrating network, memory, thread-pool,
# and general future/then patterns.
# ---------------------------------------------------------------------------
if(SEASTAR_FUTURE_BUILD_EXAMPLES)
    add_executable(example_network    examples/network_example.cpp)
    target_link_libraries(example_network    PRIVATE seastar-future)

    add_executable(example_memory     examples/memory_example.cpp)
    target_link_libraries(example_memory     PRIVATE seastar-future)

    add_executable(example_threadpool examples/threadpool_example.cpp)
    target_link_libraries(example_threadpool PRIVATE seastar-future)

    add_executable(example_future_then examples/future_then_example.cpp)
    target_link_libraries(example_future_then PRIVATE seastar-future)

    find_package(Threads REQUIRED)
    target_link_libraries(example_network    PRIVATE Threads::Threads)
    target_link_libraries(example_threadpool PRIVATE Threads::Threads)
    target_link_libraries(example_future_then PRIVATE Threads::Threads)
endif()
