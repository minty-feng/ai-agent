import Link from "next/link";

const quickStartSteps = [
  {
    step: "01",
    title: "获取 API Key",
    desc: "注册账号后在控制台创建 API Key，免费额度立即可用。",
    code: `# 控制台地址
https://console.modelbridge.ai

# 创建后复制 API Key（格式：mb-xxxx）`,
  },
  {
    step: "02",
    title: "安装 SDK",
    desc: "选择你熟悉的语言安装官方 SDK。",
    code: `# Python
pip install modelbridge

# Node.js
npm install @modelbridge/sdk

# 或直接使用 curl（无需安装）`,
  },
  {
    step: "03",
    title: "发送第一个请求",
    desc: "5 行代码完成接入，OpenAI 兼容格式。",
    code: `import modelbridge

client = modelbridge.Client(api_key="mb-****")

response = client.chat(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好，ModelBridge！"}],
)
print(response.content)
# 你好！我是 ModelBridge 助手，有什么可以帮你的吗？`,
  },
  {
    step: "04",
    title: "切换模型",
    desc: "改一个参数，零成本切换任意模型。",
    code: `# 切换到 Claude
response = client.chat(model="claude-3-5-sonnet", ...)

# 切换到国产 DeepSeek
response = client.chat(model="deepseek-v3", ...)

# 切换到 Gemini
response = client.chat(model="gemini-1.5-pro", ...)`,
  },
];

const apiEndpoints = [
  {
    method: "POST",
    path: "/v1/chat/completions",
    desc: "聊天对话（OpenAI 兼容格式）",
    tag: "核心",
    tagColor: "tag-cyan",
  },
  {
    method: "POST",
    path: "/v1/chat/stream",
    desc: "流式聊天（SSE）",
    tag: "流式",
    tagColor: "tag-green",
  },
  {
    method: "POST",
    path: "/v1/embeddings",
    desc: "文本向量化",
    tag: "嵌入",
    tagColor: "",
  },
  {
    method: "POST",
    path: "/v1/rag/ingest",
    desc: "上传文档到 RAG 知识库",
    tag: "RAG",
    tagColor: "tag-amber",
  },
  {
    method: "POST",
    path: "/v1/rag/query",
    desc: "RAG 检索增强问答",
    tag: "RAG",
    tagColor: "tag-amber",
  },
  {
    method: "POST",
    path: "/v1/extract",
    desc: "LLM 参数提取（结构化输出）",
    tag: "提取",
    tagColor: "tag-rose",
  },
  {
    method: "POST",
    path: "/v1/agent/run",
    desc: "运行 Agent 工作流",
    tag: "Agent",
    tagColor: "",
  },
  {
    method: "GET",
    path: "/v1/models",
    desc: "获取可用模型列表",
    tag: "元数据",
    tagColor: "",
  },
  {
    method: "GET",
    path: "/v1/usage",
    desc: "查询 Token 用量与账单",
    tag: "运营",
    tagColor: "",
  },
];

const guides = [
  {
    icon: "🚀",
    title: "快速开始",
    desc: "5 分钟完成首次 API 调用，从注册到第一个响应的完整流程。",
    tag: "新手必读",
    tagColor: "tag-green",
    href: "#quickstart",
  },
  {
    icon: "📚",
    title: "构建 RAG 知识库",
    desc: "上传企业文档，构建私有知识库，让大模型基于你的数据回答问题。",
    tag: "热门",
    tagColor: "tag-cyan",
    href: "#rag",
  },
  {
    icon: "🔍",
    title: "LLM 参数提取",
    desc: "定义 Schema，从用户对话中精准抽取结构化数据，适用于客服、表单等场景。",
    tag: "专项",
    tagColor: "tag-amber",
    href: "#extraction",
  },
  {
    icon: "🤖",
    title: "构建 Agent",
    desc: "使用工具调用和 ReAct 推理构建能自主完成任务的 AI Agent。",
    tag: "进阶",
    tagColor: "",
    href: "#agent",
  },
  {
    icon: "📊",
    title: "配置 LLMOps 监控",
    desc: "接入全链路 Trace，实时监控模型质量、延迟与成本。",
    tag: "运维",
    tagColor: "tag-rose",
    href: "#ops",
  },
  {
    icon: "🏢",
    title: "私有化部署",
    desc: "使用 Docker Compose 或 Kubernetes 在自有基础设施上部署 ModelBridge。",
    tag: "企业",
    tagColor: "",
    href: "#deploy",
  },
  {
    icon: "🔒",
    title: "安全与权限",
    desc: "配置 RBAC 权限、API Key 策略、IP 白名单与审计日志。",
    tag: "安全",
    tagColor: "",
    href: "#security",
  },
  {
    icon: "🔄",
    title: "从 OpenAI 迁移",
    desc: "已有 OpenAI 代码，只需修改 base_url 即可零成本迁移到 ModelBridge。",
    tag: "迁移",
    tagColor: "tag-green",
    href: "#migration",
  },
];

