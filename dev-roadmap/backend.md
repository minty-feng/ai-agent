<div align="center">

# ⚙️ 后端工程师 — 技能深度手册

**核心竞争力 · 系统设计 · 高可用架构**

</div>

---

## 一、核心竞争力总览

| 维度 | 描述 | 权重 |
|:---|:---|:---:|
| **CS 基础** | 算法/数据结构、OS 原理、网络协议 | ★★★★★ |
| **语言深度** | 核心语言 GC/并发/内存模型掌握 | ★★★★★ |
| **数据库** | 索引、事务、查询优化、高可用存储 | ★★★★★ |
| **系统设计** | 分布式理论、高可用/高并发架构 | ★★★★ |
| **可观测性** | 监控、链路追踪、日志、SLO 体系 | ★★★★ |

---

## 二、CS 基础 — 后端工程师的地基

### 算法与数据结构

**刷题要求**：LeetCode Medium 90% 通过率，熟练掌握以下模式：

| 模式 | 代表题目 | 核心思路 |
|:---|:---|:---|
| 双指针 | 有效三角形个数、接雨水 | 收缩窗口；O(n) 替代 O(n²) |
| 滑动窗口 | 最长无重复子串、最小覆盖子串 | 维护窗口不变量 |
| 单调栈 | 每日温度、柱状图最大矩形 | 维护递增/递减栈 |
| 二分查找 | 搜索旋转数组、第 k 小的数对距离 | 明确搜索区间语义 |
| 树形 DP | 打家劫舍 III、二叉树最大路径和 | 后序遍历 + 状态传递 |
| 并查集 | 冗余连接、账户合并 | 路径压缩 + 按秩合并 |
| Trie 前缀树 | 单词搜索 II、实现 Trie | 26 叉树节点设计 |
| 线段树 | 区间求和、区间修改 | 懒标记延迟传播 |

**系统设计必备**：一致性哈希（扩缩容时最小数据迁移）；跳表（Redis ZSet 底层）；布隆过滤器（缓存穿透防护）

### 操作系统

- **进程与线程**
  - 进程通信 IPC：管道、消息队列、共享内存、信号量、Socket
  - 线程同步：互斥锁 (Mutex)、读写锁 (RWMutex)、条件变量、`semaphore`
  - 用户态线程 vs 内核态线程；M:N 混合模型（Go goroutine）

- **内存管理**
  - 虚拟内存：页表、TLB、缺页中断 (Page Fault)
  - `mmap` 内存映射文件；零拷贝 (Zero-Copy) `sendfile` 原理
  - 内存分配器：`tcmalloc`（Go/Chrome）、`jemalloc`（Redis/Firefox）

- **I/O 模型**
  - 阻塞 I/O → 非阻塞 I/O → I/O 多路复用 → 信号驱动 → 异步 I/O
  - `select`（fd 数量限制 1024）→ `poll`（链表无限制）→ `epoll`（事件驱动，O(1) 就绪）
  - `epoll` 水平触发 (LT) vs 边缘触发 (ET)；`EPOLLET` + 非阻塞 fd

### 网络协议

- **TCP 深度**
  - 三次握手：`SYN_SENT` → `SYN_RCVD` → `ESTABLISHED`；SYN Flood 攻击与 SYN Cookie
  - 四次挥手：`TIME_WAIT` 等待 2MSL 的原因；`SO_REUSEADDR` 快速复用端口
  - 滑动窗口 + 拥塞控制：慢启动 → 拥塞避免 → 快重传 → 快恢复 (CUBIC/BBR)
  - TCP Keepalive vs 应用层心跳的选择

- **HTTP 演进**
  - HTTP/1.1：持久连接、管道化（队头阻塞）
  - HTTP/2：帧 (Frame) + 流 (Stream) 多路复用；HPACK 头压缩；Server Push
  - HTTP/3 + QUIC：UDP 基础；0-RTT 握手；流级别拥塞控制；连接迁移

---

## 三、核心语言深度

### Go — 后端主流首选

- **GMP 调度模型**
  - G (Goroutine)、M (OS Thread)、P (Processor 逻辑处理器)
  - 工作窃取 (Work Stealing)；`GOMAXPROCS` 控制并行度
  - 抢占式调度（信号抢占）；goroutine 栈扩容机制

