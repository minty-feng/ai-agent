import Link from "next/link";

// ───────────────────────────── data ──────────────────────────────

const tools = [
  {
    id: "openai",
    name: "OpenAI Assistants & Agents SDK",
    type: "官方框架",
    icon: "🟢",
    stars: "—",
    license: "MIT / 官方",
    color: "from-emerald-500/20 to-teal-500/20",
    tagColor: "tag-green",
    tag: "官方首选",
    desc: "OpenAI 官方推出的应用层套件：Assistants API（线程式对话 + 内置 Code Interpreter / File Search / Function Calling）与 Agents SDK（轻量多 Agent 编排 + Handoff + Tracing），是接入 GPT-4o / o1 / o3 系列最稳的官方路径。",
    strengths: [
      "Assistants API：内置文件检索、代码解释器、Threads 状态管理",
      "Agents SDK：声明式定义 Agent / Tool / Handoff，几行代码搭多 Agent",
      "原生 Function Calling 与结构化输出（JSON Schema）",
      "官方 Tracing 面板，调用链可视化排查",
    ],
    bestFor: "深度依赖 GPT-4o / o 系列、希望使用官方稳定能力的团队",
    setupTime: "Hello World 10 分钟 · 可用 Demo 1 天",
  },
  {
    id: "dify",
    name: "Dify",
    type: "低代码平台",
    icon: "🎨",
    stars: "70k+",
    license: "Apache 2.0",
    color: "from-purple-500/20 to-fuchsia-500/20",
    tagColor: "tag-cyan",
    tag: "推荐入门",
    desc: "LLM 应用的「可视化全栈平台」。拖拽式工作流编辑器，内置 RAG 知识库、LLMOps 日志与标注，100+ 模型支持，非技术团队也能直接上手。",
    strengths: ["可视化工作流，产品/运营可自助操作", "内置 RAG：上传文档即用，无需写代码", "完整 LLMOps：日志、标注、评估、人工反馈", "Docker 私有化部署门槛极低"],
    bestFor: "企业知识库问答、客服 Bot、非技术团队主导项目",
    setupTime: "Hello World 10 分钟 · 可用 Demo 1 天",
  },
  {
    id: "langchain",
    name: "LangChain",
    type: "代码框架",
    icon: "🔗",
    stars: "95k+",
    license: "MIT",
    color: "from-green-500/20 to-emerald-500/20",
    tagColor: "tag-green",
    tag: "生态最大",
    desc: "LLM 应用开发的「乐高积木」。LCEL 管道语法优雅，LangGraph 支持复杂有状态多 Agent 工作流，LangSmith 提供最完整的 LLMOps 能力，500+ 集成生态。",
    strengths: ["LCEL 管道语法优雅，组合极灵活", "LangGraph 支持复杂有状态多 Agent", "LangSmith 最完整的 LLMOps 能力", "500+ 集成：向量库、模型、工具"],
    bestFor: "高度定制推理链、复杂 Agent 逻辑、有 Python 开发团队的项目",
    setupTime: "Hello World 1 小时 · 生产就绪 1 月",
  },
  {
    id: "llamaindex",
    name: "LlamaIndex",
    type: "代码框架",
    icon: "🦙",
    stars: "38k+",
    license: "MIT",
    color: "from-yellow-500/20 to-amber-500/20",
    tagColor: "tag-amber",
    tag: "RAG 专长",
    desc: "以 RAG 为核心的数据框架。150+ 数据连接器（PDF/Notion/SQL/GitHub），多种索引策略（向量/树/知识图谱），子问题分解与多步检索，多模态联合检索。",
    strengths: ["150+ 数据连接器，从 PDF 到 GitHub", "多种索引策略：向量/树/关键词/知识图谱", "高级检索：子问题分解、HyDE、RAPTOR", "事件驱动异步 Workflow（v0.10+）"],
    bestFor: "文档检索核心应用、复杂 RAG 多索引策略、多模态检索",
    setupTime: "Hello World 1 小时 · 可用 Demo 3 天",
  },
  {
    id: "autogen",
    name: "AutoGen",
    type: "多 Agent 框架",
    icon: "🤝",
    stars: "37k+",
    license: "MIT",
    color: "from-blue-500/20 to-indigo-500/20",
    tagColor: "",
    tag: "微软出品",
    desc: "微软开源的多 Agent 对话框架。ConversableAgent 通过消息传递协作，GroupChat 多 Agent 自动选择发言，内置 Human-in-the-Loop，Agent 可在 Docker 沙箱执行代码。",
    strengths: ["GroupChat：多 Agent 对话协作，自动选发言者", "Human-in-the-Loop：内置人机协作节点", "代码执行：Agent 在 Docker 沙箱生成并运行代码", "AutoGen Studio：可视化配置 Agent 团队"],
    bestFor: "软件工程自动化、数据分析自动化、多专家协作复杂任务",
    setupTime: "Hello World 1 小时 · 可用 Demo 3 天",
  },
  {
    id: "crewai",
    name: "CrewAI",
    type: "多 Agent 框架",
    icon: "👥",
    stars: "25k+",
    license: "MIT",
    color: "from-rose-500/20 to-red-500/20",
    tagColor: "tag-rose",
    tag: "易上手",
    desc: "以「角色扮演团队」为核心的多 Agent 框架。每个 Agent 有 role/goal/backstory，像真实员工；任务可串行或由 Manager Agent 分配；内置搜索、代码执行、文件操作等工具。",
    strengths: ["Role-based Agent：role/goal/backstory 配置直观", "顺序/层级任务执行，流水线天然契合业务", "内置工具：搜索、代码执行、文件操作", "比 AutoGen 更易上手，代码量更少"],
    bestFor: "内容生产（研究→写作→校对）、销售自动化、多步骤业务流程",
    setupTime: "Hello World 30 分钟 · 可用 Demo 2 天",
  },
  {
    id: "flowise",
    name: "Flowise",
    type: "低代码平台",
    icon: "🌊",
    stars: "33k+",
    license: "Apache 2.0",
    color: "from-cyan-500/20 to-sky-500/20",
    tagColor: "tag-cyan",
    tag: "拖拽式",
    desc: "基于 LangChain 的可视化低代码平台。配置好流程后一键生成 REST API，一行代码嵌入任意网站，Marketplace 共享流程模板，Docker 部署简单。",
    strengths: ["基于 LangChain 节点，功能对齐 LangChain 生态", "API 直接导出：配置后一键生成 REST API", "嵌入式 Widget：一行代码嵌入任意网站", "Marketplace：共享流程模板，开箱即用"],
    bestFor: "快速原型、开发者构建内部工具、LangChain 生态但不想写代码",
    setupTime: "Hello World 20 分钟 · 可用 Demo 1 天",
  },
  {
    id: "haystack",
    name: "Haystack",
    type: "代码框架",
    icon: "🌾",
    stars: "18k+",
    license: "Apache 2.0",
    color: "from-orange-500/20 to-amber-500/20",
    tagColor: "",
    tag: "企业级",
    desc: "deepset 开源的企业级 NLP + RAG 框架。Pipeline 组件连接成有向图（类型安全），内置对接 Elasticsearch/Weaviate/Milvus，API 稳定，Hayhooks 一键发布为 REST API。",
    strengths: ["Pipeline 架构：组件有向图，类型安全", "内置对接 Elasticsearch、Weaviate、Milvus", "生产级：企业用户多，API 稳定", "内置完善的 RAG 评估指标框架"],
    bestFor: "传统 NLP 转 LLM、搜索增强、对稳定性要求高于灵活性的企业",
    setupTime: "Hello World 2 小时 · 可用 Demo 3 天",
  },
];

