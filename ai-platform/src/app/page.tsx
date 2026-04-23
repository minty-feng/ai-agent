import Link from "next/link";

// ───────────────────────────── data ──────────────────────────────

const stats = [
  { value: "50+", label: "主流大模型" },
  { value: "99.9%", label: "SLA 可用性" },
  { value: "10ms", label: "P50 延迟" },
  { value: "1000+", label: "企业客户" },
];

const features = [
  {
    icon: "🧠",
    title: "多模型统一接入",
    desc: "一套 API 同时连接 OpenAI、Anthropic、Google、Meta、Mistral、DeepSeek 等 50+ 大模型，自动故障转移，零代码切换。",
    tag: "核心能力",
    tagColor: "",
  },
  {
    icon: "🔍",
    title: "LLM 参数提取",
    desc: "从对话中精准抽取结构化参数（slot/value），支持可配置 schema、上下文关联、值校验与置信度输出，准确率 >95%。",
    tag: "专项产品",
    tagColor: "tag-cyan",
  },
  {
    icon: "📚",
    title: "RAG 知识管线",
    desc: "文档上传 → 智能分块 → 向量化 → 混合检索 → Rerank → 生成，支持 Milvus / Weaviate / Pinecone，开箱即用。",
    tag: "企业级",
    tagColor: "tag-green",
  },
  {
    icon: "🤖",
    title: "智能 Agent 框架",
    desc: "ReAct / Function Calling 双模式，原生兼容 OpenAI Agents SDK、Dify、LangChain、Claude Code 等主流框架，统一接入 50+ 工具市场，支持多 Agent 协作工作流。",
    tag: "Agent",
    tagColor: "tag-amber",
  },
  {
    icon: "📊",
    title: "LLMOps 监控",
    desc: "全链路 Trace、请求日志、成本账单、质量评估、AB 测试，一站式掌控所有模型的运行状态与效果。",
    tag: "运维",
    tagColor: "tag-rose",
  },
  {
    icon: "🔒",
    title: "企业安全合规",
    desc: "多租户隔离、KMS 加密、IP 白名单、RBAC 权限、审计日志，支持私有化部署，满足金融、医疗合规要求。",
    tag: "安全",
    tagColor: "",
  },
];

const models = [
  { name: "GPT-4o", vendor: "OpenAI", tag: "旗舰", color: "from-green-500/20 to-emerald-500/20", tagColor: "tag-green" },
  { name: "Claude 3.5 Sonnet", vendor: "Anthropic", tag: "推荐", color: "from-orange-500/20 to-amber-500/20", tagColor: "tag-amber" },
  { name: "Gemini 1.5 Pro", vendor: "Google", tag: "多模态", color: "from-blue-500/20 to-cyan-500/20", tagColor: "tag-cyan" },
  { name: "Llama 3 70B", vendor: "Meta", tag: "开源", color: "from-indigo-500/20 to-violet-500/20", tagColor: "" },
  { name: "DeepSeek V3", vendor: "DeepSeek", tag: "国产", color: "from-rose-500/20 to-pink-500/20", tagColor: "tag-rose" },
  { name: "Mistral Large", vendor: "Mistral AI", tag: "欧洲", color: "from-purple-500/20 to-fuchsia-500/20", tagColor: "" },
];

const testimonials = [
  {
    quote: "ModelBridge 帮我们在两周内完成了原本需要三个月的大模型接入工作，API 稳定性超出预期。",
    author: "张伟",
    title: "CTO · 某头部电商平台",
    avatar: "张",
  },
  {
    quote: "LLM 参数提取模块让我们的智能客服意图识别准确率从 82% 提升到 96%，直接降低了 30% 的人工干预成本。",
    author: "李敏",
    title: "AI 负责人 · 某金融科技公司",
    avatar: "李",
  },
  {
    quote: "私有化部署方案非常完善，从 Docker Compose 到 Kubernetes 一键部署，安全审计也顺利通过了。",
    author: "王强",
    title: "架构师 · 某三甲医院信息中心",
    avatar: "王",
  },
];

const pricingPreview = [
  {
    name: "免费版",
    price: "¥0",
    period: "/月",
    desc: "个人开发者探索使用",
    highlight: false,
    features: ["100K Tokens/月", "3 个模型接入", "社区支持", "基础监控"],
    cta: "免费开始",
  },
  {
    name: "专业版",
    price: "¥999",
    period: "/月",
    desc: "成长中的团队首选",
    highlight: true,
    features: ["10M Tokens/月", "全部模型接入", "RAG 管线", "优先支持", "高级监控 & 日志"],
    cta: "14 天免费试用",
  },
  {
    name: "企业版",
    price: "定制",
    period: "",
    desc: "大规模生产环境",
    highlight: false,
    features: ["无限 Tokens", "私有化部署", "SLA 99.9%", "专属客户成功", "定制开发支持"],
    cta: "联系销售",
  },
];