- **Channel 与 Select**
  ```go
  // 超时控制
  select {
  case result := <-ch:
      process(result)
  case <-time.After(5 * time.Second):
      return errors.New("timeout")
  case <-ctx.Done():
      return ctx.Err()
  }
  ```
  - 有缓冲 vs 无缓冲 channel 使用场景
  - `sync.WaitGroup`、`sync.Once`、`sync.Mutex`、`sync/atomic`
  - `errgroup` 并发错误收集；`semaphore` 并发限流

- **内存与 GC**
  - 逃逸分析：`go build -gcflags="-m"` 查看逃逸
  - 三色标记 + 写屏障；GC Pause 分析与优化
  - `sync.Pool` 对象池减少 GC 压力；`unsafe.Pointer` 零拷贝

- **性能剖析**
  ```bash
  go tool pprof -http=:8080 cpu.prof  # CPU 火焰图
  go tool pprof -alloc_objects mem.prof  # 内存分配
  go test -bench=. -benchmem -cpuprofile cpu.prof
  ```

### Java — 企业级首选

- **JVM 深度**
  - G1 GC：年轻代/老年代/混合回收；`-XX:MaxGCPauseMillis` 目标停顿
  - ZGC：并发标记压缩；< 1ms 停顿；`-XX:+UseZGC`
  - `CompletableFuture`：链式异步；`thenCompose` vs `thenCombine`；异常处理 `exceptionally`
  - JMM 内存模型：`volatile`、`synchronized`、`happens-before` 关系

- **Spring Boot 3**
  - `@Transactional` 传播行为 (REQUIRED/REQUIRES_NEW/NESTED)
  - AOT 编译 + GraalVM Native Image：冷启动 < 100ms
  - `Virtual Threads`（JDK 21）：百万级并发；替代线程池

### C++ — 系统编程与高性能计算

- **现代 C++（C++17/20）核心特性**
  - 智能指针：`unique_ptr`（独占所有权）、`shared_ptr`（引用计数）、`weak_ptr`（打破循环引用）
  - RAII：资源获取即初始化；析构函数自动释放资源，无需 `try/finally`
  - 移动语义：右值引用 `&&`；`std::move` / `std::forward` 避免不必要的深拷贝
  - 结构化绑定、`std::optional`、`std::variant`、`std::string_view`（零拷贝字符串视图）
  - `constexpr`：编译期计算；`concepts`（C++20）约束模板参数，提升错误可读性

- **并发编程**
  - `std::thread` / `std::jthread`（C++20，析构时自动 join）
  - `std::mutex`、`std::shared_mutex`（读写锁）、`std::lock_guard` / `std::unique_lock`
  - 原子操作：`std::atomic<T>`；内存序（`memory_order_relaxed` / `acquire` / `release` / `seq_cst`）
  - 无锁编程：CAS (Compare-And-Swap)；避免 ABA 问题；`std::atomic_flag` 自旋锁

- **内存管理深度**
  - 内存布局：栈 vs 堆；对象对齐 `alignas(64)` 避免伪共享 (False Sharing)
  - 自定义内存池：Pool Allocator 减少碎片化、降低分配延迟（HFT 场景关键）
  - 内存检测工具链：`valgrind`（泄漏检测）、`AddressSanitizer`（越界/UAF）、`MemorySanitizer`

- **性能工程**
  ```cpp
  // CRTP 静态多态 — 消除虚函数运行时开销
  template<typename Derived>
  class Processor {
  public:
      void process() { static_cast<Derived*>(this)->process_impl(); }
  };

  // 编译期常量，零运行时开销
  constexpr int factorial(int n) { return n <= 1 ? 1 : n * factorial(n - 1); }

  // 分支预测提示（C++20）
  if ([[likely]] cache_hit) { return cached; }
  ```
  - `perf stat` / `perf record` + 火焰图；`gprof`；`objdump -d` 查看汇编
  - SIMD 向量化：`-O3 -march=native`；`__builtin_expect` 提示 GCC 分支预测
  - 缓存友好数据结构：AoS (Array of Structs) vs SoA (Struct of Arrays)；预取 `__builtin_prefetch`

- **适用场景**：游戏引擎（Unreal Engine）、高频交易（HFT 延迟 < 1μs）、数据库内核（RocksDB）、浏览器引擎（V8/WebKit）、嵌入式实时系统