// ── AI 编程助手 / Coding Agents — 最新一代「LLM × IDE / CLI」工具 ──
const codingAgents = [
  {
    id: "claude-code",
    name: "Claude Code",
    vendor: "Anthropic",
    icon: "🧑‍💻",
    tag: "最新",
    tagColor: "tag-cyan",
    color: "from-orange-500/20 to-amber-500/20",
    desc: "Anthropic 官方推出的终端原生编程 Agent。直接在你的项目目录中调用 Claude 3.5/4 系列，自动读写文件、执行命令、运行测试，原生支持 MCP 工具协议，是当前最强的「Agentic Coding」工具之一。",
    highlights: [
      "终端 / VS Code 双端，零配置接入现有仓库",
      "Agentic 模式：规划 → 编辑 → 运行 → 自检全自动",
      "原生 MCP，可挂接任意工具与数据源",
      "企业版支持 SSO / 审计日志 / 私网代理",
    ],
    bestFor: "代码重构、跨文件大改、PR 草稿生成、自动化排障",
  },
  {
    id: "cursor",
    name: "Cursor",
    vendor: "Anysphere",
    icon: "⌘",
    tag: "AI IDE",
    tagColor: "",
    color: "from-indigo-500/20 to-violet-500/20",
    desc: "AI-first 的代码编辑器，基于 VS Code 内核重新打造。Composer 多文件编辑、Agent 模式自主执行、Tab 续写、Codebase 全仓库语义检索，已成为 AI 工程师事实标准之一。",
    highlights: [
      "Composer + Agent：跨文件需求一句话落地",
      "全仓库语义索引，回答 / 修改基于真实上下文",
      "支持 Claude / GPT / Gemini 等多模型自由切换",
      "Privacy Mode：代码不参与训练，企业可放心用",
    ],
    bestFor: "日常开发主力 IDE、新项目脚手架、跨文件重构",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    vendor: "GitHub × OpenAI",
    icon: "🐙",
    tag: "企业首选",
    tagColor: "tag-green",
    color: "from-slate-500/20 to-zinc-500/20",
    desc: "GitHub 与 OpenAI 联合出品、装机量最大的 AI 编程助手。Copilot Chat、Edits、Workspace、Coding Agent 一应俱全，与 GitHub Issues / PR / Actions 深度联动，企业合规背书最强。",
    highlights: [
      "覆盖 VS Code / JetBrains / Vim / Visual Studio 全家桶",
      "Coding Agent 直接在 GitHub Issue 上认领并提 PR",
      "企业版数据不留存、不训练，符合 SOC 2 / ISO 27001",
      "与 GitHub Actions / Code Scanning 无缝集成",
    ],
    bestFor: "已使用 GitHub 的团队、对合规审计要求高的企业",
  },
  {
    id: "codex-cli",
    name: "Codex CLI",
    vendor: "OpenAI",
    icon: "🔧",
    tag: "终端 Agent",
    tagColor: "tag-amber",
    color: "from-emerald-500/20 to-teal-500/20",
    desc: "OpenAI 开源的轻量级终端编程 Agent，由 o4-mini / GPT-4.1 系列驱动。沙箱执行、补丁审查、Approval 模式可控，定位与 Claude Code 直接对标，配合 OpenAI 账号可即开即用。",
    highlights: [
      "纯命令行，npm/brew 一键安装",
      "三档自治：建议 / 自动编辑 / 自动执行",
      "改动以 patch 形式呈现，便于 Code Review",
      "开源 MIT，可二次开发集成到内部工具链",
    ],
    bestFor: "脚本化批改、CI/CD 内嵌、轻量自动化任务",
  },
  {
    id: "aider",
    name: "Aider",
    vendor: "开源社区",
    icon: "🛠️",
    tag: "OSS",
    tagColor: "tag-rose",
    color: "from-rose-500/20 to-red-500/20",
    desc: "纯 Git 友好的开源终端编程 Agent。每次修改自动生成提交，repo-map 提取仓库骨架后高质量参与多文件改动，支持 GPT-4o / Claude / DeepSeek 等几乎所有主流模型。",
    highlights: [
      "每次修改自动 commit，回滚极简",
      "repo-map 自动提取仓库结构，token 利用率高",
      "支持 100+ 模型（含本地 Ollama / vLLM）",
      "适合学习 Agentic Coding 内部机制",
    ],
    bestFor: "开源项目维护、本地模型 + 私有代码、教学研究",
  },
  {
    id: "continue",
    name: "Continue",
    vendor: "Continue.dev",
    icon: "🔁",
    tag: "可定制",
    tagColor: "",
    color: "from-cyan-500/20 to-sky-500/20",
    desc: "开源的 IDE AI 助手框架（VS Code / JetBrains），允许企业用 YAML 自定义模型、上下文提供器、Slash 命令与 Agent，是想要「自建 Copilot」的团队的最佳起点。",
    highlights: [
      "完全开源、可私有化部署的 AI 助手前端",
      "YAML 配置模型路由、上下文、命令、规则",
      "支持 Ollama / vLLM / TGI 等本地后端",
      "与 ModelBridge 网关天然契合，统一管控用量",
    ],
    bestFor: "想自建公司内部 Copilot、严格数据不出域的企业",
  },
];

