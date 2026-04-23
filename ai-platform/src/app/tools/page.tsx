import Link from "next/link";

const capabilities = [
  {
    id: "api",
    icon: "⚡",
    title: "统一 API 网关",
    subtitle: "一套接口，连接所有模型",
    desc: "无需为每个模型维护独立 SDK。ModelBridge 统一了所有主流 LLM 的接口格式，自动处理认证、限流、重试、流式响应与错误映射。支持 OpenAI 兼容格式，已有代码零成本迁移。",
    features: [
      "OpenAI 兼容 API，代码零迁移成本",
      "自动故障转移与多模型降级策略",
      "细粒度限流与优先级队列",
      "流式（SSE）与批量推理双模式",
      "请求/响应拦截器与中间件扩展",
    ],
    codeTitle: "统一调用任意模型",
    code: `from modelbridge import Client

client = Client(api_key="mb-****")

# 切换模型只需改一个参数
for model in ["gpt-4o", "claude-3-5-sonnet", "deepseek-v3"]:
    resp = client.chat(
        model=model,
        messages=[{"role": "user", "content": "解释量子纠缠"}],
        stream=True,
    )
    for chunk in resp:
        print(chunk.delta, end="", flush=True)`,
    color: "from-indigo-500/10 to-violet-500/10",
    tagColor: "tag-cyan",
    tag: "核心",
  },
  {
    id: "rag",
    icon: "📚",
    title: "RAG 知识管线",
    subtitle: "企业知识库，开箱即用",
    desc: "内置完整的 RAG（检索增强生成）管线：文档解析（PDF/Word/Markdown/网页）→ 智能分块 → 向量化 → 混合检索（向量 + BM25）→ Rerank → 上下文注入 → 生成。支持 Milvus、Weaviate、Pinecone 向量库，可一键对接自有数据。",
    features: [
      "支持 PDF / Word / Excel / Markdown / HTML / 网页抓取",
      "多策略分块（固定窗口 / 语义 / 递归）",
      "混合检索：稠密向量 + 稀疏 BM25 融合",
      "CrossEncoder Rerank，召回精度提升 30%+",
      "知识库版本管理与增量更新",
    ],
    codeTitle: "快速构建企业知识库",
    code: `from modelbridge.rag import RAGPipeline

pipeline = RAGPipeline(
    vector_store="milvus",          # 或 weaviate / pinecone
    embedding_model="text-embedding-3-large",
    rerank_model="bge-reranker-v2",
)

# 一行导入文档
pipeline.ingest("./company_docs/", chunk_size=512)

# 智能检索 + 生成
answer = pipeline.query(
    question="公司的退款政策是什么？",
    llm="gpt-4o",
    top_k=5,
)
print(answer.text, answer.sources)`,
    color: "from-cyan-500/10 to-sky-500/10",
    tagColor: "tag-green",
    tag: "热门",
  },
  {
    id: "extraction",
    icon: "🔍",
    title: "LLM 参数提取",
    subtitle: "结构化信息，精准抽取",
    desc: "ModelBridge 专有的参数提取产品，从非结构化对话或文本中精准抽取 JSON 格式的结构化数据（slot/value）。支持可视化 Schema 编辑、上下文关联、值校验、置信度评分，适用于智能客服、表单填写、意图识别等高价值场景。",
    features: [
      "可视化 Schema 编辑器，无需编写代码",
      "多策略实现：Prompt-based / Fine-tuned NER / Hybrid",
      "上下文关联补全缺失字段",
      "置信度评分与人工审核队列",
      "支持正则 / 枚举 / 范围值校验规则",
    ],
    codeTitle: "从对话中提取结构化参数",
    code: `from modelbridge.extraction import Extractor

extractor = Extractor(
    schema={
        "destination": {"type": "str", "required": True},
        "departure_date": {"type": "date", "format": "YYYY-MM-DD"},
        "passengers": {"type": "int", "min": 1, "max": 9},
        "cabin_class": {"type": "enum", "values": ["经济", "商务", "头等"]},
    }
)

result = extractor.extract(
    text="我想订明天从上海到北京的机票，两个人，商务舱"
)
# {"destination": "北京", "departure_date": "2025-04-24",
#  "passengers": 2, "cabin_class": "商务", "_confidence": 0.97}
print(result.json())`,
    color: "from-violet-500/10 to-purple-500/10",
    tagColor: "tag-cyan",
    tag: "专项",
  },
  {
    id: "agent",
    icon: "🤖",
    title: "Agent 工作流",
    subtitle: "多 Agent 协作，自动化复杂任务",
    desc: "基于 ReAct 和 Function Calling 构建智能 Agent，内置丰富工具市场（网络搜索、代码执行、数据库查询、API 调用、文件读写），支持多 Agent 协作工作流与人在环（Human-in-the-Loop）模式，轻松构建企业自动化流程。",
    features: [
      "ReAct / Function Calling 双推理模式",
      "内置 20+ 工具：搜索 / 代码执行 / 计算 / 数据库 / 邮件",
      "多 Agent 协作与任务委派（DAG 编排）",
      "Human-in-the-Loop 人工审核节点",
      "可视化 Agent 编排面板，无代码搭建流程",
    ],
    codeTitle: "快速构建多工具 Agent",
    code: `from modelbridge.agent import Agent, tools

agent = Agent(
    llm="claude-3-5-sonnet",
    tools=[
        tools.WebSearch(),
        tools.CodeInterpreter(),
        tools.DatabaseQuery(dsn=DATABASE_URL),
    ],
    system_prompt="你是一个专业的数据分析师助手。",
)

result = agent.run(
    "分析上个季度的销售数据，找出下滑最明显的产品线，"
    "并搜索行业趋势给出优化建议。"
)
print(result.final_answer)
print(result.tool_calls)   # 查看所有工具调用记录`,
    color: "from-amber-500/10 to-orange-500/10",
    tagColor: "tag-amber",
    tag: "Agent",
  },
  {
    id: "llmops",
    icon: "📊",
    title: "LLMOps 监控",
    subtitle: "全链路可观测，成本透明",
    desc: "全链路 Trace 追踪每一次 LLM 调用，记录输入输出、Token 用量、延迟、成本，支持质量标注与人工评估。内置 AB 测试框架，帮助团队持续优化 Prompt 和模型选型。实时告警与账单预警保障业务稳定运行。",
    features: [
      "全链路 Trace（请求 → 模型 → 响应 → 工具调用）",
      "实时 Token 用量与成本账单（按项目/团队分摊）",
      "Prompt 版本管理与 AB 测试对比",
      "人工标注与 LLM 自动评估双模式",
      "告警规则：延迟 / 错误率 / 成本超限通知",
    ],
    codeTitle: "自动追踪所有 LLM 调用",
    code: `import modelbridge
from modelbridge.ops import trace

# 一行启用全链路追踪
modelbridge.init(
    api_key="mb-****",
    project="customer-service-bot",
    tracing=True,
)

@trace(name="answer_faq")
def answer_question(question: str) -> str:
    response = client.chat(
        model="gpt-4o",
        messages=[{"role": "user", "content": question}],
    )
    return response.content
    
# 所有调用自动上报到 ModelBridge 监控台
# 可在 console.modelbridge.ai 查看 Trace`,
    color: "from-rose-500/10 to-pink-500/10",
    tagColor: "tag-rose",
    tag: "运维",
  },
  {
    id: "security",
    icon: "🔒",
    title: "企业安全合规",
    subtitle: "数据隔离，合规先行",
    desc: "从数据存储到推理全链路均提供企业级安全保障：多租户数据物理隔离、传输加密（TLS 1.3）、静态加密（AES-256 / KMS）、RBAC 权限控制、操作审计日志。支持私有化 On-Prem 部署，满足金融、医疗、政务等高合规要求。",
    features: [
      "多租户物理隔离（数据库 / 存储 / 推理）",
      "传输加密 TLS 1.3 + 静态 AES-256/KMS",
      "精细化 RBAC：组织 / 项目 / API Key 三级权限",
      "完整操作审计日志，满足等保 2.0",
      "Docker Compose / Kubernetes 私有化一键部署",
    ],
    codeTitle: "私有化部署（Docker Compose）",
    code: `# docker-compose.yml（简化示意）
version: "3.9"
services:
  api:
    image: modelbridge/api:latest
    environment:
      - SECRET_KEY=\${SECRET_KEY}
      - DB_URL=postgresql://\${DB_USER}:\${DB_PASS}@db/mb
    ports: ["8080:8080"]
  
  worker:
    image: modelbridge/worker:latest
    deploy:
      replicas: 4

  db:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]

# 一行启动完整平台
# docker compose up -d`,
    color: "from-slate-500/10 to-gray-500/10",
    tagColor: "",
    tag: "安全",
  },
];