### Rust — 系统编程的现代选择

- **所有权系统（最核心概念）**
  ```rust
  // 每个值只有一个所有者，离开作用域自动释放（无 GC）
  let s1 = String::from("hello");
  let s2 = s1;  // 所有权转移，s1 不再有效，编译器静态检查
  
  // 借用：不转移所有权
  fn print_len(s: &String) -> usize { s.len() }     // 不可变借用
  fn append(s: &mut String) { s.push_str(" world"); } // 可变借用
  // 规则：同一作用域内，可多个不可变引用 OR 一个可变引用，二者不能同时存在
  ```

- **生命周期 — 编译期引用安全**
  ```rust
  // 编译器确保引用不会悬垂（outlive 被引用值）
  fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
      if x.len() > y.len() { x } else { y }
  }
  // 结构体持有引用时必须声明生命周期参数
  struct Cache<'a> { data: &'a [u8] }
  ```

- **错误处理 — 无异常的健壮性**
  ```rust
  // Result<T, E> 强制调用方处理每个可能的错误
  fn read_config() -> Result<Config, io::Error> {
      let content = std::fs::read_to_string("config.toml")?;  // ? 自动传播错误
      Ok(toml::from_str(&content).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?)
  }
  // Option<T> 消除 null pointer，编译期强制处理缺失值
  let port = config.get("port").and_then(|v| v.parse::<u16>().ok()).unwrap_or(8080);
  ```

- **异步编程（Tokio 运行时）**
  ```rust
  use tokio::{net::TcpListener, io::AsyncReadExt};
  
  #[tokio::main]
  async fn main() -> Result<(), Box<dyn std::error::Error>> {
      let listener = TcpListener::bind("0.0.0.0:8080").await?;
      loop {
          let (mut socket, _) = listener.accept().await?;
          tokio::spawn(async move {
              let mut buf = [0u8; 1024];
              socket.read(&mut buf).await.unwrap();
          });
      }
  }
  ```
  - `async/await` 零成本抽象：编译为状态机，无运行时堆分配
  - `tokio`：多线程工作窃取调度；`tokio::select!` 多路 Future 竞争
  - 跨线程共享状态：`Arc<Mutex<T>>`；编译器保证无数据竞争

- **零成本抽象**
  - 迭代器链：`iter().filter().map().collect()` 编译为单次循环，无中间集合
  - Trait 对象：`dyn Trait`（动态分发）vs 泛型单态化（静态分发，无运行时开销）
  - `#[inline]` / LTO（链接时优化）；`cargo bench` + `criterion` 微基准测试

- **适用场景**：系统工具（ripgrep/fd/bat）、网络服务（Axum/Actix-web，性能媲美 C++）、WebAssembly（在浏览器运行系统级代码）、区块链（Solana）、嵌入式 `no_std` 环境

---

## 四、数据库 — 最重要的竞争力之一

### PostgreSQL 深度

- **索引类型与选择**

  | 索引类型 | 适用场景 | 注意事项 |
  |:---|:---|:---|
  | `B-Tree` | 等值/范围查询（默认） | 适用 90% 场景 |
  | `GIN` | 数组、JSONB、全文搜索 | 写入慢，读取极快 |
  | `GiST` | 几何、地理位置、范围类型 | 支持复杂运算符 |
  | `BRIN` | 时序数据（物理顺序相关） | 体积极小，适合日志表 |
  | `Hash` | 仅等值查询 | 不支持排序，慎用 |
  | 部分索引 | `WHERE deleted_at IS NULL` | 减少索引体积 |
  | 表达式索引 | `lower(email)` | 支持函数结果索引 |

- **查询优化流程**
  ```sql
  -- 1. 获取执行计划
  EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT ...;
  
  -- 2. 关注指标
  -- Seq Scan → Index Scan（添加索引）
  -- Hash Join vs Nested Loop（数据量决定）
  -- Rows 估算误差 > 10x → 更新统计信息
  ANALYZE table_name;
  
  -- 3. 覆盖索引消除回表
  CREATE INDEX idx_cover ON orders(user_id, status) INCLUDE (amount, created_at);
  ```

