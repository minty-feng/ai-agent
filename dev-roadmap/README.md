<div align="center">

# 🧭 Developer Skill Roadmaps

**精准 · 全面 · 深刻** — 前端、后端、全栈、大模型应用开发工程师技术栈全景

<br/>

[![Stars](https://img.shields.io/badge/⭐⭐⭐⭐⭐-必须掌握-ff4757?style=for-the-badge)](#)
[![Stars](https://img.shields.io/badge/⭐⭐⭐⭐-强烈推荐-ff6b81?style=for-the-badge)](#)
[![Stars](https://img.shields.io/badge/⭐⭐⭐-行业标准-ffa502?style=for-the-badge)](#)
[![Stars](https://img.shields.io/badge/⭐⭐-进阶提升-2ed573?style=for-the-badge)](#)
[![Stars](https://img.shields.io/badge/⭐-专家领域-1e90ff?style=for-the-badge)](#)

</div>

---

## 📖 如何阅读本指南

| 评级 | 含义 | 目标 |
|:---:|:---|:---|
| ⭐⭐⭐⭐⭐ | **基石 / 必须掌握** | 入职前必须达到熟练水平，面试必考 |
| ⭐⭐⭐⭐ | **强烈推荐** | 区分优秀与普通工程师的关键技能 |
| ⭐⭐⭐ | **行业标准** | 大多数高级职位的基线要求 |
| ⭐⭐ | **进阶提升** | 通往 Senior / Staff 的加速器 |
| ⭐ | **专家领域** | 深度方向选择，技术专家 / 架构师必备 |

> 每个类目按评级从高到低排列，同一评级内按重要性排序。

---

<br/>

## 🎨 前端工程师

> 负责用户界面与交互体验，掌控浏览器端的一切。

<details open>
<summary><strong>⭐⭐⭐⭐⭐ &nbsp;基石 — 必须掌握</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **HTML5 语义化 + CSS3** | 核心语言 | `Flexbox` / `Grid` 布局精通；`CSS Custom Properties`；`@keyframes` 动画；`media query` 响应式；BEM 命名规范；`clip-path` / `backdrop-filter` 视觉效果 |
| **JavaScript ES2024+** | 核心语言 | `Promise` / `async-await`；`ES Modules`；解构 / 扩展运算符；`Generator` / `Iterator`；`WeakMap/WeakRef`；事件循环 (Event Loop) 与微任务队列原理 |
| **TypeScript 5.x** | 类型系统 | `Generics` 泛型约束；`Utility Types`（`Partial/Pick/Omit/ReturnType`）；`Declaration Files (.d.ts)`；`strict` 模式；`satisfies` 运算符；类型推断与收窄 |
| **React 18+ / Vue 3** | UI 框架 | React: Hooks 全集、`Concurrent Mode`、`Server Components`、`Suspense`、`useTransition`；Vue: Composition API、`<script setup>`、`Teleport`、`defineModel` |
| **Browser DevTools** | 调试工具 | Performance 面板火焰图分析；Network 面板瀑布图与请求优先级；Memory 面板堆快照定位内存泄漏；Coverage 工具定位死代码 |
| **Git 工作流** | 版本控制 | 分支策略 (Git Flow / Trunk-based)；`rebase` 变基与冲突解决；PR Code Review；`git bisect` 二分查找 bug |
| **响应式设计 + 无障碍 (a11y)** | 用户体验 | Mobile-first 设计原则；`WCAG 2.1 AA` 标准；ARIA 属性；键盘导航；`prefers-reduced-motion`；色彩对比度检查 |

</details>

<details>
<summary><strong>⭐⭐⭐⭐ &nbsp;强烈推荐</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **Vite 5 / Webpack 5** | 构建工具 | 代码分割 (Code Splitting)；Tree Shaking 原理；HMR 热更新；Bundle 分析 (`rollup-plugin-visualizer`)；多入口配置；自定义插件开发 |
| **Tailwind CSS v4** | 样式方案 | JIT 即时编译；`@layer` 自定义组件；`theme()` 函数；Dark Mode 变体；`cva` / `tailwind-variants` 组件变体管理；设计 Token 集成 |
| **TanStack Query v5** | 服务端状态 | 请求缓存与失效策略；`staleTime` / `gcTime` 调优；`useInfiniteQuery` 无限滚动；乐观更新 (Optimistic Updates)；服务端预取 (Prefetch) |
| **Zustand / Redux Toolkit** | 客户端状态 | Slice 模式；Selector 记忆化 (`reselect`)；中间件 (Immer / thunk)；状态持久化；DevTools 集成 |
| **Testing: Vitest + RTL + Playwright** | 测试体系 | 单元测试 + 组件测试 + E2E 测试金字塔；`msw` Mock Service Worker；`userEvent` 模拟真实交互；Visual Regression 截图对比 |
| **RESTful API 消费** | 数据交互 | `fetch` / `axios` 封装；请求拦截器；错误边界处理；指数退避重试；`AbortController` 取消请求 |
| **Next.js 14+ App Router** | 全栈框架 | Server Components vs Client Components；`use server` / `use client`；Route Handlers；`loading.tsx` + `error.tsx`；`generateMetadata` SEO |

</details>

<details>
<summary><strong>⭐⭐⭐ &nbsp;行业标准</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **GraphQL** | API 协议 | Apollo Client；`useQuery` / `useMutation`；`DataLoader` N+1 问题；Fragment 复用；`graphql-codegen` 类型生成 |
| **WebSocket / SSE** | 实时通信 | `Socket.io` 事件模型；Server-Sent Events 单向流；心跳保活；断线重连策略；消息队列防抖 |
| **Core Web Vitals** | 性能优化 | LCP / INP / CLS 指标优化；`<Image>` 组件懒加载；字体子集化；关键 CSS 内联；资源预加载 (`prefetch` / `preconnect`) |
| **Storybook 8** | 组件开发 | Addon 生态；`@storybook/test` 交互测试；Chromatic 视觉回归；MDX 文档；设计系统协同 |
| **ESLint + Prettier + Husky** | 代码质量 | 自定义规则集；`lint-staged` 预提交检查；`@typescript-eslint` 类型感知规则；Prettier 与 ESLint 集成 |
| **Monorepo: Turborepo / Nx** | 工程架构 | 工作区 (`pnpm workspaces`)；增量构建缓存；任务依赖图；共享 UI 包；版本管理 (`changesets`) |

</details>

<details>
<summary><strong>⭐⭐ &nbsp;进阶提升</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **WebAssembly (WASM)** | 高性能计算 | Rust/C++ → WASM 编译；`wasm-bindgen`；内存模型；与 JS 互操作；性能关键模块（图像/音视频/加密）迁移 |
| **Web Workers / SharedArrayBuffer** | 并行计算 | `postMessage` 通信；`Atomics` 原子操作；`Transferable Objects`；计算密集型任务下放（FFT、压缩、OCR） |
| **Progressive Web Apps** | 离线体验 | `Service Worker` 生命周期；`Cache API` 缓存策略（Cache First / Network First）；Background Sync；Push Notifications；Web App Manifest |
| **Design Systems** | 设计工程 | Figma → 代码 Token 同步；`Radix UI` / `shadcn/ui` headless 组件；主题化架构；`a11y` 组件规范；版本化发布 |
| **Micro-Frontends** | 架构模式 | `Module Federation`（Webpack 5）；`single-spa` 运行时集成；`iframe` 沙箱隔离；独立部署与版本协商 |

</details>

<details>
<summary><strong>⭐ &nbsp;专家领域</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **WebGL / WebGPU / Three.js** | 3D 图形 | Shader (GLSL/WGSL) 编程；渲染管线；PBR 材质；粒子系统；`@react-three/fiber` 声明式 3D |
| **WebRTC** | P2P 通信 | ICE / STUN / TURN 协商；`RTCPeerConnection`；DataChannel；媒体流处理；SFU 架构理解 |
| **Edge Runtime / Cloudflare Workers** | 边缘计算 | V8 Isolates 隔离模型；`Response.body` 流式传输；KV / Durable Objects；地理感知路由；冷启动优化 |
| **Compiler Tooling** | 基础设施 | Babel 插件（AST 变换）；ESLint 自定义规则；Vite 插件 API；自定义 TSX transformer；代码压缩器原理 |
| **Chrome Extension Manifest V3** | 浏览器扩展 | `service_worker` 背景脚本；Content Scripts CSP 限制；`chrome.storage` API；`declarativeNetRequest` 请求拦截 |

</details>

---

<br/>

## ⚙️ 后端工程师

> 掌控服务端逻辑、数据存储与系统可靠性。

<details open>
<summary><strong>⭐⭐⭐⭐⭐ &nbsp;基石 — 必须掌握</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **数据结构与算法** | CS 基础 | 时间/空间复杂度分析；常见模式：双指针、滑动窗口、单调栈、并查集、Trie、线段树；LeetCode Medium 级别熟练解题 |
| **操作系统原理** | CS 基础 | 进程 vs 线程 vs 协程；内存模型（堆/栈/虚拟内存/mmap）；文件描述符；`epoll` / `kqueue` I/O 多路复用；Linux 命令行精通 |
| **网络协议** | CS 基础 | TCP 三次握手/四次挥手/滑动窗口/拥塞控制；HTTP/1.1 → HTTP/2 多路复用 → HTTP/3 QUIC；TLS 握手；DNS 解析链路；`curl` / `tcpdump` 调试 |
| **核心语言深度** | 语言 | **Go**: goroutine 调度 (GMP)、channel、`sync` 包、逃逸分析 / **Java**: JVM GC (G1/ZGC)、`CompletableFuture`、JMM / **Python**: GIL、asyncio、`__slots__` / **Node.js**: libuv 事件循环、Worker Threads |
| **关系型数据库** | 数据存储 | PostgreSQL / MySQL：索引 B+树原理；`EXPLAIN ANALYZE` 执行计划；事务 ACID + 隔离级别（幻读/不可重复读）；窗口函数；分区表；连接池 (`PgBouncer`) |
| **RESTful API 设计** | API 工程 | Richardson 成熟度模型；URL 设计规范；幂等性；分页游标；错误码体系；版本化策略；`OpenAPI 3.1` 规范文档 |

</details>

<details>
<summary><strong>⭐⭐⭐⭐ &nbsp;强烈推荐</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **认证与授权** | 安全 | `JWT` 签名与刷新策略；`OAuth 2.0` 授权码流 / PKCE；`OIDC` ID Token；`RBAC` / `ABAC` 权限模型；防暴力破解（限速 + 账号锁定）；`OWASP Top 10` |
| **Docker + Docker Compose** | 容器化 | 多阶段构建（减少镜像体积）；`.dockerignore`；网络模式（bridge/host/overlay）；`healthcheck`；非 root 用户运行；`BuildKit` 缓存优化 |
| **Redis** | 缓存与存储 | 缓存穿透/击穿/雪崩防护；`SETNX` 分布式锁；`Sorted Set` 排行榜；`Pub/Sub` 消息广播；持久化 (RDB/AOF)；Cluster 分片模式 |
| **消息队列** | 异步通信 | **Kafka**: Topic/Partition/Consumer Group、Exactly-Once 语义、`log compaction` / **RabbitMQ**: Exchange 类型、死信队列、消息确认机制；背压 (Backpressure) 处理 |
| **gRPC + Protobuf** | RPC 框架 | 二进制序列化性能优势；服务定义 `.proto`；`Unary` / `Server Streaming` / `Bidirectional Streaming`；`grpc-gateway` HTTP 转换；`protoc-gen-go` |
| **NoSQL 数据库** | 数据存储 | **MongoDB**: 文档模型/聚合管道/索引 / **Redis**: 数据结构选型 / **Cassandra/DynamoDB**: 分区键设计/最终一致性/宽表模型；适用场景判断 |
| **单元 + 集成测试** | 测试 | 表驱动测试；Mock/Stub/Spy 策略；`testcontainers` 真实数据库测试；测试覆盖率 >80%；契约测试 (Pact) |

</details>

<details>
<summary><strong>⭐⭐⭐ &nbsp;行业标准</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **Kubernetes** | 容器编排 | `Pod` / `Deployment` / `Service` / `Ingress`；`ConfigMap` / `Secret`；`HPA` 水平扩缩容；`ResourceLimits` 资源限制；`Rolling Update` / `Blue-Green` 部署 |
| **可观测性三支柱** | 监控运维 | **Metrics**: Prometheus 指标采集 + Grafana 可视化 / **Tracing**: OpenTelemetry + Jaeger 分布式链路 / **Logging**: ELK/Loki 结构化日志；SLO/SLA/Error Budget |
| **微服务模式** | 架构设计 | `Circuit Breaker`（Hystrix/Resilience4j）；`Saga` 分布式事务；`CQRS` 读写分离；`Event Sourcing`；`Outbox Pattern` 保证消息可靠投递 |
| **全文搜索** | 搜索引擎 | **Elasticsearch**: 倒排索引、`match` vs `term` 查询、relevance scoring、`nested` 嵌套文档 / **Meilisearch**: 零配置搜索体验 |
| **数据库迁移** | 工程实践 | `Flyway` (Java) / `Alembic` (Python) / `golang-migrate`；不停机迁移策略（扩展-收缩模式）；蓝绿数据库迁移 |
| **API Gateway** | 基础设施 | 限流 (Token Bucket/Leaky Bucket)；负载均衡 (Round Robin/Least Connections/Consistent Hashing)；认证卸载；熔断降级；`Kong` / `APISIX` |

</details>

<details>
<summary><strong>⭐⭐ &nbsp;进阶提升</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **分布式系统理论** | 系统设计 | CAP 定理与实际权衡；`Raft` 共识算法（Leader 选举/日志复制）；向量时钟；一致性哈希；`Paxos` 工程化变体 |
| **云架构** | 云原生 | AWS/GCP/Azure 核心服务选型；VPC 网络设计；IAM 最小权限原则；Serverless (Lambda/Cloud Functions)；成本优化（Reserved Instances/Spot）；多区域容灾 |
| **Service Mesh** | 网络治理 | `Istio` / `Linkerd`：mTLS 服务间加密；`VirtualService` 流量权重；金丝雀发布；可观测性 Sidecar 注入；`Envoy` Proxy 原理 |
| **数据库分片与复制** | 高可用存储 | 水平分片键选择；读写分离主从延迟处理；`PITR` 时间点恢复；`Patroni` PostgreSQL 高可用；跨区域多活方案 |
| **性能分析** | 性能工程 | Go `pprof`；Java `async-profiler` 火焰图；Python `py-spy`；内存分配热点；GC Pause 分析；`k6` / `wrk` 压测基准 |

</details>

<details>
<summary><strong>⭐ &nbsp;专家领域</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **eBPF** | 内核可观测性 | `bpftrace` / `BCC` 工具集；网络包过滤 (XDP)；CPU 调度观测；无侵入性能分析；`Cilium` 网络策略 |
| **CRDT / OT** | 分布式数据 | `LWW-Register`；`G-Counter` / `PN-Counter`；`RGA` 文字协作；`Yjs` CRDT 库；无冲突合并语义 |
| **存储引擎** | 数据库内核 | `LSM-Tree` (LevelDB/RocksDB) vs `B-Tree` (InnoDB)；WAL 写前日志；`Compaction` 策略；内存表 MemTable 刷盘机制 |
| **自定义协议设计** | 网络编程 | 二进制帧格式设计；多路复用；流量控制；序列化格式权衡 (MessagePack/FlatBuffers/Cap'n Proto) |
| **形式化验证** | 正确性保证 | `TLA+` 状态机规约；基于属性的测试 (`Hypothesis`/`QuickCheck`)；模糊测试 (`AFL`/`go-fuzz`) |

</details>

---

<br/>

## 🔗 全栈工程师

> 贯通前后端，独立交付完整产品，横向覆盖广度。

<details open>
<summary><strong>⭐⭐⭐⭐⭐ &nbsp;基石 — 必须掌握</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **JavaScript / TypeScript** | 核心语言 | 同时精通浏览器 DOM 操作与 Node.js 运行时；理解模块系统差异 (CJS/ESM)；`tsconfig` 配置 `paths`/`strict`/`moduleResolution`；类型体操中等难度 |
| **React 18+ 或 Vue 3** | 前端框架 | 深度掌握组件生命周期、状态管理、性能优化（`memo`/`useMemo`/`useCallback`）；SSR 水合 (Hydration) 原理 |
| **Node.js + Express / Fastify** | 服务端运行时 | 中间件洋葱模型；`stream` 流式处理；`cluster` 多进程；`worker_threads`；路由分层；全局错误处理；`Zod` 请求校验 |
| **SQL + ORM** | 数据层 | PostgreSQL 精通；`Prisma` (类型安全 ORM) 或 `Drizzle` (SQL-first)；Schema 设计 + 关系建模 + 数据库迁移；`EXPLAIN` 查询优化 |
| **HTTP 协议精通** | 基础知识 | 方法语义；状态码；`Cache-Control` / `ETag` 缓存；`Cookie` / `Session`；`CORS` 预检；`Content-Type` 协商 |
| **Git 工程实践** | 版本控制 | `Conventional Commits` 规范；语义化版本 `semver`；`squash merge` 策略；`git log --graph` 历史阅读 |

</details>

<details>
<summary><strong>⭐⭐⭐⭐ &nbsp;强烈推荐</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **Next.js 14+ App Router** | 全栈框架 | `Server Components` vs `Client Components` 边界；`Server Actions` 表单提交；`Route Handlers` API 端点；`Middleware` 认证守卫；`generateStaticParams` SSG |
| **Tailwind CSS v4** | 样式框架 | 响应式前缀；`dark:` 变体；`@apply` 组件化；`shadcn/ui` 组件库集成；`CVA` 变体 API |
| **认证系统** | 安全 | `NextAuth.js v5` / `Lucia Auth` / `Clerk`：Session 管理；OAuth Provider 接入；`CSRF` 防护；密码哈希 (`bcrypt`/`argon2`) |
| **Docker + 基础 DevOps** | 部署 | `Dockerfile` 多阶段构建；`docker-compose.yml` 本地服务编排；环境变量管理 (`.env.local`)；容器健康检查 |
| **tRPC / REST API 设计** | API 层 | `tRPC` 端到端类型安全；`@trpc/tanstack-query` 集成；Input Validation (Zod)；`REST` 回退与互操作 |
| **测试体系** | 质量保障 | `Vitest` 单元测试；`React Testing Library` 组件测试；`Playwright` E2E 自动化；`MSW v2` API 模拟 |

</details>

<details>
<summary><strong>⭐⭐⭐ &nbsp;行业标准</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **Redis** | 缓存 / 队列 | 会话存储；限流 (`sliding window` 算法)；`BullMQ` 任务队列（重试/延迟/优先级）；缓存策略选型 |
| **GraphQL** | API 协议 | `Apollo Server` Schema 定义；Resolver 链；`DataLoader` 批量加载防 N+1；`graphql-codegen` 前端类型同步 |
| **CI/CD: GitHub Actions** | 自动化 | Workflow 触发条件；并行 job；`actions/cache` 依赖缓存；`deploy` to Vercel/Railway；`dependabot` 自动更新 |
| **云平台部署** | 运维 | `Vercel` (Next.js 零配置)；`Railway` (数据库托管)；`Render` / `Fly.io`；域名 + SSL + CDN 配置；环境变量分级 |
| **WebSocket / Socket.io** | 实时功能 | 双向实时通信；房间 (Room) 管理；连接状态维护；`@socket.io/redis-adapter` 多实例广播 |
| **Monorepo: Turborepo** | 工程架构 | `pnpm workspaces`；共享 `packages/ui` 组件库；`packages/db` 数据层；增量构建缓存；并行任务图 |

</details>

<details>
<summary><strong>⭐⭐ &nbsp;进阶提升</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **Edge Computing** | 边缘部署 | `Cloudflare Workers` / `Vercel Edge Middleware`；地理就近路由；流式 SSR；`KV` 边缘存储；减少 TTFB |
| **数据库高级优化** | 性能 | `PgBouncer` 连接池；慢查询日志分析；覆盖索引；`pg_stat_statements`；读副本分流；`VACUUM` / `ANALYZE` |
| **PWA + 离线架构** | 用户体验 | `Workbox` Service Worker；`Cache API` 离线页面；`IndexedDB` 本地数据同步；`Background Sync` |
| **全栈安全加固** | 安全 | `CSP` 内容安全策略；SQL 注入防护 (参数化查询)；`XSS` 输出转义；`HSTS`；`rate-limit` 中间件；依赖审计 `pnpm audit` |
| **Serverless 模式** | 架构 | AWS Lambda / Vercel Functions；冷启动优化；幂等函数设计；`EventBridge` 事件驱动；`Step Functions` 工作流 |

</details>

<details>
<summary><strong>⭐ &nbsp;专家领域</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **实时协作** | 协同功能 | `CRDT` (Yjs)；`Liveblocks` / `PartyKit`；OT 操作变换；Presence 在线感知；冲突合并策略 |
| **AI / LLM 集成** | AI 能力 | `Vercel AI SDK` 流式 Token 渲染；`useChat` / `useCompletion` Hooks；Tool Calling 前端集成；RAG 搜索结果展示 |
| **多区域 + 全球边缘 DB** | 全球化 | `Neon` / `PlanetScale` 全球分布式 PostgreSQL/MySQL；边缘读副本；`Turso` (LibSQL)；延迟感知路由 |
| **Micro-Frontend** | 大型架构 | `Module Federation`；独立部署子应用；路由协商；共享依赖去重；版本隔离策略 |
| **WebAssembly 集成** | 性能极限 | Rust → WASM 编译集成；`wasm-pack`；性能关键路径迁移；与 Web API 互操作 |

</details>

---

<br/>

## 🤖 大模型应用开发工程师

> 基于 LLM 构建智能应用，掌控 AI 时代的产品力核心。

<details open>
<summary><strong>⭐⭐⭐⭐⭐ &nbsp;基石 — 必须掌握</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **Python 3.10+** | 核心语言 | `async/await` 异步编程；`Pydantic v2` 数据校验与序列化；`dataclasses`；类型注解 (TypeVar/Protocol)；`contextlib` 上下文管理；`httpx` 异步 HTTP 客户端 |
| **Prompt Engineering** | AI 核心技能 | `System Prompt` 角色设定；`Few-Shot` 示例学习；`Chain-of-Thought (CoT)` 推理引导；输出格式约束（JSON/XML）；`Temperature` / `Top-P` 参数调优；`ReAct` 推理-行动模式；幻觉缓解策略 |
| **主流 LLM API** | AI 平台 | **OpenAI GPT-4o/o3**: Function Calling、JSON Mode、Vision、Batch API / **Anthropic Claude 3.5**: Tool Use、Extended Thinking / **Google Gemini 1.5 Pro**: 100万上下文窗口、多模态；Token 计费与成本控制 |
| **RAG — 检索增强生成** | 知识库架构 | 文档分块策略（Fixed/Semantic/Hierarchical Chunking）；Embedding 向量化；Top-K 语义检索；`Context Assembly` 上下文拼装；`Reranking` 重排序提升精度；检索结果的引用溯源 |
| **向量数据库** | 存储检索 | **Pinecone**: 托管向量搜索 / **Weaviate**: GraphQL + 混合搜索 / **Chroma**: 本地开发 / **Milvus**: 十亿级向量 / **pgvector**: PostgreSQL 原生向量；ANN 算法 (HNSW/IVF)；元数据过滤 |
| **LangChain v0.3 / LlamaIndex** | 开发框架 | `LCEL` (LangChain Expression Language)；Chain 组合；Document Loaders；Output Parsers；Retriever 抽象；Memory 管理；`VectorstoreRetriever` |

</details>

<details>
<summary><strong>⭐⭐⭐⭐ &nbsp;强烈推荐</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **Embedding 深度知识** | AI 核心 | `text-embedding-3-large` / `BGE-M3` / `Sentence-Transformers`；余弦相似度原理；维度压缩 (Matryoshka)；多语言向量对齐；`late chunking` 长文档嵌入 |
| **Agent + Tool Use** | AI 智能体 | `Function Calling` / `Tool Use` 格式规范；`ReAct` Agent 循环；`OpenAI Assistants API` (Thread/Run)；结构化输出 (`Instructor` / `Outlines`)；`Pydantic AI` |
| **LLM 评估体系** | 质量保障 | `RAGAS` (Faithfulness/Answer Relevancy/Context Recall)；`DeepEval`；`LangSmith` 自动化评估；人工评估维度设计；A/B 测试框架；Benchmark 数据集构建 |
| **FastAPI 服务化** | 后端工程 | `async` 端点；`StreamingResponse` Token 流式输出；`Depends` 依赖注入；`BackgroundTasks`；`Lifespan` 资源管理；OpenAPI 文档自动生成 |
| **多 Agent 系统** | 系统架构 | `LangGraph` 状态机图；`CrewAI` 角色分工；`AutoGen` 对话模式；Human-in-the-loop 中断机制；Agent 间工具调用协议；并行 Agent 执行 |
| **文档处理管道** | 数据工程 | `PyMuPDF` PDF 文本+表格提取；`Unstructured.io` 多格式解析；`Docling` 复杂版式理解；`markitdown` Office 转 Markdown；图像内容 OCR + 描述 |

</details>

<details>
<summary><strong>⭐⭐⭐ &nbsp;行业标准</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **本地模型部署** | 推理服务 | `Ollama`：本地模型管理 + OpenAI 兼容 API；`vLLM`：PagedAttention 高吞吐推理；`LM Studio` GUI 工具；`llama.cpp` CPU 推理；GGUF 量化格式 |
| **多模态能力** | AI 扩展 | `GPT-4o` Vision 图像理解；`Whisper` 语音转文字；`TTS API` 文字转语音；视频帧提取 + 描述；`ColPali` 图像 PDF RAG |
| **可观测性与追踪** | 生产运维 | `LangSmith` Prompt 版本管理 + 链路追踪；`LangFuse` 开源替代；`Phoenix` (Arize) 模型监控；Token 消耗统计；延迟分布分析 |
| **混合检索** | 检索优化 | `BM25` 关键词检索 + 向量语义检索融合；`RRF` (Reciprocal Rank Fusion) 排序合并；`pgvector` + `pg_search` 原生混合；`Elasticsearch` 稀疏+密集向量 |
| **流式架构** | 用户体验 | `SSE` (Server-Sent Events) Token 逐字输出；`WebSocket` 双向对话；`asyncio` 流控制；Backpressure 处理；前端 `useChat` / `ReadableStream` 消费 |
| **提示词版本管理** | 工程实践 | `LangSmith Hub` Prompt 托管；`PromptLayer` A/B 测试；Git 管理 `.prompt` 文件；`DSPy` 自动提示优化 |

</details>

<details>
<summary><strong>⭐⭐ &nbsp;进阶提升</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **LoRA / QLoRA 微调** | 模型训练 | `PEFT` 库；`LoRA` 低秩矩阵适配；`QLoRA` 4-bit 量化微调；训练数据集构建（格式 `alpaca`/`sharegpt`）；`Unsloth` 加速框架；`Axolotl` 配置化训练 |
| **模型量化** | 推理优化 | `GPTQ`：后训练权重量化；`AWQ`：激活感知量化；`GGUF`：llama.cpp 格式；`bitsandbytes` 8-bit/4-bit；量化精度损失评估 |
| **LLM 安全** | 安全工程 | 提示注入 (Prompt Injection) 检测与防御；越狱 (Jailbreak) 对抗；`NeMo Guardrails` / `Llama Guard` 内容过滤；输出扫描 (PII 脱敏)；输入清洗策略 |
| **推理增强** | 高级推理 | `OpenAI o1/o3`、`DeepSeek-R1` 思维链解码；Inference-Time Compute Scaling；`Self-Consistency` 多路采样投票；`ToT` (Tree of Thoughts)；`CoT-SC` |
| **知识图谱 + GraphRAG** | 高级检索 | `Neo4j` 图数据库；`GraphRAG`（微软）实体关系提取；社区摘要；`Triplex` 关系抽取；图遍历增强检索 |

</details>

<details>
<summary><strong>⭐ &nbsp;专家领域</strong></summary>

<br/>

| 技术 / 工具 | 类别 | 核心掌握深度 |
|:---|:---:|:---|
| **Transformer 架构** | 模型原理 | `Multi-Head Attention` 数学推导；`RoPE` / `ALiBi` 位置编码；`KV Cache` 推理加速；`Flash Attention` 内存高效计算；`MoE` 混合专家结构 |
| **RLHF / DPO 对齐** | 模型训练 | `PPO` 策略优化；奖励模型训练；`DPO` (Direct Preference Optimization)；`ORPO`；偏好数据集构建；Constitutional AI 原则 |
| **分布式训练** | 大规模计算 | `DeepSpeed ZeRO-3`；`FSDP` (Fully Sharded Data Parallel)；梯度检查点；张量并行 / 流水线并行；`Megatron-LM` |
| **投机解码 / 推理加速** | 系统优化 | `Speculative Decoding`（草稿模型加速）；`Continuous Batching`；`vLLM PagedAttention` 内存管理；`TensorRT-LLM`；`ExLlamaV2` |
| **预训练数据工程** | 基础设施 | 互联网数据清洗管道 (FineWeb)；去重算法 (MinHash)；多语言采样；`tokenizer` 设计 (BPE/SentencePiece)；数据质量分类器 |

</details>

---

<br/>

## 📊 横向技能对比

> 四类工程师在关键维度上的技术侧重分布。

| 技能维度 | 🎨 前端 | ⚙️ 后端 | 🔗 全栈 | 🤖 大模型 |
|:---:|:---:|:---:|:---:|:---:|
| 用户界面 / 交互 | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| 系统设计 / 架构 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 数据库 / 存储 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| AI / 机器学习 | ⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| DevOps / 部署 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 性能优化 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 安全工程 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 数据处理 / ETL | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 测试 / 质量 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| CS 基础理论 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

<br/>

<div align="center">

**持续更新 · 与技术演进同步**

*最后更新：2025 年 · 基于真实工程实践与顶级大厂技术栈整理*

</div>
