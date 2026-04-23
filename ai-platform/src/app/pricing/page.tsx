import Link from "next/link";

const plans = [
  {
    name: "免费版",
    nameEn: "Free",
    price: "¥0",
    period: "/月",
    desc: "个人开发者与小团队试用",
    highlight: false,
    tag: null,
    features: [
      { text: "100K Tokens/月（赠送）", included: true },
      { text: "3 个模型接入（GPT-4o mini / Claude Haiku / Gemini Flash）", included: true },
      { text: "REST API 访问", included: true },
      { text: "Python SDK", included: true },
      { text: "基础监控仪表盘", included: true },
      { text: "社区论坛支持", included: true },
      { text: "RAG 知识管线", included: false },
      { text: "LLM 参数提取", included: false },
      { text: "Agent 框架", included: false },
      { text: "SLA 保障", included: false },
      { text: "私有化部署", included: false },
    ],
    cta: "免费开始",
    ctaHref: "/docs",
    ctaStyle: "btn-outline",
  },
  {
    name: "专业版",
    nameEn: "Pro",
    price: "¥999",
    period: "/月",
    desc: "成长中的产品与工程团队",
    highlight: true,
    tag: "最受欢迎",
    features: [
      { text: "10M Tokens/月（超出按量计费）", included: true },
      { text: "全部 50+ 模型接入", included: true },
      { text: "REST + gRPC + WebSocket API", included: true },
      { text: "Python / Node.js / Java SDK", included: true },
      { text: "RAG 知识管线（5 个知识库 / 1GB 存储）", included: true },
      { text: "LLM 参数提取（10 个 Schema）", included: true },
      { text: "Agent 框架（单 Agent）", included: true },
      { text: "高级监控：Trace / 日志 / 成本报表", included: true },
      { text: "邮件 + 工单优先支持（24h 响应）", included: true },
      { text: "SLA 99.5%", included: true },
      { text: "私有化部署", included: false },
    ],
    cta: "14 天免费试用",
    ctaHref: "/docs",
    ctaStyle: "btn-primary",
  },
  {
    name: "企业版",
    nameEn: "Enterprise",
    price: "定制",
    period: "",
    desc: "大规模生产与高合规场景",
    highlight: false,
    tag: null,
    features: [
      { text: "无限 Tokens（签约包月/包年）", included: true },
      { text: "全部模型 + 定制模型接入", included: true },
      { text: "全协议 API + 定制集成", included: true },
      { text: "全语言 SDK + CLI + Terraform", included: true },
      { text: "无限 RAG 知识库与存储", included: true },
      { text: "无限参数提取 Schema", included: true },
      { text: "多 Agent 协作工作流", included: true },
      { text: "完整 LLMOps + AB 测试 + 人工评估", included: true },
      { text: "专属客户成功经理（4h 响应）", included: true },
      { text: "SLA 99.9% + 灾备", included: true },
      { text: "Docker / Kubernetes 私有化部署 + 驻场支持", included: true },
    ],
    cta: "联系销售",
    ctaHref: "#",
    ctaStyle: "btn-outline",
  },
];

const addons = [
  { name: "额外 Tokens", price: "按量计费", desc: "¥0.001 起 / 1K tokens，依模型定价" },
  { name: "额外 RAG 存储", price: "¥9 / GB·月", desc: "向量数据库存储按量扩容" },
  { name: "私有 GPU 节点", price: "¥6,000 起 / 月", desc: "独享 A100 / H100 推理节点" },
  { name: "优先支持包", price: "¥1,999 / 月", desc: "1h 响应 SLA + 专属技术顾问" },
  { name: "定制微调服务", price: "询价", desc: "LoRA / PEFT 微调 + 私有模型托管" },
];