const matrix = [
  { dim: "可视化低代码", openai: "❌", dify: "✅", langchain: "❌", llamaindex: "❌", autogen: "❌", crewai: "❌", flowise: "✅", haystack: "❌" },
  { dim: "RAG / 知识库", openai: "✅File Search", dify: "✅内置", langchain: "✅完整", llamaindex: "✅专长", autogen: "⚠️基础", crewai: "⚠️基础", flowise: "✅内置", haystack: "✅完整" },
  { dim: "多 Agent 协作", openai: "✅Agents SDK", dify: "✅", langchain: "✅LangGraph", llamaindex: "✅", autogen: "✅多Agent", crewai: "✅多Agent", flowise: "✅", haystack: "✅" },
  { dim: "工作流编排", openai: "✅Handoff", dify: "✅拖拽DAG", langchain: "✅LangGraph", llamaindex: "⚠️有限", autogen: "✅对话流", crewai: "✅任务流", flowise: "✅拖拽", haystack: "✅Pipeline" },
  { dim: "非技术用户友好", openai: "❌", dify: "✅最友好", langchain: "❌", llamaindex: "❌", autogen: "❌", crewai: "❌", flowise: "✅友好", haystack: "❌" },
  { dim: "生产稳定性", openai: "✅官方", dify: "✅高", langchain: "⚠️API变化", llamaindex: "✅较稳定", autogen: "✅较稳定", crewai: "✅稳定", flowise: "✅较稳定", haystack: "✅企业级" },
  { dim: "私有化部署", openai: "❌仅云端", dify: "✅", langchain: "✅自行搭建", llamaindex: "✅自行搭建", autogen: "✅自行搭建", crewai: "✅自行搭建", flowise: "✅", haystack: "✅" },
];

