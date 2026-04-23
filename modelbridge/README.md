# ModelBridge

> 面向国内/国际企业与开发者的 AI 中台 SaaS 产品方案 —— **模型管理 + API 服务 + 智能机器人接入 + LLM 参数提取**，支持自托管 / 云端部署、按需微调与多模型推理。

本目录是 **ModelBridge** 产品的完整设计文档（产品 / 技术 / 运营 / 合规 / 路线图），并附可执行的 MVP 与 30 / 90 / 180 天计划。文档为可直接交付的方案草案，后续可在本目录下逐步补充 API 规格（[`openapi.yaml`](./openapi.yaml)）、SDK 模板、Helm chart、PoC 模板等可交付物。

---

## 目录

- [1. 产品定位与价值主张](#1-产品定位与价值主张)
- [2. 核心产品模块](#2-核心产品模块功能清单)
- [3. 技术架构（高层）](#3-技术架构高层)
- [4. LLM 参数提取 — 技术细节与实现路线](#4-llm-参数提取技术细节与实现路线)
- [5. 多模型管理与优化实践](#5-多模型管理与优化实践)
- [6. API 设计（示例核心 endpoints）](#6-api-设计示例核心-endpoints)
- [7. 开发者体验（DX）](#7-开发者体验dx)
- [8. 商业模式与定价策略](#8-商业模式与定价策略)
- [9. GTM（市场与销售）](#9-gtm市场与销售)
- [10. 合规与法律](#10-合规与法律)
- [11. 运营与监控指标（KPI）](#11-运营与监控指标kpi)
- [12. MVP 快速上线清单](#12-mvp最小可行产品快速上线清单)
- [13. 30 / 90 / 180 天路线图](#13-3090180-天路线图执行级)
- [14. 团队与角色建议](#14-团队与角色建议首期核心团队)
- [15. 预算估算（首年初估）](#15-预算估算首年初估人民币)
- [16. 风险与缓解](#16-风险与缓解)
- [17. 交付物](#17-交付物可直接交付)
- [下一步：需要你确认的输入](#下一步需要你确认的输入)

---

## 1) 产品定位与价值主张

- **产品名称（可替换）**：ModelBridge（示例）
- **目标客户**：希望把 AI 能力快速接入业务的中小企业与开发者；优先行业：SaaS、客服 / 呼叫中心、金融风控、电商、制造（智能质检）、医疗 / 法务（合规前提）。
- **核心价值**：把"复杂的多模型运维与参数调优"抽象成简单的 API / SDK 与可视化控制台，让业务方专注场景与数据，降低落地成本与时间。
- **差异化**：支持多种开源模型（Llama 2 / Meta、Mistral、InternLM 等）、端到端模型管理（注册 / 微调 / 量化 / 版本回滚）、专门的 **"LLM 参数提取"** 产品（高可靠的结构化抽取能力），并提供现场服务 / 出差支持。

## 2) 核心产品模块（功能清单）

### 接入层（开发者友好）
- REST + gRPC + WebSocket API（聊天 & 批量推理）
- SDK：Python、Node.js、Java（示例）与 CLI 工具
- Webhook & event callbacks，支持流式与非流式响应

### Model Management（ML Ops）
- 模型注册 / 版本 / 元数据、自动化测试套件、A/B 测试、回滚
- 微调管理（LoRA / PEFT 支持）、自动化超参实验（可插 W&B / MLflow）
- 模型格式转换与量化（float16、int8/4、ggml、ONNX）与验证

### Inference Layer（推理平台）
- 支持 GPU（NVIDIA Triton / vLLM）和 CPU（llama.cpp、ggml）部署
- 弹性伸缩、请求排队、优先级队列、批处理与缓存（LLM 响应缓存）

### LLM 参数提取产品（专项模块）
- **目标**：从用户输入 / 对话中准确抽取结构化参数（slot/value），支持复杂规则、可配置 schema、上下文关联、值校验与置信度输出
- **多策略实现**：
  1. Prompt-based schema extraction + function-calling（快速上线，低成本）
  2. Fine-tuned seq2seq / NER 模型（高准确率，可控输出格式）
  3. Hybrid：先用 classifier 判断意图 / 场景，再调用专属 extractor（节省推理成本）
  4. RAG + KB 校验（结合向量库校验或补全缺失值）
- **特性**：可视化 schema 编辑器、样本标注工具、自动生成正则 / 校验规则、版本对比、性能监控

### Data & Embeddings
- 向量数据库支持：Milvus / Weaviate / Pinecone（可选）
- Embedding 管线（OpenAI-style / 开源 embedding models）与去重策略

### Console & Dev Portal
- API keys 管理、流量 / 账单仪表、模型调度面板、测试控制台、文档与示例项目

### 安全、隔离与合规
- 多租户隔离（数据分区、KMS 加密）、审计日志、IP 白名单、RBAC
- 支持客户内网部署或私有云部署（SaaS + on‑prem 混合）

## 3) 技术架构（高层）

| 层 | 选型 |
| --- | --- |
| 前端 | React + Next.js（控制台与开发者文档） |
| API 网关 | Kong / Traefik 或 AWS API Gateway（认证、限流、日志） |
| Backend | 微服务架构（FastAPI / NestJS），任务队列（Celery / RabbitMQ / Redis Queue） |
| 推理层 | Kubernetes + KServe / Triton / vLLM pods，旁路缓存（Redis） |
| 模型仓库 | S3 / 对象存储（AliOSS / AWS S3）+ metadata（Postgres） |
| 向量库 | Milvus / Weaviate（部署在同一集群或专用服务） |
| 监控 | Prometheus + Grafana；Tracing：Jaeger / OpenTelemetry；日志：ELK 或 Loki |
| CI/CD | GitHub Actions / GitLab CI + ArgoCD（K8s 部署） |
| 管理面板 | 内部微服务 + Next.js 控制台 |
| 安全 | KMS（Vault / 云 KMS）、WAF、TLS、IDS/IPS |

## 4) LLM 参数提取—技术细节与实现路线

### 需求拆解
- **输入**：任意自然语言（单轮 / 多轮），或业务表单文本
- **输出**：标准化 JSON schema（字段名、类型、置信度、来源位置、时间戳）
- **约束**：支持可配置 schema、默认值、单位转换、实体解析（人名 / 金额 / 日期）、上下文继承

### 方法论（分阶段）
- **阶段 A（极速 MVP）**：Prompt engineering + function-calling
  - 使用开源 LLM 或商业 API，设计 few-shot prompt，要求返回 JSON 严格格式
  - **优点**：上线快；**缺点**：边界与稳定性差，需要大量 prompt 成本
- **阶段 B（稳态）**：微调专用 extractor
  - 收集标注数据（半自动标注 + 人工审校），训练 seq2seq 或 token-classification（NER）模型。使用 LoRA / PEFT 降成本。
  - 在推理端用小型 quantized 模型做快速抽取；对难样本调用更大模型或 RAG 校验。
- **阶段 C（高可用 / 企业级）**：混合策略 + 校验层
  - 意图识别模型 + slot extractor + 规则校验 + KB 校验（向量检索 / 外部 API）+ 回退到人工工单。
  - 输出置信度阈值与人工复审流程（当置信度低于阈值时触发人工介入）。

### 开发工具与库
- **标注工具**：Label Studio、Doccano（自托管）
- **微调**：PEFT / LoRA + Hugging Face Transformers + Accelerate
- **推理**：vLLM / LlamaCPP / FasterTransformer / Triton
- **Schema validation**：jsonschema，定制规则引擎
- **评估指标**：精确率 / 召回 / F1、字段级准确率、端到端业务 KPI（比如自动化率提升）

## 5) 多模型管理与优化实践

- 支持模型蓝绿与 A/B：路由请求到不同模型并收集差异数据
- 自动量化流水线：训练 → 量化 → 基准测试 → 部署（自动对比延时 / 精度）
- 热 / 冷模型分层：高频调用触发预热或常驻 GPU；冷模型放在弹性池
- 成本优化：使用低精度、低成本推理（quantized CPU）处理低优先级任务；对高价值任务使用大模型

## 6) API 设计（示例核心 endpoints）

完整 OpenAPI 草案见 [`openapi.yaml`](./openapi.yaml)。

```http
POST /v1/infer
{
  "model_id": "...",
  "input":  { "type": "chat" | "text", "messages": [...] },
  "params": { "temperature": 0.2, "max_tokens": 512,
              "extraction_schema": { /* optional */ } },
  "tenant_id": "...",
  "callback_url": "https://..."
}
→ { "request_id": "...", "status": "queued" }
```

```http
GET  /v1/infer/{id}            # 轮询
WS   /v1/stream                # 实时流式输出
```

```http
POST /v1/extract               # 专用参数抽取
{
  "model_id": "...",
  "text": "...",
  "schemaId": "...",
  "context": { ... },
  "options": { "confidence_threshold": 0.8,
               "mode": "prompt" | "fine_tuned" }
}
→ { "extracted_json": { ... }, "confidence": 0.93, "provenance": [...] }
```

**管理 API**：`/v1/models`、`/v1/models/{id}/versions`、`/v1/keys`、`/v1/usage`

## 7) 开发者体验（DX）

- 丰富文档 + API Explorer（Swagger / Redoc）
- 即时 Sandbox（控制台内免费额度可试用）
- SDK 示例（一键在本地运行 demo）
- 模板库：聊天机器人、客服自动化、参数提取模版、RAG FAQ bot

## 8) 商业模式与定价策略

| 层级 | 内容 |
| --- | --- |
| Freemium | 免费额度（如每月 1 000 次调用 / 50 k tokens）吸引开发者快速试用 |
| Usage-based | 按调用次数 + 计算资源（GPU 秒）与模型大小计费（精细计费） |
| Subscription | 基础包（开发者）、专业包（中小企业，含 SLO、更多并发）、企业包（SLA、私有部署、现场支持） |
| 增值服务 | 模型微调包、数据标注、咨询 / 上门部署、训练 / 优化服务 |
| 企业合同 | 按年收费 + 成功指标（KPI）绑定，含出差与交付费 |

## 9) GTM（市场与销售）

### 初始渠道
- **技术 BD**：目标 SaaS 公司、系统集成商（SI）、行业垂直平台（客服厂商）
- **社区与内容**：技术博客（落地案例）、开源贡献（demo repo）、Webinar / 线上沙龙
- **合作**：向量数据库厂商、云服务商、SaaS 平台做集成与联合营销

### 商业动作
- 提供 2 – 4 周 PoC 优惠（付定金）换取案例与推荐信
- 建立"解决方案包"：客服 Bot 包、参数提取包、RAG FAQ 包，便于销售快速上单

### 销售流程
线索采集 → 技术评估（1 小时）→ PoC → 合同 → 部署 → 成功案例上架

## 10) 合规与法律

- **数据保护**：分级存储（敏感数据不上云 / 在客户网络处理），提供数据删除、审计日志与合同性承诺（NDA）
- **模型 / 数据许可**：确保使用的开源模型许可可商用（注意部分模型 / weights 限制）
- **合规认证（目标）**：ISO 27001 / SOC 2 Type II（长期）
- **中国合规注意**：若处理敏感行业（医疗 / 金融 / 政务），需按法规准备备案或内网部署方案

## 11) 运营与监控指标（KPI）

- **产品**：月活 API Keys、月事件数、平均响应时延（p50 / p95）、成功率、错误率
- **商业**：MRR、ARR、CAC、LTV、流失率（churn）、PoC → 成单 转化率
- **运维**：平均恢复时间（MTTR）、SLA 达成率、资源利用率（GPU / CPU）

## 12) MVP（最小可行产品）— 快速上线清单

按优先级：

1. **公共面**
   - 基本网站 + 开发者中心文档 + 控制台登录
   - API：`/v1/infer`（支持 prompt 与 chat），含 API key 管理
   - 控制台 sandbox：试用额度与示例
2. **核心后台**
   - Model registry（上传 / 选择开源模型）+ 简单微调入口（LoRA 上传训练数据）
   - 简单推理服务（单模型、单实例，支持流式）
3. **专项**
   - 参数提取接口：初版基于 prompt 的 schema-extract（支持 JSON 输出与置信度）
   - Billing 基础（记录使用量、显示账单）
4. **安全**：API key 鉴权、HTTPS、基础日志和审计

## 13) 30 / 90 / 180 天路线图（执行级）

### 0 – 30 天（快速出 MVP）
- 搭建网站 / 控制台 + REST API 基础 + Model registry + prompt-based 参数抽取 API
- 准备 2 个垂直示例（客服机器人、订单参数抽取），上线 sandbox demo
- 获取 5 个技术早期用户（免费 PoC 或折扣）

### 31 – 90 天（强化产品与商业化）
- 上线微调流水线（LoRA / PEFT）、自动化量化与基准测试
- 发布 SDK（Python / Node）与 webhook 支持
- 开始付费策略（订阅 + usage），做首批付费合同（目标 3 个）
- 实现多模型切换、基本 SLA 与监控（Prometheus、Alerts）

### 91 – 180 天（可扩展与企业化）
- 支持私有部署（on‑prem / VPC）与合规文档（NDA / 合同模板）
- 优化参数抽取为微调模型 + 校验层，提高准确率并降低成本
- 建立售后 / 现场出差交付团队、标准化 PoC 套餐与培训资料
- 开始拿第一个中大型企业合同（年付）、目标 ARR 初步达成

## 14) 团队与角色建议（首期核心团队）

| 角色 | 数量 |
| --- | --- |
| CTO / 技术负责人（后端 + 推理） | 1 |
| ML 工程师（微调、量化、benchmark） | 1 – 2 |
| 后端工程师（API、队列、账单） | 1 – 2 |
| 前端（控制台 / 文档） | 1 |
| DevOps（K8s、监控、部署） | 1 或外包 |
| 产品 / TPM（需求、SOW、客户沟通） | 1 |
| 销售 / BD（行业对接、合同） | 1（外包或兼职） |
| 技术交付 / 咨询（支持现场服务） | 1 – 2（按项目外包） |

## 15) 预算估算（首年初估，人民币）

- **初期 MVP**（云主机 + 人力 3 个月）：¥ 300 k – 800 k（若使用现成开源 + 小团队）
- **生产化**（SLA、企业支持、私有部署能力）：追加 ¥ 500 k – 2 M（含合规 / 证书 / 销售）
- **备注**：若客户需要 GPU 训练 / 推理或大规模托管，基础设施成本将显著上升（按实际工单计费转嫁客户）

## 16) 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 成本风险（GPU 高） | 提供多层产品，低成本 CPU 路径与按需大模型策略；把重训练成本转移到客户或按次计费 |
| 法律 / 许可风险 | 逐一审核模型许可，必要时使用自研或商业许可模型 |
| 技术复杂度 | 先以 prompt-based 实现功能，平滑演进到微调 / 本地化方案；把复杂度封装到平台内部 |
| 市场竞争 | 差异化靠"上门交付 + 模型管理 + 参数抽取模板库 + 企业私有部署"打包能力 |

## 17) 交付物（可直接交付）

### 包 A — 开发者首版
- API Spec（OpenAPI 3.0）+ SDK 模板（Python / Node）
- Next.js 管理控制台模版（用户登录、API Key、使用量面板）
- 参数抽取示例：schema json、prompt 模板、评估脚本

### 包 B — 企业上门包
- PoC 流程与 SOW 模板、报价单、合同 + NDA + 出差政策模板
- 现场部署脚本（K8s Helm charts、模型镜像、CI/CD）

### 包 C — 市场材料
- 落地页文案 + 3 个行业案例页面 + 5 条冷启邮件 / 私信模板

---

## 下一步：需要你确认的输入

为把本方案细化为可直接交付的技术文档、API 规格与部署脚本，请提供：

1. **优先目标客户**（行业 / 规模）
2. **是否必须支持客户内网（on‑prem）**
3. **首年预算与团队状况**

收到上述输入后，将基于本目录继续补充：
- `openapi.yaml` 的完整字段定义与错误码
- `sdk/python`、`sdk/node` 的最小可用客户端
- `deploy/helm` Helm chart 与 `deploy/docker-compose.yml`
- `extraction/` 下的 schema 样例、prompt 模板与评估脚本
- `gtm/` 下的 PoC SOW、报价单、邮件模板
