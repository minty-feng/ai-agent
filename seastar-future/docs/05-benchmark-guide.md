# Benchmark 说明文档

> 本文档详细说明 `seastar-future` 项目中基准测试（benchmark）的设计目标、测试场景、运行方式以及结果解读方法。

---

## 1. 概述

Benchmark 位于 [`benchmarks/future_benchmark.cpp`](../benchmarks/future_benchmark.cpp)，用于量化工业级 future 实现相较于教科书式（naive）实现在关键路径上的性能差异。

**核心对比维度：**

| 维度 | Naive 实现 | 工业级实现 |
|------|-----------|-----------|
| 续体存储 | `std::vector<std::function<void()>>` | 单一 `std::unique_ptr<task>` 槽位 |
| Future 语义 | 可拷贝（`shared_ptr` 共享状态） | **Move-only**（禁止拷贝） |
| 可调用对象包装 | `std::function`（要求可拷贝） | `noncopyable_function`（支持 move-only 捕获 + SBO） |

---

## 2. 构建与运行

```bash
cd seastar-future
mkdir -p build && cd build
cmake ..
cmake --build . --target future_benchmark
./future_benchmark
```

> Benchmark 编译使用 `-O2` 优化等级（通过 CMakeLists.txt 配置）以反映真实运行时性能。

---

## 3. 测试场景详解

每个场景均使用高精度时钟（`std::chrono::high_resolution_clock`）计时，默认迭代 **200,000** 次以保证统计意义。

### 3.1 Ready-chain（就绪链）

```
make_ready_future(i) → .then(+1) → .then(×2) → .then(−1) → .get()
```

- **测量目标**：已就绪 future 的 `.then()` 快速路径吞吐量。
- **关注点**：当 future 在注册续体之前就已经 resolve，续体应立即执行。该场景衡量"热路径"的效率——vector 分配 vs 单指针赋值。
- **迭代次数**：200,000

### 3.2 Deferred（延迟解决）

```
promise<int> p;
p.get_future() → .then(+1) → .then(×2);
p.set_value(i);
f.get();
```

- **测量目标**：先注册续体、后 resolve 的典型异步模式。
- **关注点**：续体注册开销（vector `push_back` vs 单指针 move）和 resolve 触发时遍历执行开销。
- **迭代次数**：200,000

### 3.3 Promise/future pair creation（创建开销）

```
promise<int> p;
auto f = p.get_future();
p.set_value(i);
f.get();
```

- **测量目标**：最小 promise/future 创建→resolve→get 路径。
- **关注点**：shared_ptr 引用计数 + vector 空初始化开销 vs 无 vector 的精简 state。
- **迭代次数**：200,000

### 3.4 Function call — small（小闭包调用）

```
fn = [](int x) { return x * 2 + 1; };
fn(i);
```

- **测量目标**：`std::function<int(int)>` vs `noncopyable_function<int(int)>` 在小闭包场景下的调用开销。
- **关注点**：两者在 SBO 范围内的 type-erasure 调用性能差异。
- **迭代次数**：200,000

### 3.5 Function + ownership（所有权转移）

```
// naive: shared_ptr<int> + std::function
// opt:   unique_ptr<int> + noncopyable_function
```

- **测量目标**：需要 move-only 捕获时，`std::function`（被迫使用 `shared_ptr`）vs `noncopyable_function`（直接 move `unique_ptr`）的开销差异。
- **关注点**：`shared_ptr` 的原子引用计数 vs `unique_ptr` 的零开销转移。
- **迭代次数**：200,000

### 3.6 Long chain（长链）

```
f = make_ready(0);
for (d = 0; d < 100; ++d)
    f = f.then(+1);
f.get();
```

- **测量目标**：深度为 100 的链式调用吞吐量。
- **关注点**：连续创建和消费大量中间 future 的累积开销。
- **迭代次数**：1,000（每次链深 100）

---

## 4. 典型结果（参考值）

> 以下数据在 GCC 13、`-O2`、单线程环境下测得，仅供参考。实际数值因硬件和编译器而异。

| Benchmark | Naive (µs) | Optimised (µs) | 加速比 |
|-----------|-----------|----------------|--------|
| Ready-chain (3-step, 200K×) | ~50,400 | ~37,000 | **1.36×** |
| Deferred (2-step, 200K×) | ~44,700 | ~30,200 | **1.48×** |
| Promise/future pair (200K×) | ~9,150 | ~4,980 | **1.84×** |
| Ownership transfer (200K×) | ~7,620 | ~3,240 | **2.35×** |
| Long chain (depth=100, 1K×) | ~7,160 | ~5,250 | **1.36×** |

### 解读要点

- **加速比 > 1.0** 表示工业级实现更快。
- **Promise/future pair** 和 **ownership transfer** 场景加速最显著（1.8×–2.4×），因为它们直接受益于去除 `shared_ptr` 原子操作和 `vector` 分配。
- **Ready-chain** 和 **long chain** 的加速稍低（~1.4×），因为快速路径上 vector 虽然被分配但立即执行、没有扩容。
- 所有 benchmark 在单线程运行，无 reactor 调度开销，反映的是纯数据结构层面的差异。

---

## 5. 如何扩展

如果需要添加新的 benchmark 场景：

1. 在 `benchmarks/future_benchmark.cpp` 中定义 `bench_xxx_naive()` 和 `bench_xxx_opt()` 两个函数。
2. 在 `main()` 中调用它们并使用 `print_row()` 输出对比结果。
3. 保持迭代次数足够大（≥10,000）以降低计时噪声。

---

## 6. 注意事项

- Benchmark 使用 `volatile` 防止编译器优化掉无副作用的计算。
- Warm-up 阶段（1,000 次迭代）在正式测量前执行，减少 cache 冷启动影响。
- 结果受 CPU 频率调节（turbo boost）、系统负载等因素影响，建议多次运行取中位数。