const sdks = [
  { lang: "Python", icon: "🐍", cmd: "pip install modelbridge", color: "text-yellow-400" },
  { lang: "Node.js", icon: "🟩", cmd: "npm install @modelbridge/sdk", color: "text-green-400" },
  { lang: "Java", icon: "☕", cmd: "implementation 'ai.modelbridge:sdk:1.0'", color: "text-orange-400" },
  { lang: "Go", icon: "🔵", cmd: "go get github.com/modelbridge/go-sdk", color: "text-cyan-400" },
  { lang: "cURL", icon: "📡", cmd: "curl -X POST https://api.modelbridge.ai/v1/chat", color: "text-purple-400" },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="tag inline-block mb-4">功能特性</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            全栈 AI 能力，一站搞定
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            从 API 接入到 Agent 工作流，从 RAG 知识库到 LLMOps 监控，
            ModelBridge 覆盖企业 AI 落地全链路。
          </p>
        </div>

        {/* Capability sections */}
        <div className="space-y-24">
          {capabilities.map((cap, idx) => (
            <section key={cap.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${idx % 2 === 1 ? "lg:grid-flow-col-dense" : ""}`}>
              {/* Text side */}
              <div className={idx % 2 === 1 ? "lg:col-start-2" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{cap.icon}</span>
                  <span className={`tag ${cap.tagColor}`}>{cap.tag}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{cap.title}</h2>
                <p className="text-indigo-300 text-sm mb-4 font-medium">{cap.subtitle}</p>
                <p className="text-slate-400 leading-relaxed mb-6">{cap.desc}</p>
                <ul className="space-y-2">
                  {cap.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-slate-300 text-sm">
                      <svg className="text-indigo-400 flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code side */}
              <div className={idx % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                <div className={`rounded-2xl p-6 bg-gradient-to-br ${cap.color} border border-white/5`}>
                  <div className="code-block p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                      <span className="ml-2 text-slate-500 text-xs font-mono">{cap.codeTitle}</span>
                    </div>
                    <pre className="text-xs font-mono leading-relaxed overflow-x-auto text-slate-300 whitespace-pre-wrap">
                      {cap.code}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* SDK section */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <span className="tag inline-block mb-4">SDK & 集成</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              5 分钟完成接入
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              支持主流语言 SDK，OpenAI 兼容格式，已有代码无需大幅修改。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {sdks.map((sdk) => (
              <div key={sdk.lang} className="glass-card rounded-xl p-4 text-center cursor-default hover:border-indigo-500/40 transition-all">
                <div className="text-3xl mb-2">{sdk.icon}</div>
                <div className={`font-semibold mb-2 ${sdk.color}`}>{sdk.lang}</div>
                <code className="text-slate-500 text-xs block truncate">{sdk.cmd}</code>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/docs" className="btn-primary px-8 py-3 rounded-xl font-semibold text-sm inline-block">
              查看完整文档 →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center glass-card rounded-2xl p-10 mt-16 gradient-border bg-gradient-to-br from-indigo-900/20 to-violet-900/20">
          <h2 className="text-2xl font-bold text-white mb-3">准备好了吗？</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">免费额度，5 分钟接入，无需信用卡。</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs" className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-block">
              免费开始
            </Link>
            <Link href="/pricing" className="btn-outline px-6 py-2.5 rounded-lg text-sm font-semibold inline-block">
              查看定价
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