- **事务隔离级别**

  | 级别 | 脏读 | 不可重复读 | 幻读 | PostgreSQL 实现 |
  |:---|:---:|:---:|:---:|:---|
  | Read Uncommitted | ✓ | ✓ | ✓ | 等同 Read Committed |
  | Read Committed | ✗ | ✓ | ✓ | MVCC 快照（默认）|
  | Repeatable Read | ✗ | ✗ | ✓ | MVCC 事务快照 |
  | Serializable | ✗ | ✗ | ✗ | SSI 可串行化快照隔离 |

- **高级特性**
  - `JSONB`：比 JSON 更快的二进制存储；GIN 索引支持 `@>` 包含查询
  - 窗口函数：`ROW_NUMBER() OVER(PARTITION BY ... ORDER BY ...)`
  - CTE with recursion：递归查询组织架构树
  - `pg_partman` 自动分区管理；范围分区 + 列表分区

### Redis 深度

- **数据结构选型决策树**

  ```
  需要什么？
  ├── 计数 / 限流 → String (INCR + EXPIRE)
  ├── 去重 / 存在判断 → Set / Bitmap / HyperLogLog
  ├── 排行榜 / 优先队列 → Sorted Set (ZSet)
  ├── 消息推送 / 订阅 → Pub/Sub / Stream
  ├── 对象缓存 → Hash (避免序列化整体)
  └── 分布式锁 → String (SET NX PX) / RedLock
  ```

- **分布式锁正确实现**
  ```
  SET lock_key unique_value NX PX 30000
  # NX = Not Exists
  # PX = 毫秒过期
  # unique_value 防止误删其他持有者的锁
  
  释放时使用 Lua 脚本保证原子性：
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  end
  ```

- **缓存三大问题**
  - **穿透**：查询不存在的 key → 布隆过滤器前置拦截 + 空值缓存
  - **击穿**：热点 key 过期瞬间大量并发 → `SETNX` 互斥锁重建 + 不过期 + 逻辑过期
  - **雪崩**：大量 key 同时过期 → 过期时间加随机抖动 + 多级缓存 + 限流降级

---

## 五、微服务与分布式系统

### 服务通信

- **gRPC 最佳实践**
  - 接口幂等性设计；`request_id` 全链路唯一标识
  - 超时传递：`context.WithTimeout` 从网关到叶子服务
  - 错误状态码：`codes.NotFound`、`codes.ResourceExhausted`（限流）、`codes.Unavailable`（熔断）
  - 流式 RPC：服务端流（大文件下载）、双向流（实时日志）

- **消息队列选型**

  | 特性 | Kafka | RabbitMQ | Pulsar |
  |:---|:---:|:---:|:---:|
  | 吞吐量 | 极高 (百万/s) | 高 (万/s) | 极高 |
  | 消息顺序 | Partition 内有序 | Queue 内有序 | Partition 内有序 |
  | 消息回溯 | 支持（offset） | 不支持 | 支持 |
  | 延迟消息 | 不原生支持 | 死信队列模拟 | 原生支持 |
  | 适用场景 | 日志/埋点/事件溯源 | 任务队列/RPC | 金融/多租户 |

### 分布式理论

- **CAP 定理实践**：真实系统选择 CP (ZooKeeper/etcd) 或 AP (Cassandra/DynamoDB)；网络分区时必须取舍
- **BASE 理论**：基本可用 (Basically Available)、软状态 (Soft State)、最终一致性 (Eventually Consistent)
- **Raft 共识算法**
  - Leader 选举：随机选举超时；Term 单调递增
  - 日志复制：`AppendEntries` RPC；多数派确认后提交
  - 成员变更：Joint Consensus 两阶段；`ConfChangeV2`

### 服务治理模式

```
客户端 → [API Gateway] → [Service Mesh Sidecar] → 业务服务
           限流/认证/路由    mTLS/重试/熔断/追踪
```

- **Circuit Breaker 熔断器状态机**：Closed → Open（连续失败率 > 阈值）→ Half-Open（探测恢复）
- **Saga 分布式事务**
  - 编排式 (Orchestration)：中央协调器控制流程；适合复杂流程
  - 协同式 (Choreography)：事件驱动自治；适合简单流程
  - 补偿事务：每个步骤必须有对应的回滚操作

---

## 六、可观测性三支柱

### Metrics（指标）

