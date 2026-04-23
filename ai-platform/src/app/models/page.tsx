import Link from "next/link";

const modelCategories = [
  {
    id: "flagship",
    label: "旗舰推理",
    models: [
      {
        name: "GPT-4o",
        vendor: "OpenAI",
        vendorTag: "tag-green",
        desc: "OpenAI 最新多模态旗舰，支持文本、图像、音频输入，128K 上下文，推理速度业内最快。",
        contextLen: "128K",
        tags: ["多模态", "流式", "Function Calling"],
        latency: "~0.8s",
        priceIn: "¥0.035",
        priceOut: "¥0.105",
        unit: "/1K tokens",
        status: "在线",
        highlight: true,
      },
      {
        name: "GPT-4o mini",
        vendor: "OpenAI",
        vendorTag: "tag-green",
        desc: "GPT-4o 轻量版，成本降低 85%，适合高并发轻量推理场景。",
        contextLen: "128K",
        tags: ["经济型", "流式"],
        latency: "~0.3s",
        priceIn: "¥0.003",
        priceOut: "¥0.012",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "Claude 3.5 Sonnet",
        vendor: "Anthropic",
        vendorTag: "tag-amber",
        desc: "Anthropic 顶级模型，代码能力极强，支持 200K 上下文，安全对齐业内领先。",
        contextLen: "200K",
        tags: ["代码", "长文", "安全"],
        latency: "~1.2s",
        priceIn: "¥0.022",
        priceOut: "¥0.11",
        unit: "/1K tokens",
        status: "在线",
        highlight: true,
      },
      {
        name: "Claude 3 Haiku",
        vendor: "Anthropic",
        vendorTag: "tag-amber",
        desc: "Claude 最快轻量版，适合客服、分类、摘要等高吞吐场景。",
        contextLen: "200K",
        tags: ["极速", "经济型"],
        latency: "~0.2s",
        priceIn: "¥0.0018",
        priceOut: "¥0.009",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "Gemini 1.5 Pro",
        vendor: "Google",
        vendorTag: "tag-cyan",
        desc: "Google 旗舰多模态，支持 100 万 Token 超长上下文，视频/音频/图像/代码全覆盖。",
        contextLen: "1M",
        tags: ["超长上下文", "多模态", "视频"],
        latency: "~1.5s",
        priceIn: "¥0.025",
        priceOut: "¥0.075",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "Gemini 1.5 Flash",
        vendor: "Google",
        vendorTag: "tag-cyan",
        desc: "Gemini 高速版，1M 上下文保留，价格极低，适合批量文档处理。",
        contextLen: "1M",
        tags: ["极速", "超长上下文"],
        latency: "~0.4s",
        priceIn: "¥0.005",
        priceOut: "¥0.015",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
    ],
  },
  {
    id: "opensource",
    label: "开源模型",
    models: [
      {
        name: "Llama 3 70B Instruct",
        vendor: "Meta",
        vendorTag: "",
        desc: "Meta 开源旗舰，70B 参数，中英双语，代码与推理能力接近闭源模型，可本地私有部署。",
        contextLen: "8K",
        tags: ["开源", "私有部署", "中英双语"],
        latency: "~1.8s",
        priceIn: "¥0.005",
        priceOut: "¥0.008",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "Llama 3 8B Instruct",
        vendor: "Meta",
        vendorTag: "",
        desc: "Llama 3 轻量版，8B 参数，适合边缘部署与资源受限环境，推理速度极快。",
        contextLen: "8K",
        tags: ["开源", "边缘推理", "极速"],
        latency: "~0.2s",
        priceIn: "¥0.0005",
        priceOut: "¥0.001",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "Mistral Large",
        vendor: "Mistral AI",
        vendorTag: "",
        desc: "欧洲顶尖开源模型，强调数据合规（GDPR），适合欧洲市场与高合规需求场景。",
        contextLen: "32K",
        tags: ["开源", "GDPR合规", "欧洲"],
        latency: "~1.0s",
        priceIn: "¥0.018",
        priceOut: "¥0.054",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "Mistral 7B",
        vendor: "Mistral AI",
        vendorTag: "",
        desc: "7B 小模型，推理效果优于同量级竞品，支持指令微调，开源可商用。",
        contextLen: "8K",
        tags: ["开源", "轻量", "可微调"],
        latency: "~0.3s",
        priceIn: "¥0.001",
        priceOut: "¥0.002",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
    ],
  },
  {
    id: "domestic",
    label: "国产模型",
    models: [
      {
        name: "DeepSeek V3",
        vendor: "DeepSeek",
        vendorTag: "tag-rose",
        desc: "深度求索最新旗舰，数学/代码/推理综合性能业内顶尖，价格极具竞争力，国内合规部署。",
        contextLen: "64K",
        tags: ["国产", "数学", "代码", "国内合规"],
        latency: "~1.0s",
        priceIn: "¥0.004",
        priceOut: "¥0.016",
        unit: "/1K tokens",
        status: "在线",
        highlight: true,
      },
      {
        name: "DeepSeek R1",
        vendor: "DeepSeek",
        vendorTag: "tag-rose",
        desc: "DeepSeek 推理增强版，链式思维（CoT）显著提升复杂推理与数学解题能力。",
        contextLen: "64K",
        tags: ["推理增强", "数学", "CoT"],
        latency: "~2.5s",
        priceIn: "¥0.008",
        priceOut: "¥0.032",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "Qwen2.5 72B",
        vendor: "阿里云",
        vendorTag: "",
        desc: "通义千问最新版，中文理解与生成业内领先，支持阿里生态深度集成，合规可控。",
        contextLen: "128K",
        tags: ["国产", "中文优化", "阿里生态"],
        latency: "~1.2s",
        priceIn: "¥0.004",
        priceOut: "¥0.012",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "GLM-4",
        vendor: "智谱 AI",
        vendorTag: "",
        desc: "清华智谱旗舰模型，中英双语，支持 Function Calling 与代码执行，国内合规。",
        contextLen: "128K",
        tags: ["国产", "Function Calling", "中英双语"],
        latency: "~1.0s",
        priceIn: "¥0.007",
        priceOut: "¥0.007",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "Kimi (Moonshot)",
        vendor: "月之暗面",
        vendorTag: "",
        desc: "月之暗面 Kimi，主打超长上下文（128K），适合长文档阅读与分析，国内合规部署。",
        contextLen: "128K",
        tags: ["长文档", "国产", "国内合规"],
        latency: "~1.3s",
        priceIn: "¥0.012",
        priceOut: "¥0.012",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "文心一言 4.0",
        vendor: "百度",
        vendorTag: "",
        desc: "百度旗舰大模型，强调中文理解与百度生态深度整合，适合国内 B 端场景。",
        contextLen: "8K",
        tags: ["国产", "百度生态", "中文"],
        latency: "~1.5s",
        priceIn: "¥0.012",
        priceOut: "¥0.012",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
    ],
  },
  {
    id: "embedding",
    label: "嵌入 & 多模态",
    models: [
      {
        name: "text-embedding-3-large",
        vendor: "OpenAI",
        vendorTag: "tag-green",
        desc: "OpenAI 最新嵌入模型，3072 维，检索效果大幅提升，支持维度截断。",
        contextLen: "8K",
        tags: ["Embedding", "RAG", "3072维"],
        latency: "~0.1s",
        priceIn: "¥0.0009",
        priceOut: "-",
        unit: "/1K tokens",
        status: "在线",
        highlight: false,
      },
      {
        name: "DALL·E 3",
        vendor: "OpenAI",
        vendorTag: "tag-green",
        desc: "OpenAI 图像生成旗舰，支持自然语言精准描述生成高质量图像，标准/高质量两档。",
        contextLen: "-",
        tags: ["图像生成", "文生图", "多模态"],
        latency: "~5s",
        priceIn: "¥0.29",
        priceOut: "-",
        unit: "/张",
        status: "在线",
        highlight: false,
      },
      {
        name: "Whisper v3",
        vendor: "OpenAI",
        vendorTag: "tag-green",
        desc: "OpenAI 开源语音识别，支持 99 种语言，适合语音转文字、字幕生成等场景。",
        contextLen: "-",
        tags: ["语音识别", "ASR", "多语言"],
        latency: "实时",
        priceIn: "¥0.043",
        priceOut: "-",
        unit: "/分钟",
        status: "在线",
        highlight: false,
      },
    ],
  },
];

export default function ModelsPage() {
  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="tag inline-block mb-4">50+ 主流模型</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            模型广场
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            一套 API，统一接入全球顶尖大模型。实时同步版本，自动路由降级，弹性按量计费。
          </p>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "在线模型", value: "50+" },
            { label: "模型供应商", value: "12+" },
            { label: "平均 P50 延迟", value: "10ms" },
            { label: "可用性 SLA", value: "99.9%" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Categories */}
        {modelCategories.map((cat) => (
          <section key={cat.id} className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-white">{cat.label}</h2>
              <span className="tag">{cat.models.length} 个模型</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cat.models.map((m) => (
                <div
                  key={m.name}
                  className={`glass-card rounded-xl p-5 transition-all duration-300 cursor-default ${
                    m.highlight ? "gradient-border" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white">{m.name}</h3>
                        {m.highlight && <span className="tag tag-cyan">推荐</span>}
                      </div>
                      <p className="text-slate-500 text-xs mb-1">{m.vendor}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-green-400 text-xs">{m.status}</span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{m.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {m.tags.map((tag) => (
                      <span key={tag} className="tag text-xs">{tag}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center border-t border-white/5 pt-4">
                    <div>
                      <div className="text-white text-sm font-medium">{m.contextLen}</div>
                      <div className="text-slate-500 text-xs mt-0.5">上下文</div>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{m.latency}</div>
                      <div className="text-slate-500 text-xs mt-0.5">首 Token</div>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{m.priceIn}</div>
                      <div className="text-slate-500 text-xs mt-0.5">输入{m.unit}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="text-center glass-card rounded-2xl p-10 mt-8">
          <h2 className="text-2xl font-bold text-white mb-3">找不到你需要的模型？</h2>
          <p className="text-slate-400 mb-6">告诉我们，我们会在 7 个工作日内完成接入评估。</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/docs" className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-block">
              查看 API 文档
            </Link>
            <button className="btn-outline px-6 py-2.5 rounded-lg text-sm font-semibold">
              申请模型接入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