const faqs = [
  {
    q: "免费版有什么限制？",
    a: "免费版每月提供 100K Tokens，可接入 3 个轻量模型（GPT-4o mini、Claude Haiku、Gemini Flash），适合个人开发者学习与试验。RAG、参数提取、Agent 等高级功能需升级至专业版。",
  },
  {
    q: "超出 10M Tokens 后如何计费？",
    a: "专业版超出后按实际使用量计费，费率与每个模型的定价一致，在账单中透明显示。可在控制台设置用量告警与消费上限，避免超支。",
  },
  {
    q: "支持私有化部署吗？",
    a: "企业版支持 Docker Compose 与 Kubernetes 两种私有化方式，提供完整 Helm Chart 与部署文档，并可安排工程师驻场支持。私有部署数据完全在客户自己的基础设施内，ModelBridge 不会接触。",
  },
  {
    q: "数据安全如何保障？",
    a: "所有数据传输使用 TLS 1.3 加密，静态数据使用 AES-256 加密，支持客户自带 KMS 密钥。多租户物理隔离，不同租户的数据在存储与推理层均严格隔离。满足等保 2.0 要求。",
  },
  {
    q: "可以免费试用企业版吗？",
    a: "可以。联系销售团队后，我们会为您安排 14 天的企业版 POC 试用，包含技术对接支持。",
  },
  {
    q: "如何申请发票？",
    a: "支持开具增值税普通发票与专用发票。在控制台账单页面填写开票信息并提交申请，3 个工作日内开出。",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="tag inline-block mb-4">透明定价</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            按需付费，随业务成长
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            从个人开发者到千亿级企业，ModelBridge 都有匹配的方案。无需信用卡，免费即刻开始。
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 flex flex-col ${
                plan.highlight
                  ? "gradient-border bg-gradient-to-b from-indigo-900/30 to-violet-900/20"
                  : "glass-card"
              }`}
            >
              {plan.tag && (
                <div className="text-center mb-3">
                  <span className="tag tag-cyan">{plan.tag}</span>
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-white font-bold text-xl mb-1">{plan.name}</h2>
                <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <svg className="text-indigo-400 flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="text-slate-600 flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                    <span className={f.included ? "text-slate-300" : "text-slate-600"}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`text-center text-sm font-semibold py-3 rounded-xl transition-all inline-block ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">功能对比详表</h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-slate-400 font-medium">功能</th>
                  {plans.map((p) => (
                    <th key={p.name} className={`p-4 text-center font-semibold ${p.highlight ? "text-indigo-300" : "text-white"}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["月度 Token 配额", "100K", "10M", "无限"],
                  ["可接入模型数量", "3 个", "50+", "全部 + 定制"],
                  ["并发请求数", "5", "50", "无限"],
                  ["RAG 知识库", "—", "5 个", "无限"],
                  ["RAG 存储容量", "—", "1 GB", "定制"],
                  ["参数提取 Schema", "—", "10 个", "无限"],
                  ["Agent 类型", "—", "单 Agent", "多 Agent 协作"],
                  ["监控保留天数", "3 天", "30 天", "无限"],
                  ["API Key 数量", "2", "20", "无限"],
                  ["团队成员数", "1", "10", "无限"],
                  ["技术支持", "社区", "邮件优先", "专属 CSM"],
                  ["SLA", "—", "99.5%", "99.9%"],
                  ["私有化部署", "—", "—", "✓"],
                ].map(([feature, free, pro, ent]) => (
                  <tr key={feature as string} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4 text-slate-400">{feature}</td>
                    <td className="p-4 text-center text-slate-300">{free}</td>
                    <td className="p-4 text-center text-slate-300 bg-indigo-900/10">{pro}</td>
                    <td className="p-4 text-center text-slate-300">{ent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Add-ons */}
        <section className="mb-20">
          <div className="text-center mb-8">
            <span className="tag inline-block mb-3">按需扩展</span>
            <h2 className="text-2xl font-bold text-white">增值服务与附加包</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addons.map((a) => (
              <div key={a.name} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold">{a.name}</h3>
                  <span className="text-indigo-400 font-bold text-sm">{a.price}</span>
                </div>
                <p className="text-slate-500 text-sm">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <span className="tag inline-block mb-3">常见问题</span>
            <h2 className="text-2xl font-bold text-white">FAQ</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((f) => (
              <div key={f.q} className="glass-card rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2 text-sm">❓ {f.q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise CTA */}
        <div className="text-center glass-card rounded-2xl p-10 gradient-border bg-gradient-to-br from-indigo-900/20 to-violet-900/20">
          <h2 className="text-2xl font-bold text-white mb-3">需要企业级定制方案？</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            联系我们的解决方案团队，获取专属报价与 POC 支持。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-primary px-8 py-3 rounded-xl font-semibold text-sm">联系销售</button>
            <Link href="/docs" className="btn-outline px-8 py-3 rounded-xl font-semibold text-sm inline-block">
              先看文档
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