const scenarios = [
  {
    label: "A",
    title: "企业内部知识库（非技术团队）",
    rec: "Dify",
    color: "from-purple-500/10 to-fuchsia-500/10",
    reason: "可视化知识库管理，产品/运营可自助上传文档、调整 Prompt、查看日志，无需开发介入。",
  },
  {
    label: "B",
    title: "客服自动化 + CRM 集成",
    rec: "Dify + LangChain",
    color: "from-green-500/10 to-emerald-500/10",
    reason: "Dify 做意图识别与 FAQ 回答，LangChain 实现复杂 CRM API 调用逻辑，通过 Dify Custom Tool 对接。",
  },
  {
    label: "C",
    title: "合同/报表结构化数据提取",
    rec: "ModelBridge + LangChain",
    color: "from-indigo-500/10 to-violet-500/10",
    reason: "ModelBridge 提供高可靠参数提取 API，LangChain 做批量文档处理管线，准确率 >95%。",
  },
  {
    label: "D",
    title: "AI 编程助手 / 软件工程自动化",
    rec: "AutoGen 或 LangGraph",
    color: "from-blue-500/10 to-cyan-500/10",
    reason: "规划 Agent + 代码执行 Agent + 测试 Agent 协作，AutoGen 的 GroupChat 或 LangGraph 状态机均擅长此场景。",
  },
  {
    label: "E",
    title: "内容生产流水线（调研→撰写→审校）",
    rec: "CrewAI",
    color: "from-rose-500/10 to-red-500/10",
    reason: "角色化 Agent 配置直观，任务串行流水线天然契合内容生产场景，代码量少，上手快。",
  },
  {
    label: "F",
    title: "复杂 RAG（多数据源 + 多索引策略）",
    rec: "LlamaIndex + LangChain",
    color: "from-yellow-500/10 to-amber-500/10",
    reason: "LlamaIndex 数据连接器和索引能力最强，构建索引后用 LangChain 做应用逻辑，强强联合。",
  },
  {
    label: "G",
    title: "高稳定性企业级 NLP/RAG",
    rec: "Haystack",
    color: "from-orange-500/10 to-amber-500/10",
    reason: "API 稳定、企业用户验证充分、Pipeline 架构类型安全，适合稳定性优先的团队。",
  },
  {
    label: "H",
    title: "快速出原型 + 无运维压力",
    rec: "Dify Cloud 或 Flowise",
    color: "from-cyan-500/10 to-sky-500/10",
    reason: "上手时间最短，Dify Cloud 免部署，Flowise Docker 极简部署，适合快速验证业务假设。",
  },
];