```yaml
# Prometheus 四种指标类型
Counter:   单调递增（请求总数、错误总数）
Gauge:     任意增减（当前连接数、内存使用）
Histogram: 分桶统计延迟分布（p50/p95/p99）
Summary:   客户端计算分位数（已过时，推荐 Histogram）

# 黄金指标 (Golden Signals)
- Latency:    请求延迟（区分成功/失败）
- Traffic:    每秒请求数 (QPS/RPS)
- Errors:     错误率（HTTP 5xx / gRPC 非 OK）
- Saturation: 资源饱和度（CPU/内存/队列深度）
```

### Tracing（链路追踪）

- **OpenTelemetry**：跨语言标准；Trace → Span → Attributes/Events
- **Trace 传播**：`traceparent` HTTP Header；gRPC metadata 传递
- **采样策略**：头部采样（根据 trace-id 决定）；尾部采样（基于结果过滤，需 Tempo/Jaeger）
- **Span 设计原则**：不同 I/O 操作独立 Span；记录 db.statement / http.url 等关键属性

### Logging（日志）

```json
// 结构化日志必须字段
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "ERROR",
  "trace_id": "abc123",
  "service": "order-service",
  "message": "payment failed",
  "error": "context deadline exceeded",
  "user_id": "u-456",
  "order_id": "o-789"
}
```

- **日志级别使用规范**：`DEBUG`（本地开发）→ `INFO`（关键业务节点）→ `WARN`（可恢复异常）→ `ERROR`（影响用户的故障）→ `FATAL`（进程退出）
- **日志聚合**：Loki + Grafana（轻量）；ELK Stack（功能全面）；OpenSearch

---

## 七、安全工程

### OWASP Top 10 防御

| 风险 | 攻击示例 | 防御措施 |
|:---|:---|:---|
| 注入 (SQL/Command) | `' OR 1=1--` | 参数化查询；ORM；输入白名单 |
| 失效身份验证 | 密码暴破；会话固定 | 账号锁定；MFA；安全 Cookie |
| 敏感数据泄露 | 明文存储密码；HTTP 传输 | `argon2` 哈希；HTTPS；字段加密 |
| XXE | XML 外部实体注入 | 禁用外部实体；使用 JSON |
| 访问控制缺陷 | 越权访问他人数据 | RBAC + 资源归属校验 |
| 安全配置错误 | 默认密码；调试信息暴露 | 安全基线扫描；关闭调试端点 |
| XSS | 注入恶意脚本 | CSP；输出转义；`HttpOnly` Cookie |
| 不安全反序列化 | 远程代码执行 | 类型白名单；签名验证 |
| 已知漏洞组件 | Log4Shell | `dependabot`；定期审计 `npm audit` |
| 日志与监控不足 | 入侵无法检测 | 完整审计日志；异常告警 |

### JWT 安全最佳实践

```
// 常见安全缺陷
❌ algorithm: "none" 攻击 → 强制指定算法 RS256/ES256
❌ 敏感信息放 payload → JWT 只是 Base64 编码，非加密
❌ 长期有效 Access Token → 配合短期 Access (15min) + 长期 Refresh (7d)
❌ Refresh Token 存 localStorage → 存 HttpOnly Secure Cookie
✅ 使用非对称算法 RS256：服务端私钥签名，各服务公钥验证
✅ 包含 jti (JWT ID) 支持 Token 黑名单机制
```

---

## 八、职业成长路径

### 必须能回答的深度问题

1. 设计一个 QPS 10 万的短链接服务（存储选型、Hash 冲突、高可用）
2. 解释 Kafka 如何保证消息不丢失、不重复（at-least-once + 幂等消费者）
3. PostgreSQL 的 MVCC 如何实现快照隔离（xmin/xmax 可见性判断）
4. 如何在不停机的情况下给 1 亿行的表添加索引
5. Redis 集群模式下 `KEYS *` 为何危险，如何替代
6. 微服务下如何实现分布式 Session（无状态 JWT vs 有状态 Session + Redis）

### Senior 核心竞争力

- **系统设计能力**：能在 45 分钟内完成 "设计 Twitter" 级别的系统设计
- **故障处理能力**：oncall 响应 SLA；根因分析 (RCA)；故障复盘文化
- **成本意识**：云资源成本优化；数据库查询成本分析
- **技术决策**：能写清晰的 ADR (Architecture Decision Record)

---

<div align="center">

*持续更新 · 与技术演进同步*

</div>