const codeExamples = {
  python: `import modelbridge

client = modelbridge.Client(api_key="mb-****")

# 流式对话
for chunk in client.chat(
    model="gpt-4o",
    messages=[{"role": "user", "content": "写一首关于AI的诗"}],
    stream=True,
):
    print(chunk.delta, end="", flush=True)`,

  node: `import ModelBridge from "@modelbridge/sdk";

const client = new ModelBridge({ apiKey: "mb-****" });

const response = await client.chat({
  model: "claude-3-5-sonnet",
  messages: [{ role: "user", content: "你好！" }],
});

console.log(response.content);`,

  curl: `curl https://api.modelbridge.ai/v1/chat/completions \\
  -H "Authorization: Bearer mb-****" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "你好！"}
    ]
  }'`,
};

export default function DocsPage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="tag inline-block mb-4">开发文档</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            5 分钟上手 ModelBridge
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            从快速开始到生产级部署，完整覆盖你在每个阶段需要的文档。
          </p>
        </div>

        {/* Search bar (decorative) */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
            <svg className="text-slate-500 flex-shrink-0" width="18" height="18" fill="none" viewBox="0 0 18 18">
              <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-slate-500 text-sm">搜索文档…（如：RAG 知识库、参数提取、私有部署）</span>
            <span className="ml-auto text-slate-600 text-xs border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
          </div>
        </div>

        {/* Guides grid */}
        <section className="mb-20">
          <h2 className="text-xl font-bold text-white mb-6">📖 使用指南</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {guides.map((g) => (
              <a
                key={g.title}
                href={g.href}
                className="glass-card rounded-xl p-5 block hover:border-indigo-500/40 transition-all group cursor-pointer"
              >
                <div className="text-2xl mb-3">{g.icon}</div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors">{g.title}</h3>
                  <span className={`tag ${g.tagColor}`}>{g.tag}</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{g.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Quick start */}
        <section id="quickstart" className="mb-20">
          <h2 className="text-xl font-bold text-white mb-8">🚀 快速开始</h2>
          <div className="space-y-6">
            {quickStartSteps.map((s) => (
              <div key={s.step} className="grid grid-cols-1 lg:grid-cols-2 gap-6 glass-card rounded-2xl p-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                <div className="code-block p-4 rounded-xl">
                  <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {s.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Code examples with tabs */}
        <section className="mb-20">
          <h2 className="text-xl font-bold text-white mb-6">💻 多语言示例</h2>
          <div className="glass-card rounded-2xl p-6">
            <div className="space-y-6">
              {[
                { lang: "Python", code: codeExamples.python },
                { lang: "Node.js / TypeScript", code: codeExamples.node },
                { lang: "cURL", code: codeExamples.curl },
              ].map((ex) => (
                <div key={ex.lang}>
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{ex.lang}</div>
                  <div className="code-block p-4 rounded-xl">
                    <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
                      {ex.code}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section id="api" className="mb-20">
          <h2 className="text-xl font-bold text-white mb-6">📡 API 参考</h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <p className="text-slate-400 text-sm">
                Base URL：<code className="text-indigo-300 font-mono bg-indigo-900/30 px-2 py-0.5 rounded">https://api.modelbridge.ai</code>
                &nbsp;&nbsp;认证：<code className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">Authorization: Bearer mb-****</code>
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {apiEndpoints.map((ep) => (
                <div key={ep.path} className="p-4 flex items-center gap-4 hover:bg-white/2 transition-colors">
                  <span
                    className={`text-xs font-bold font-mono px-2.5 py-1 rounded w-14 text-center flex-shrink-0 ${
                      ep.method === "POST"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-slate-200 font-mono text-sm flex-1">{ep.path}</code>
                  <span className="text-slate-500 text-sm hidden md:block">{ep.desc}</span>
                  <span className={`tag ${ep.tagColor} flex-shrink-0`}>{ep.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SDK section */}
        <section id="sdk" className="mb-20">
          <h2 className="text-xl font-bold text-white mb-6">📦 SDK 下载</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { lang: "Python", cmd: "pip install modelbridge", doc: "支持 Python 3.8+，类型注解完整", icon: "🐍" },
              { lang: "Node.js", cmd: "npm i @modelbridge/sdk", doc: "支持 ESM / CJS，TypeScript 原生", icon: "🟩" },
              { lang: "Java", cmd: "implementation 'ai.modelbridge:sdk'", doc: "支持 Java 11+，Spring Boot 集成示例", icon: "☕" },
              { lang: "Go", cmd: "go get github.com/modelbridge/go-sdk", doc: "Go 1.20+，context 支持，泛型友好", icon: "🔵" },
            ].map((s) => (
              <div key={s.lang} className="glass-card rounded-xl p-5">
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="text-white font-semibold mb-1 text-sm">{s.lang}</h3>
                <code className="text-indigo-300 text-xs block mb-2 font-mono">{s.cmd}</code>
                <p className="text-slate-500 text-xs">{s.doc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* From OpenAI migration */}
        <section id="migration" className="mb-16">
          <div className="glass-card rounded-2xl p-8 gradient-border">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔄</span>
              <h2 className="text-xl font-bold text-white">从 OpenAI SDK 迁移（2 步完成）</h2>
              <span className="tag tag-green">零改动</span>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              ModelBridge 完全兼容 OpenAI API 格式，只需修改 <code className="text-indigo-300">base_url</code> 和 API Key，其他代码无需更改。
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="text-red-400 text-xs font-semibold mb-2 uppercase">迁移前（OpenAI）</div>
                <div className="code-block p-4 rounded-xl">
                  <pre className="text-xs font-mono text-slate-400 leading-relaxed">{`from openai import OpenAI

client = OpenAI(
    api_key="sk-****",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
)
print(response.choices[0].message.content)`}</pre>
                </div>
              </div>
              <div>
                <div className="text-green-400 text-xs font-semibold mb-2 uppercase">迁移后（ModelBridge）</div>
                <div className="code-block p-4 rounded-xl">
                  <pre className="text-xs font-mono text-slate-300 leading-relaxed">{`from openai import OpenAI

client = OpenAI(
    api_key="mb-****",          # ← 换 Key
    base_url="https://api.modelbridge.ai/v1",  # ← 加这行
)

response = client.chat.completions.create(
    model="deepseek-v3",        # ← 可切换任意模型
    messages=[...],
)
print(response.choices[0].message.content)`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support CTA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "💬",
              title: "社区论坛",
              desc: "加入开发者社区，与数千工程师一起交流 LLM 落地经验。",
              cta: "进入社区",
              href: "#",
            },
            {
              icon: "🎫",
              title: "提交工单",
              desc: "专业版及以上用户，工单 24 小时内响应，企业版 4 小时。",
              cta: "提交工单",
              href: "#",
            },
            {
              icon: "📞",
              title: "联系销售",
              desc: "如需私有化部署或定制方案，直接联系我们的解决方案团队。",
              cta: "预约演示",
              href: "#",
            },
          ].map((card) => (
            <div key={card.title} className="glass-card rounded-xl p-6">
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="text-white font-semibold mb-1">{card.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{card.desc}</p>
              <Link href={card.href} className="btn-outline text-sm px-4 py-2 rounded-lg inline-block font-medium">
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