const services = [
  {
    icon: "🗺️",
    title: "工具选型咨询",
    desc: "根据你的业务场景、团队技术栈、预算与合规要求，为你提供量身定制的工具选型建议，避免踩坑，缩短决策周期。",
    items: ["场景分析与需求梳理", "工具对比与 POC 方案设计", "技术风险评估与选型报告"],
  },
  {
    icon: "🛠️",
    title: "搭建与部署支持",
    desc: "从 Docker 部署到 Kubernetes 生产集群，从 Dify 私有化到 LangChain 生产环境，我们提供全程技术支持，帮你快速落地。",
    items: ["私有化部署（Docker / K8s）", "CI/CD 集成与自动化配置", "性能调优与高可用架构"],
  },
  {
    icon: "📈",
    title: "效果优化与迭代",
    desc: "上线后持续监控 RAG 召回质量、Agent 任务成功率、LLM 成本，定期评估并优化 Prompt 与检索策略，保障业务效果持续提升。",
    items: ["RAG 召回质量评估与优化", "Prompt 工程与 AB 测试", "成本优化与模型降级策略"],
  },
];

const trends = [
  { num: "01", title: "多 Agent 系统成主流", desc: "CrewAI / AutoGen / LangGraph 的多 Agent 协作模式正在成为标准架构，单 Agent 无法应对复杂任务。" },
  { num: "02", title: "低代码与代码融合", desc: "Dify 工作流支持嵌入代码，LangGraph 可视化工具逐步完善，低代码与代码的边界正在模糊。" },
  { num: "03", title: "本地模型崛起", desc: "Llama 3、Qwen 2.5、Mistral 等开源模型质量接近 GPT-4，配合 Ollama/vLLM，私有部署成本大幅下降。" },
  { num: "04", title: "Advanced RAG 成熟", desc: "Multi-Query、Rerank、HyDE、RAPTOR 等技术成熟，LlamaIndex 和 LangChain 均有完整支持。" },
  { num: "05", title: "LLMOps 规范化", desc: "LangSmith、Langfuse 等工具建立 LLM 可观测性标准，AI 应用进入精细化运营阶段。" },
  { num: "06", title: "MCP 协议普及", desc: "Anthropic 的 MCP 正成为 Agent 工具集成新标准，Dify、LangChain 均已支持或计划支持。" },
];

// ───────────────────────────── page ──────────────────────────────

