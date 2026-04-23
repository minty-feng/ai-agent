# Dify

> Dify 是一个开源的 LLM 应用开发平台，提供 **工作流编排 + RAG 管线 + Agent 能力 + 模型管理 + 可观测性** 的一体化解决方案，支持云端托管与私有部署。

本文档是对 Dify 平台的深度解析，涵盖产品定位、核心架构、模块拆解、部署方式、API 设计、生态对接与竞品分析，可作为选型、二次开发与企业落地的参考。

---

## 目录

- [1. 产品定位](#1-产品定位)
- [2. 核心架构](#2-核心架构)
- [3. 核心模块拆解](#3-核心模块拆解)
- [4. 工作流（Workflow）详解](#4-工作流workflow详解)
- [5. RAG 管线](#5-rag-管线)
- [6. Agent 能力](#6-agent-能力)
- [7. 模型管理](#7-模型管理)
- [8. API 与 SDK](#8-api-与-sdk)
- [9. 部署方式](#9-部署方式)
- [10. 可观测性与监控](#10-可观测性与监控)
- [11. 安全与多租户](#11-安全与多租户)
- [12. 生态与集成](#12-生态与集成)
- [13. 与同类工具对比](#13-与同类工具对比)
- [14. 企业落地建议](#14-企业落地建议)
- [15. 资源与参考](#15-资源与参考)

---

## 1) 产品定位

| 维度 | 说明 |
| --- | --- |
| **开源协议** | Apache 2.0（自托管完全免费；云端托管有免费层 + 付费计划） |
| **目标用户** | 产品经理、开发者、企业 AI 团队——无需深度 ML 背景即可构建生产级 LLM 应用 |
| **核心价值** | 把 Prompt 工程、RAG、Agent、工作流编排抽象为可视化低代码界面，并对外暴露标准 API |
| **部署模式** | Dify Cloud（SaaS）/ Docker Compose（单机）/ Kubernetes（生产集群）/ 私有化 |
| **支持模型** | OpenAI、Anthropic、Azure OpenAI、Google Gemini、Mistral、Llama 系列、本地 Ollama 等 100+ |

### 与同类平台的核心差异
- **可视化工作流**：拖拽节点构建多步 LLM 管线，无需写代码
- **内置 RAG**：文档上传 → 自动解析 → 向量化 → 检索，一键完成
- **Agent + 工具调用**：内置 40+ 工具（搜索、代码执行、HTTP 请求等），支持 ReAct / Function Calling
- **多模型路由**：同一应用可混用不同模型（按节点 / 按成本路由）
- **LLMOps 闭环**：内置日志、标注、评估与微调数据集导出

---

## 2) 核心架构

```
┌─────────────────────────────────────────────────────────┐
│                        用户 / 客户端                      │
│           Web Chat  |  API  |  Embedded Widget           │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────┐
│                  API 服务层（Flask/Gunicorn）              │
│  /v1/chat-messages  /v1/completion-messages  /v1/files   │
└──────┬──────────────┬───────────────┬───────────────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────────────┐
│  工作流引擎  │ │  RAG 服务  │ │      Agent 执行器       │
│ (DAG runner)│ │(Indexing + │ │ (ReAct / Function Call) │
└──────┬──────┘ │ Retrieval) │ └─────────────────────────┘
       │        └─────┬──────┘
┌──────▼──────────────▼──────────────────────────────────┐
│                  模型调用层（LLM Router）                  │
│     OpenAI  |  Anthropic  |  Azure  |  Ollama  |  …    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                      基础设施层                           │
│  PostgreSQL(元数据)  Redis(缓存/队列)  Weaviate/Qdrant    │
│  Celery Worker(异步任务)  MinIO/S3(文件)  Nginx(网关)     │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

| 组件 | 技术 |
| --- | --- |
| 后端 API | Python + Flask（生产用 Gunicorn） |
| 前端控制台 | Next.js + React + TypeScript + Tailwind CSS |
| 任务队列 | Celery + Redis |
| 数据库 | PostgreSQL（元数据）+ Redis（缓存/会话） |
| 向量库 | Weaviate / Qdrant / Milvus / pgvector / Chroma（可选） |
| 文件存储 | MinIO（本地）/ AWS S3 / Azure Blob / 阿里云 OSS |
| 网关 | Nginx |
| 容器 | Docker Compose（单机）/ Helm（K8s） |

---

## 3) 核心模块拆解

### 3.1 Studio（可视化编辑器）
- **Chatbot 编辑器**：单轮 / 多轮对话，配置 System Prompt、上下文窗口、模型参数
- **Workflow 编辑器**：拖拽节点构建 DAG，支持条件分支、循环、并行、变量传递
- **Agent 编辑器**：定义工具集、推理策略（ReAct / Function Calling）、迭代次数限制
- **文本生成应用**：批量处理场景，如文章摘要、数据提取

### 3.2 知识库（Knowledge Base）
- 支持 PDF、Word、Markdown、HTML、CSV、Notion、GitHub 等数据源
- 自动分块（chunk）策略（固定长度 / 语义分割）
- Embedding 模型可选（OpenAI、本地 HuggingFace 模型等）
- 向量检索 + 关键词检索（混合检索）
- 引用溯源：响应中标注来源文档与段落

### 3.3 模型供应商（Model Provider）
- 统一接口屏蔽不同 LLM 的 API 差异
- 支持配置多个同类模型（A/B 切换、备用路由）
- 支持本地模型（通过 Ollama / LM Studio 接入）
- 模型能力标注：对话 / 补全 / Embedding / Reranking / TTS / 图像

### 3.4 工具（Tools）
- 内置工具：Google Search、Wikipedia、Bing、代码解释器（Python）、HTTP 请求、文件读写
- 自定义工具：通过 OpenAPI schema 引入任意外部 API
- 工具权限控制：可限制 Agent 调用范围

### 3.5 日志与标注（Logs & Annotation）
- 全量请求日志（输入 / 输出 / tokens / 延迟 / 用户反馈）
- 人工标注（赞 / 踩 / 修改期望输出）→ 导出为微调数据集
- 内置评估（答案相关性、忠实度、上下文精确率）

---

## 4) 工作流（Workflow）详解

Dify Workflow 是平台最核心的差异化能力，采用 **有向无环图（DAG）** 模型。

### 节点类型

| 节点 | 用途 |
| --- | --- |
| **Start** | 工作流入口，定义输入变量 |
| **LLM** | 调用语言模型（可配置不同模型、prompt、参数） |
| **Knowledge Retrieval** | 从知识库检索相关文档 |
| **Question Classifier** | 意图分类（多分支路由） |
| **Condition** | if / else 分支（基于变量 / 表达式） |
| **Code** | 执行 Python / JavaScript 代码片段 |
| **HTTP Request** | 调用外部 API |
| **Template** | Jinja2 模板渲染（组装输出） |
| **Variable Aggregator** | 合并多分支变量 |
| **Iteration** | 对列表逐项循环处理 |
| **Tool** | 调用内置或自定义工具 |
| **End** | 定义输出变量，终止工作流 |

### 变量系统
- 节点间通过变量传递数据（`{{node_id.output_key}}`）
- 支持系统变量（`sys.user_id`、`sys.conversation_id`）
- 支持环境变量（密钥等敏感配置不暴露在节点配置中）

### 执行模式
- **Chatflow**：带会话状态的工作流，适合多轮对话
- **Workflow**：无状态批处理，适合数据处理管线

---

## 5) RAG 管线

```
文档上传
  → 文档解析（PDF/Word/HTML → 纯文本）
  → 文本分块（chunk_size / overlap 可配）
  → Embedding（向量化）
  → 写入向量数据库
                        ↓ 查询时
用户输入
  → 查询改写（Query Rewrite，可选）
  → 混合检索（向量相似度 + BM25 关键词）
  → Reranking（交叉编码器重排，可选）
  → Top-K 文档注入 Prompt
  → LLM 生成带引用的回答
```

### RAG 高级配置
- **检索模式**：向量 / 全文 / 混合
- **Reranking**：Cohere Rerank / BGE Reranker / Jina Reranker
- **最大引用数（Top-K）** 与 **相似度阈值** 可配
- **父子块（Parent-Child Chunk）**：检索子块、注入父块，兼顾精确检索与上下文完整性
- **多知识库**：一个应用可同时检索多个知识库

---

## 6) Agent 能力

### 推理策略
- **Function Calling**：模型原生工具调用（OpenAI / Claude / Gemini 等）
- **ReAct**：思考 → 行动 → 观察循环，适合不支持 Function Calling 的模型

### Agent 执行流程
```
用户输入
  → 规划（Thought）
  → 选择工具 + 参数（Action）
  → 工具执行（Observation）
  → 循环直到生成最终答案（Final Answer）
```

### 内置工具（部分）
- 搜索：Google、Bing、DuckDuckGo、Tavily、Serper
- 内容：Wikipedia、ArXiv、YouTube Transcript
- 代码：Python 解释器（沙箱执行）
- 通讯：Gmail、Slack、Telegram
- 数据：SQL 查询、文件操作
- 其他：HTTP 请求（通用 REST 调用）

---

## 7) 模型管理

### 模型类型
| 类型 | 说明 |
| --- | --- |
| LLM | 对话 / 补全 |
| Text Embedding | 向量化 |
| Rerank | 检索重排 |
| Speech-to-Text | 语音转文字 |
| Text-to-Speech | 文字转语音 |
| Image Generation | 图像生成（如 DALL·E） |

### 本地模型接入（Ollama）
```bash
# 本地启动 Ollama
ollama pull llama3
# Dify 配置 → 模型供应商 → Ollama → 填写 http://localhost:11434
```

### 模型参数配置
每个应用节点可独立配置：Temperature、Top-P、Max Tokens、Stop Sequences、Presence/Frequency Penalty

---

## 8) API 与 SDK

Dify 对外暴露 **应用级 API**（非平台管理 API），每个已发布应用有独立的 API Key。

### 核心端点

```http
# 对话（Chat）
POST /v1/chat-messages
Authorization: Bearer {app-api-key}
{
  "inputs": {},
  "query": "用户输入",
  "response_mode": "blocking" | "streaming",
  "conversation_id": "",   // 多轮时传入
  "user": "user-001"
}

# 文本生成（Completion）
POST /v1/completion-messages

# 工作流执行
POST /v1/workflows/run

# 文件上传
POST /v1/files/upload

# 获取对话历史
GET /v1/messages?conversation_id=xxx

# 消息反馈（赞/踩）
POST /v1/messages/{id}/feedbacks

# 停止响应（流式）
POST /v1/chat-messages/{task_id}/stop
```

### 流式响应（SSE）
```
data: {"event": "message", "answer": "你好", "conversation_id": "..."}
data: {"event": "message", "answer": "！", "conversation_id": "..."}
data: {"event": "message_end", "metadata": {"usage": {...}}}
```

### 官方 SDK
- Python：`pip install dify-client`
- Node.js：`npm install dify-client`
- 社区 SDK：Java、Go、PHP、.NET

---

## 9) 部署方式

### 方式一：Docker Compose（推荐单机/开发）
```bash
git clone https://github.com/langgenius/dify.git
cd dify/docker
cp .env.example .env
# 编辑 .env 填写 SECRET_KEY、数据库等配置
docker compose up -d
# 访问 http://localhost/install 完成初始化
```

**最低配置**：2 核 CPU / 4 GB RAM / 20 GB 磁盘

### 方式二：Kubernetes（生产）
```bash
helm repo add dify https://langgenius.github.io/dify-helm
helm install dify dify/dify \
  --set global.host=your-domain.com \
  --set postgresql.enabled=true \
  --set redis.enabled=true
```

### 方式三：Dify Cloud
- 直接使用 https://cloud.dify.ai
- 免费层：200 次消息 / 天；付费层按工作区计费

### 关键环境变量（.env）
| 变量 | 说明 |
| --- | --- |
| `SECRET_KEY` | Flask 密钥（必填） |
| `DB_*` | PostgreSQL 连接配置 |
| `REDIS_*` | Redis 连接配置 |
| `STORAGE_TYPE` | local / s3 / azure / aliyun-oss |
| `VECTOR_STORE` | weaviate / qdrant / milvus / pgvector |
| `OPENAI_API_KEY` | OpenAI 密钥（可在 UI 中配置，无需此变量） |

---

## 10) 可观测性与监控

### 内置 LLMOps
- 请求日志：每次调用的 prompt、输出、token 用量、延迟、用户 ID
- 标注工作台：人工审查并修正输出，数据可导出
- 评估套件：自动化评估答案质量（需配置评估模型）

### 外部集成
- **Langfuse**：完整 trace 记录（工作流每步的输入输出）
- **LangSmith**：LangChain 官方 trace 平台
- **OpenTelemetry**：通用可观测性协议

### 指标（可通过日志或 Prometheus 抓取）
- 请求量（QPS）、成功率、p50/p95 延迟
- Token 用量（按模型、按应用、按用户）
- 知识库检索命中率

---

## 11) 安全与多租户

- **工作区隔离**：多工作区（Workspace）数据完全隔离
- **RBAC**：Owner / Admin / Editor / Member / Guest 五级权限
- **API Key 隔离**：每个应用独立 API Key，可随时撤销
- **SSO**：支持 SAML 2.0（企业版）
- **审计日志**：操作记录（企业版）
- **私有部署**：数据不离开客户网络，支持完全离线（使用本地模型）

---

## 12) 生态与集成

| 类别 | 集成 |
| --- | --- |
| LLM 提供商 | OpenAI、Anthropic、Google、Azure、Mistral、Cohere、月之暗面、智谱 AI、百度文心、讯飞星火、阿里通义等 100+ |
| 向量数据库 | Weaviate、Qdrant、Milvus、pgvector、Chroma、Pinecone、Zilliz |
| 文档解析 | Unstructured、Azure Document Intelligence |
| Reranker | Cohere、BGE、Jina |
| 监控 | Langfuse、LangSmith、OpenTelemetry |
| 部署 | Docker、Kubernetes / Helm、Render、Railway |
| 工具 | 通过 OpenAPI schema 无缝接入任意 REST API |

---

## 13) 与同类工具对比

详细横向对比见 [../ai-tools-comparison/README.md](../ai-tools-comparison/README.md)。

| 维度 | Dify | LangChain | LlamaIndex | Flowise |
| --- | --- | --- | --- | --- |
| 上手方式 | 可视化低代码 | 代码 | 代码 | 可视化低代码 |
| 工作流编排 | ✅ 内置拖拽 | ⚠️ LangGraph（代码） | ⚠️ 有限 | ✅ 内置拖拽 |
| RAG | ✅ 内置全套 | ⚠️ 需手动组装 | ✅ 专长 | ✅ 内置 |
| Agent | ✅ ReAct + FC | ✅ 最完整 | ⚠️ 基础 | ✅ 内置 |
| 模型管理 | ✅ 多供应商统一 | ⚠️ 库层面 | ⚠️ 库层面 | ✅ 节点配置 |
| 私有部署 | ✅ Docker/K8s | ✅（自行搭建） | ✅（自行搭建） | ✅ Docker |
| 生产 LLMOps | ✅ 内置 | ⚠️ 需 LangSmith | ⚠️ 需外接 | ⚠️ 有限 |
| 定制灵活度 | ⚠️ 受平台限制 | ✅ 最高 | ✅ 高 | ⚠️ 中 |

---

## 14) 企业落地建议

### 适用场景
- 企业内部知识库问答（HR、IT、法务 FAQ）
- 客服自动化（接管简单工单，复杂转人工）
- 内容生成管线（报告、摘要、翻译）
- 数据提取与结构化处理（与 [ModelBridge 参数提取](../modelbridge/README.md) 互补）

### 私有化要点
1. 关闭 `ALLOW_REGISTER`，仅允许管理员邀请账户
2. 选择本地 Embedding 模型（避免数据外发）
3. 使用内网 Ollama 接入本地 LLM
4. 向量库选 pgvector（利用现有 PostgreSQL）或独立 Qdrant
5. 配置 SMTP 发件（用户邀请、密码重置）

### 与 ModelBridge 协同
- **ModelBridge** 负责底层：模型注册、微调、量化、推理 API
- **Dify** 负责上层：工作流编排、知识库、Agent、面向业务的低代码界面
- 通过 Dify 的 **Custom Tool（OpenAPI schema）** 调用 ModelBridge 的 `/v1/infer` 与 `/v1/extract`

---

## 15) 资源与参考

- 官网：https://dify.ai
- GitHub：https://github.com/langgenius/dify（⭐ 70k+）
- 文档：https://docs.dify.ai
- Discord：https://discord.gg/FngNHpbcY7
- 中文文档：https://docs.dify.ai/zh-hans
- 本地模型接入（Ollama）：https://docs.dify.ai/guides/model-configuration/ollama
