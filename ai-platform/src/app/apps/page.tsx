import Link from "next/link";

// ───────────────────────────── data ──────────────────────────────

type App = {
  name: string;
  vendor: string;
  vendorTag?: string;
  icon: string;
  desc: string;
  tags: string[];
  pricing: string;
  url: string;
  highlight?: boolean;
};

type Category = {
  id: string;
  label: string;
  desc: string;
  apps: App[];
};

const categories: Category[] = [
  {
    id: "chat",
    label: "智能对话助手",
    desc: "面向通用对话与办公场景的旗舰 AI 助手。",
    apps: [
      {
        name: "Claude",
        vendor: "Anthropic",
        vendorTag: "tag-amber",
        icon: "🪶",
        desc: "Anthropic 出品，长上下文与代码、写作能力业内领先，安全对齐表现优秀，支持 200K 上下文与 Artifacts 制品视图。",
        tags: ["对话", "长上下文", "代码", "Artifacts"],
        pricing: "免费 / Pro $20/月",
        url: "https://claude.ai",
        highlight: true,
      },
      {
        name: "ChatGPT",
        vendor: "OpenAI",
        vendorTag: "tag-green",
        icon: "💬",
        desc: "OpenAI 旗舰对话产品，GPT-4o 多模态、Canvas 协作画布、GPTs 自定义助手与丰富插件生态一应俱全。",
        tags: ["对话", "多模态", "GPTs", "插件"],
        pricing: "免费 / Plus $20/月",
        url: "https://chat.openai.com",
      },
      {
        name: "Gemini",
        vendor: "Google",
        vendorTag: "tag-cyan",
        icon: "✨",
        desc: "Google 全家桶级 AI 助手，深度整合 Gmail / Docs / Drive，支持百万级超长上下文与原生多模态推理。",
        tags: ["对话", "多模态", "1M 上下文", "Workspace"],
        pricing: "免费 / Advanced $20/月",
        url: "https://gemini.google.com",
      },
      {
        name: "DeepSeek",
        vendor: "DeepSeek",
        vendorTag: "tag-cyan",
        icon: "🐋",
        desc: "国产开源大模型代表，推理与代码能力对标第一梯队，提供网页、App 与极具性价比的 API。",
        tags: ["对话", "推理", "开源", "国产"],
        pricing: "免费 / API 按量",
        url: "https://chat.deepseek.com",
      },
      {
        name: "Kimi",
        vendor: "月之暗面",
        vendorTag: "tag-rose",
        icon: "🌙",
        desc: "月之暗面 Kimi 智能助手，以超长上下文与中文文档处理见长，支持文件、网页、播客等多源输入。",
        tags: ["对话", "长文档", "中文", "联网"],
        pricing: "免费",
        url: "https://kimi.moonshot.cn",
      },
      {
        name: "通义千问",
        vendor: "阿里云",
        vendorTag: "tag-amber",
        icon: "🧧",
        desc: "阿里云通义千问助手，覆盖对话、写作、视觉理解、文档总结，企业版可对接钉钉与阿里云生态。",
        tags: ["对话", "中文", "多模态", "企业"],
        pricing: "免费 / 企业版",
        url: "https://tongyi.aliyun.com",
      },
    ],
  },
  {
    id: "coding",
    label: "AI 编程与 IDE",
    desc: "面向开发者的智能编辑器与编码助手，重塑日常开发工作流。",
    apps: [
      {
        name: "Cursor",
        vendor: "Anysphere",
        vendorTag: "tag-cyan",
        icon: "🖱️",
        desc: "围绕 AI 重构的代码编辑器，基于 VS Code 内核，内置 Composer / Agent 模式，支持仓库级理解与多文件改写。",
        tags: ["IDE", "Agent", "多文件", "本地仓库"],
        pricing: "免费 / Pro $20/月",
        url: "https://cursor.com",
        highlight: true,
      },
      {
        name: "GitHub Copilot",
        vendor: "GitHub",
        vendorTag: "tag-green",
        icon: "🤖",
        desc: "全球最普及的 AI 编程助手，深度集成 VS Code / JetBrains / Visual Studio，支持补全、Chat 与 Workspace。",
        tags: ["补全", "Chat", "PR Review", "企业"],
        pricing: "$10/月起",
        url: "https://github.com/features/copilot",
      },
      {
        name: "Windsurf",
        vendor: "Codeium",
        vendorTag: "tag-cyan",
        icon: "🏄",
        desc: "Codeium 推出的 Agentic IDE，Cascade 模式可在本地仓库自主执行多步任务，主打“一起写代码”的人机协同。",
        tags: ["IDE", "Cascade", "Agent"],
        pricing: "免费 / Pro $15/月",
        url: "https://windsurf.com",
      },
      {
        name: "Trae",
        vendor: "字节跳动",
        vendorTag: "tag-rose",
        icon: "⚡",
        desc: "字节出品的 AI 原生 IDE，免费提供 Claude / GPT 等顶级模型，支持中英文界面与 Builder 智能体模式。",
        tags: ["IDE", "免费", "Builder", "国产"],
        pricing: "免费",
        url: "https://trae.ai",
      },
      {
        name: "Claude Code",
        vendor: "Anthropic",
        vendorTag: "tag-amber",
        icon: "⌨️",
        desc: "Anthropic 官方的命令行编码代理，跑在终端中即可完成阅读、修改、提交代码与运行测试等仓库级任务。",
        tags: ["CLI", "Agent", "终端"],
        pricing: "随 Claude 订阅",
        url: "https://claude.com/product/claude-code",
      },
      {
        name: "v0",
        vendor: "Vercel",
        vendorTag: "tag-green",
        icon: "🧩",
        desc: "Vercel 出品的 AI 前端生成器，对话生成 React / Tailwind 组件与完整页面，可一键部署到 Vercel。",
        tags: ["前端", "React", "Tailwind", "原型"],
        pricing: "免费 / 付费档",
        url: "https://v0.app",
      },
    ],
  },
  {
    id: "platform",
    label: "Agent / 应用搭建平台",
    desc: "低代码 / 无代码搭建 LLM 应用、知识库与智能体的一站式平台。",
    apps: [
      {
        name: "Dify",
        vendor: "Dify",
        vendorTag: "tag-cyan",
        icon: "🎨",
        desc: "开源 LLM 应用开发平台，可视化工作流编排、内置 RAG 知识库与 LLMOps 监控，支持私有化部署。",
        tags: ["低代码", "RAG", "Workflow", "开源"],
        pricing: "开源 / SaaS 免费起",
        url: "https://dify.ai",
        highlight: true,
      },
      {
        name: "Coze 扣子",
        vendor: "字节跳动",
        vendorTag: "tag-rose",
        icon: "🪄",
        desc: "字节出品的零代码 Bot 开发平台，可视化编排插件、知识库与工作流，一键发布到飞书、微信、Discord 等渠道。",
        tags: ["零代码", "Bot", "多端发布", "国产"],
        pricing: "免费 / 企业版",
        url: "https://www.coze.cn",
      },
      {
        name: "FastGPT",
        vendor: "FastGPT",
        vendorTag: "tag-green",
        icon: "⚡",
        desc: "国产开源知识库问答系统，可视化 Flow 编排、企业级权限与多模型接入，私有化部署友好。",
        tags: ["RAG", "知识库", "Flow", "开源"],
        pricing: "开源 / SaaS 按量",
        url: "https://fastgpt.in",
      },
      {
        name: "n8n",
        vendor: "n8n",
        vendorTag: "tag-amber",
        icon: "🔗",
        desc: "开源工作流自动化平台，500+ 集成节点 + AI 节点，可把 LLM 嵌入到任意业务流程中。",
        tags: ["自动化", "工作流", "AI 节点", "开源"],
        pricing: "开源 / Cloud €20/月起",
        url: "https://n8n.io",
      },
      {
        name: "Zapier AI",
        vendor: "Zapier",
        vendorTag: "tag-cyan",
        icon: "🪢",
        desc: "全球最大的 SaaS 自动化平台，AI Actions 让你用自然语言把 7000+ 应用串联成智能工作流。",
        tags: ["自动化", "SaaS 集成", "AI Actions"],
        pricing: "免费 / 付费档",
        url: "https://zapier.com/ai",
      },
      {
        name: "Bolt.new",
        vendor: "StackBlitz",
        vendorTag: "tag-green",
        icon: "⚡",
        desc: "对话式全栈应用生成器，浏览器内即可生成、运行并部署完整的 Node / Next.js / Astro 项目。",
        tags: ["全栈", "WebContainer", "原型"],
        pricing: "免费 / Pro $20/月",
        url: "https://bolt.new",
      },
    ],
  },
  {
    id: "search",
    label: "AI 搜索与知识",
    desc: "用对话替代搜索框，直接获得带引用的高质量答案。",
    apps: [
      {
        name: "Perplexity",
        vendor: "Perplexity",
        vendorTag: "tag-cyan",
        icon: "🔎",
        desc: "AI 搜索引擎代表，所有回答都附带可点击引用，Pro 模式可调用 GPT-4o / Claude 进行深度研究。",
        tags: ["搜索", "引用", "Pro Search", "Spaces"],
        pricing: "免费 / Pro $20/月",
        url: "https://www.perplexity.ai",
        highlight: true,
      },
      {
        name: "秘塔 AI 搜索",
        vendor: "秘塔",
        vendorTag: "tag-rose",
        icon: "🪨",
        desc: "国产 AI 搜索引擎，主打“没有广告、直达结果”，支持学术、播客、全网与脑图聚合视图。",
        tags: ["搜索", "中文", "学术", "无广告"],
        pricing: "免费",
        url: "https://metaso.cn",
      },
      {
        name: "NotebookLM",
        vendor: "Google",
        vendorTag: "tag-cyan",
        icon: "📓",
        desc: "Google 出品的 AI 笔记本，可上传 PDF / 网页 / 视频作为来源，自动生成摘要、问答与播客式音频概览。",
        tags: ["知识库", "笔记", "音频概览", "免费"],
        pricing: "免费",
        url: "https://notebooklm.google.com",
      },
    ],
  },
  {
    id: "creative",
    label: "创意与多模态",
    desc: "图像、视频、音乐与设计的生成式创作工具。",
    apps: [
      {
        name: "Midjourney",
        vendor: "Midjourney",
        vendorTag: "tag-rose",
        icon: "🎨",
        desc: "高质量 AI 绘画的代名词，V6 模型在艺术性与照片真实感上保持顶级水准，支持网页与 Discord 双端。",
        tags: ["图像", "艺术", "V6"],
        pricing: "$10/月起",
        url: "https://www.midjourney.com",
      },
      {
        name: "Runway",
        vendor: "Runway",
        vendorTag: "tag-amber",
        icon: "🎬",
        desc: "AI 视频生成与编辑平台，Gen-3 模型支持文本 / 图像 / 视频转视频，集成抠像、补帧等专业工具。",
        tags: ["视频", "Gen-3", "编辑"],
        pricing: "免费 / 付费档",
        url: "https://runwayml.com",
      },
      {
        name: "Suno",
        vendor: "Suno",
        vendorTag: "tag-green",
        icon: "🎵",
        desc: "AI 音乐生成代表，输入歌词与风格描述即可生成带人声的完整歌曲，支持 1–4 分钟高保真输出。",
        tags: ["音乐", "歌曲", "人声"],
        pricing: "免费 / Pro $10/月",
        url: "https://suno.com",
      },
      {
        name: "ElevenLabs",
        vendor: "ElevenLabs",
        vendorTag: "tag-cyan",
        icon: "🎙️",
        desc: "顶级 AI 语音合成与克隆平台，支持 30+ 语言、情感化朗读、Voice Design 与配音工作流。",
        tags: ["TTS", "克隆", "多语言"],
        pricing: "免费 / 付费档",
        url: "https://elevenlabs.io",
      },
      {
        name: "Notion AI",
        vendor: "Notion",
        vendorTag: "tag-amber",
        icon: "📝",
        desc: "嵌入 Notion 文档与数据库的 AI 写作 / 总结 / 翻译助手，支持 Q&A 跨页搜索与会议纪要自动生成。",
        tags: ["文档", "写作", "Q&A", "团队"],
        pricing: "$10/月起",
        url: "https://www.notion.so/product/ai",
      },
      {
        name: "即梦 AI",
        vendor: "字节跳动",
        vendorTag: "tag-rose",
        icon: "🌈",
        desc: "字节即梦 AI（Dreamina），中文友好的图像、视频、特效生成平台，支持图生视频与一键运镜。",
        tags: ["图像", "视频", "中文", "国产"],
        pricing: "免费 / 付费档",
        url: "https://jimeng.jianying.com",
      },
    ],
  },
];