export default function EcosystemPage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-7xl mx-auto">

        {/* ── Hero ── */}
        <div className="text-center mb-20">
          <span className="tag inline-block mb-4">生态工具</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            主流 AI 工具，我们全部玩转
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            从 <span className="text-indigo-400 font-medium">OpenAI Assistants</span>、
            <span className="text-indigo-400 font-medium">Dify</span>、
            <span className="text-indigo-400 font-medium">LangChain</span> 到最新的{" "}
            <span className="text-indigo-400 font-medium">Claude Code</span> /{" "}
            <span className="text-indigo-400 font-medium">Cursor</span> /{" "}
            <span className="text-indigo-400 font-medium">Codex CLI</span>——
            ModelBridge 团队深度掌握主流 AI 工具与 Agent 生态，提供选型咨询、私有化搭建与持续优化支持。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link href="/pricing" className="btn-primary px-8 py-3 rounded-xl font-semibold text-sm inline-block">
              预约咨询 →
            </Link>
            <Link href="/docs" className="btn-outline px-8 py-3 rounded-xl font-semibold text-sm inline-block">
              查看文档
            </Link>
          </div>
        </div>

        {/* ── Tool cards ── */}
        <section className="mb-28">
          <div className="text-center mb-12">
            <span className="tag inline-block mb-4">工具全景</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">主流应用框架深度解析</h2>
            <p className="text-slate-400 max-w-xl mx-auto">从官方 Assistants 到开源框架，我们在每个工具上都有真实的生产落地经验，帮你少走弯路。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${tool.color} flex flex-col`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tool.icon}</span>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight">{tool.name}</h3>
                      <p className="text-slate-500 text-xs">{tool.type} · ⭐ {tool.stars}</p>
                    </div>
                  </div>
                  <span className={`tag ${tool.tagColor} flex-shrink-0`}>{tool.tag}</span>
                </div>

                {/* Desc */}
                <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">{tool.desc}</p>

                {/* Strengths */}
                <ul className="space-y-1.5 mb-4">
                  {tool.strengths.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-slate-300 text-xs">
                      <svg className="text-indigo-400 flex-shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="border-t border-white/5 pt-3 mt-auto">
                  <p className="text-slate-500 text-xs mb-1">
                    <span className="text-slate-400 font-medium">最适合：</span>{tool.bestFor}
                  </p>
                  <p className="text-slate-500 text-xs">
                    <span className="text-slate-400 font-medium">上手时间：</span>{tool.setupTime}
                  </p>
                </div>
              </div>
            ))}

            {/* ModelBridge card */}
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 gradient-border flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🌉</span>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">ModelBridge</h3>
                    <p className="text-slate-500 text-xs">推理中台 · 自研</p>
                  </div>
                </div>
                <span className="tag flex-shrink-0">自研</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                底层推理中台——模型管理 + 统一推理 API + LLM 参数提取。是上层 Dify / LangChain 的算力与模型底座，与上述所有工具无缝集成。
              </p>
              <ul className="space-y-1.5 mb-4">
                {["统一 API 接入 50+ 大模型，零代码切换", "LLM 参数提取引擎，准确率 >95%", "RAG 管线、Agent 框架、LLMOps 一体化", "企业级安全合规，支持私有化 On-Prem 部署"].map((s) => (
                  <li key={s} className="flex items-start gap-2 text-slate-300 text-xs">
                    <svg className="text-indigo-400 flex-shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
              <div className="border-t border-white/5 pt-3 mt-auto">
                <Link href="/tools" className="text-indigo-400 text-xs font-medium hover:text-indigo-300 transition-colors">
                  查看全部功能特性 →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Coding Agents — 「最新一代编程 Agent」 ── */}
        <section className="mb-28">
          <div className="text-center mb-12">
            <span className="tag tag-cyan inline-block mb-4">最新趋势 · Coding Agents</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              主流 AI 编程 Agent，全部驾驭
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              从 Anthropic <span className="text-indigo-400 font-medium">Claude Code</span>、OpenAI{" "}
              <span className="text-indigo-400 font-medium">Codex CLI</span>，到{" "}
              <span className="text-indigo-400 font-medium">Cursor</span> /{" "}
              <span className="text-indigo-400 font-medium">GitHub Copilot</span>——
              我们帮你在团队中落地最新一代 Agentic Coding 工具，统一接入、统一计费、统一治理。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {codingAgents.map((agent) => (
              <div
                key={agent.id}
                className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${agent.color} flex flex-col`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{agent.icon}</span>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight">{agent.name}</h3>
                      <p className="text-slate-500 text-xs">{agent.vendor}</p>
                    </div>
                  </div>
                  <span className={`tag ${agent.tagColor} flex-shrink-0`}>{agent.tag}</span>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">{agent.desc}</p>

                <ul className="space-y-1.5 mb-4">
                  {agent.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-slate-300 text-xs">
                      <svg className="text-indigo-400 flex-shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="border-t border-white/5 pt-3 mt-auto">
                  <p className="text-slate-500 text-xs">
                    <span className="text-slate-400 font-medium">最适合：</span>{agent.bestFor}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-slate-500 text-sm">
            还有 <span className="text-slate-300">Windsurf · Cline · Roo Code · Devin · Zed AI</span>{" "}
            等？我们都跟进过生产落地经验，可在咨询时具体讨论选型。
          </div>
        </section>

        {/* ── Comparison matrix ── */}
        <section className="mb-28">
          <div className="text-center mb-12">
            <span className="tag inline-block mb-4">横向对比</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">核心能力对比矩阵</h2>
            <p className="text-slate-400 max-w-xl mx-auto">一张表看清各工具的能力边界，快速锁定适合你的方案。</p>
          </div>

          <div className="glass-card rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 font-medium px-5 py-4 min-w-[140px]">维度</th>
                  {["OpenAI", "Dify", "LangChain", "LlamaIndex", "AutoGen", "CrewAI", "Flowise", "Haystack"].map((h) => (
                    <th key={h} className="text-center text-slate-300 font-semibold px-3 py-4 min-w-[100px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={row.dim} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                    <td className="text-slate-400 px-5 py-3 font-medium">{row.dim}</td>
                    {[row.openai, row.dify, row.langchain, row.llamaindex, row.autogen, row.crewai, row.flowise, row.haystack].map((val, j) => (
                      <td key={j} className="text-center px-3 py-3 text-slate-300 text-xs">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Scenario recommendations ── */}
        <section className="mb-28">
          <div className="text-center mb-12">
            <span className="tag inline-block mb-4">场景选型</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">不同场景，最优组合推荐</h2>
            <p className="text-slate-400 max-w-xl mx-auto">我们根据上百个落地案例总结出的选型建议，避免盲目跟风。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scenarios.map((s) => (
              <div key={s.label} className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${s.color}`}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-extrabold text-white/20 leading-none mt-0.5 font-mono">{s.label}</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                    <div className="inline-flex items-center gap-1.5 mb-3">
                      <span className="text-indigo-400 text-xs font-medium">推荐：</span>
                      <span className="tag text-xs">{s.rec}</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Our services ── */}
        <section className="mb-28">
          <div className="text-center mb-12">
            <span className="tag inline-block mb-4">我们能帮你做什么</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">从选型到落地，全程护航</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              不只是工具推荐，我们提供端到端的 AI 工程落地服务，让技术真正转化为业务价值。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((svc) => (
              <div key={svc.title} className="glass-card rounded-2xl p-6">
                <div className="text-4xl mb-4">{svc.icon}</div>
                <h3 className="font-bold text-white text-lg mb-3">{svc.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{svc.desc}</p>
                <ul className="space-y-2">
                  {svc.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-300 text-sm">
                      <svg className="text-indigo-400 flex-shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trends ── */}
        <section className="mb-28">
          <div className="text-center mb-12">
            <span className="tag inline-block mb-4">2025 技术趋势</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">AI 工具生态正在快速演进</h2>
            <p className="text-slate-400 max-w-xl mx-auto">我们持续跟踪行业前沿，确保你的技术选型不落伍。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trends.map((t) => (
              <div key={t.num} className="glass-card rounded-2xl p-6">
                <div className="text-4xl font-extrabold text-white/10 font-mono mb-3">{t.num}</div>
                <h3 className="font-semibold text-white mb-2">{t.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="text-center glass-card rounded-2xl p-10 gradient-border bg-gradient-to-br from-indigo-900/20 to-violet-900/20">
          <h2 className="text-2xl font-bold text-white mb-3">不知道选哪个工具？让我们帮你决策</h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            描述你的业务场景，我们的 AI 工程师团队将在 24 小时内给出专业选型建议和 POC 方案。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing" className="btn-primary px-8 py-3 rounded-xl font-semibold text-sm inline-block">
              预约免费咨询
            </Link>
            <Link href="/tools" className="btn-outline px-8 py-3 rounded-xl font-semibold text-sm inline-block">
              了解 ModelBridge 能力
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