// ───────────────────────────── page ──────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-28 md:py-40 text-center">
        <div className="hero-glow" style={{ top: 0, left: "50%", transform: "translate(-50%, -50%)" }} />

        <div className="relative max-w-4xl mx-auto">
          <span className="tag inline-block mb-6">🚀 现已支持 GPT-4o · Claude 3.5 · Gemini 1.5 · Claude Code · Cursor</span>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-white tracking-tight">
            连接每一个大模型
            <br />
            <span className="gradient-text">赋能每一个业务</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ModelBridge 是企业级 AI 中台 SaaS 平台，一套 API 统一接入 50+ 主流大模型，
            提供 RAG 知识管线、LLM 参数提取、Agent 框架与全链路 LLMOps，让 AI 落地更快、更稳、更省。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs" className="btn-primary px-8 py-3.5 rounded-xl font-semibold text-base inline-block">
              免费开始 →
            </Link>
            <Link href="/models" className="btn-outline px-8 py-3.5 rounded-xl font-semibold text-base inline-block">
              查看模型广场
            </Link>
          </div>
        </div>

        {/* Mock API card */}
        <div className="relative max-w-2xl mx-auto mt-20 float-animation">
          <div className="code-block p-6 text-left rounded-2xl shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-slate-500 text-xs font-mono">quick_start.py</span>
            </div>
            <pre className="text-sm font-mono leading-relaxed overflow-x-auto text-left">
{`import modelbridge

# 一行代码切换任意大模型
client = modelbridge.Client(api_key="mb-****")

response = client.chat(
    model="gpt-4o",    # 或 claude-3-5-sonnet / gemini-1.5-pro
    messages=[{"role": "user", "content": "你好！}]
)
print(response.content)`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="stat-number">{s.value}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="tag inline-block mb-4">全栈 AI 能力</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              从 API 到 Agent，一站式 AI 中台
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              无需自行维护多个模型 SDK，ModelBridge 将所有复杂性封装在统一平台之后。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-6 transition-all duration-300 cursor-default">
                <div className="text-4xl mb-4">{f.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white text-lg">{f.title}</h3>
                  <span className={`tag ${f.tagColor}`}>{f.tag}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Models preview ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-indigo-950/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="tag inline-block mb-4">模型广场</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              接入全球顶尖大模型
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              实时同步最新模型版本，自动路由至最优节点，支持流式与批量推理。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {models.map((m) => (
              <div
                key={m.name}
                className={`glass-card rounded-xl p-5 bg-gradient-to-br ${m.color} transition-all duration-300 cursor-default`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{m.name}</h3>
                    <p className="text-slate-400 text-sm">{m.vendor}</p>
                  </div>
                  <span className={`tag ${m.tagColor}`}>{m.tag}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-slate-400 text-xs">在线可用</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/models" className="btn-outline px-6 py-2.5 rounded-lg text-sm font-medium inline-block">
              查看全部 50+ 模型 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Architecture strip ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="tag inline-block mb-4">技术架构</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              生产级架构，开箱即用
            </h2>
          </div>
          <div className="glass-card rounded-2xl p-8 gradient-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "接入层",
                  items: ["REST / gRPC / WebSocket", "Python · Node.js · Java SDK", "Webhook & 流式响应", "API Key 管理"],
                  color: "text-indigo-400",
                },
                {
                  title: "核心平台",
                  items: ["统一模型路由 & 降级", "RAG 知识管线", "参数提取引擎", "Agent 工作流编排"],
                  color: "text-cyan-400",
                },
                {
                  title: "基础设施",
                  items: ["vLLM / Triton 推理集群", "Milvus 向量数据库", "多租户隔离 & KMS", "全链路 Trace & 监控"],
                  color: "text-violet-400",
                },
              ].map((col) => (
                <div key={col.title}>
                  <h3 className={`font-semibold mb-3 ${col.color}`}>{col.title}</h3>
                  <ul className="space-y-2">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-slate-300 text-sm">
                        <span className="text-slate-500">▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing preview ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="tag inline-block mb-4">定价方案</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              按需付费，随业务成长
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              从个人开发者到千亿级企业，ModelBridge 都有匹配的方案。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPreview.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "gradient-border bg-gradient-to-b from-indigo-900/30 to-violet-900/20"
                    : "glass-card"
                }`}
              >
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <span className="tag tag-cyan">最受欢迎</span>
                  </div>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                      <svg className="text-indigo-400 flex-shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`text-center text-sm font-semibold py-2.5 rounded-lg transition-all inline-block ${
                    plan.highlight ? "btn-primary" : "btn-outline"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="tag inline-block mb-4">客户案例</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              已获数千企业信任
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.author} className="glass-card rounded-2xl p-6">
                <div className="flex text-yellow-400 text-sm mb-4">★★★★★</div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{t.author}</div>
                    <div className="text-slate-500 text-xs">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center glass-card rounded-3xl p-12 gradient-border bg-gradient-to-br from-indigo-900/20 to-violet-900/20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            准备好加速 AI 落地了吗？
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            无需信用卡，免费额度即刻可用。5 分钟完成接入，与数千企业一起构建 AI 未来。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs" className="btn-primary px-8 py-3.5 rounded-xl font-semibold text-base inline-block">
              免费开始使用
            </Link>
            <Link href="/pricing" className="btn-outline px-8 py-3.5 rounded-xl font-semibold text-base inline-block">
              查看价格方案
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