// ─────────────────────────── component ───────────────────────────

export default function AppsPage() {
  const totalApps = categories.reduce((n, c) => n + c.apps.length, 0);

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="tag inline-block mb-4">{totalApps}+ 主流 AI 应用</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            应用<span className="gradient-text">广场</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            一站收录 Claude、ChatGPT、Cursor、Dify、Perplexity 等主流 AI 应用，按场景分类，快速找到适合你的工具。
          </p>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "收录应用", value: `${totalApps}+` },
            { label: "应用分类", value: `${categories.length}` },
            { label: "覆盖厂商", value: "20+" },
            { label: "更新频率", value: "周更" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick category nav */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-16">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="btn-outline text-xs font-semibold px-4 py-2 rounded-full"
            >
              {c.label}
            </a>
          ))}
        </div>

        {/* Categories */}
        {categories.map((cat) => (
          <section key={cat.id} id={cat.id} className="mb-16 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">{cat.label}</h2>
                  <span className="tag">{cat.apps.length} 个应用</span>
                </div>
                <p className="text-slate-500 text-sm">{cat.desc}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.apps.map((app) => (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`glass-card rounded-xl p-5 transition-all duration-300 block group ${
                    app.highlight ? "gradient-border" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500/15 to-sky-400/15 border border-blue-300/30 flex items-center justify-center text-2xl flex-shrink-0">
                      {app.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-white group-hover:text-blue-700 transition-colors">
                          {app.name}
                        </h3>
                        {app.highlight && <span className="tag tag-cyan">推荐</span>}
                      </div>
                      <p className="text-slate-500 text-xs">{app.vendor}</p>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                    {app.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {app.tags.map((tag) => (
                      <span key={tag} className="tag text-xs normal-case tracking-normal">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                    <span className="text-slate-500">{app.pricing}</span>
                    <span className="text-blue-700 font-medium group-hover:translate-x-0.5 transition-transform">
                      访问 →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="text-center glass-card rounded-2xl p-10 mt-8">
          <h2 className="text-2xl font-bold text-white mb-3">想把这些应用接入你自己的产品？</h2>
          <p className="text-slate-400 mb-6">
            ModelBridge 提供统一 API，帮你一次接入 Claude、GPT、Gemini、DeepSeek 等全部底层模型。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/models"
              className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold inline-block"
            >
              查看模型广场
            </Link>
            <Link
              href="/docs"
              className="btn-outline px-6 py-2.5 rounded-lg text-sm font-semibold inline-block"
            >
              查看 API 文档
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
