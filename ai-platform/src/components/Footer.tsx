import Link from "next/link";

const footerLinks = {
  产品: [
    { label: "模型广场", href: "/models" },
    { label: "功能特性", href: "/tools" },
    { label: "定价方案", href: "/pricing" },
    { label: "更新日志", href: "#" },
  ],
  开发者: [
    { label: "开发文档", href: "/docs" },
    { label: "API 参考", href: "/docs#api" },
    { label: "SDK 下载", href: "/docs#sdk" },
    { label: "示例项目", href: "/docs#examples" },
  ],
  公司: [
    { label: "关于我们", href: "#" },
    { label: "博客", href: "#" },
    { label: "联系销售", href: "#" },
    { label: "招聘", href: "#" },
  ],
  法律: [
    { label: "服务条款", href: "#" },
    { label: "隐私政策", href: "#" },
    { label: "数据合规", href: "#" },
    { label: "安全", href: "#" },
  ],
};

const socials = [
  {
    label: "GitHub",
    href: "#",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
  },
  {
    label: "Twitter",
    href: "#",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "微信",
    href: "#",
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.5 13.5a1 1 0 100-2 1 1 0 000 2zm5-6a1 1 0 100-2 1 1 0 000 2zm-9.5 6a1 1 0 100-2 1 1 0 000 2zM12 2C6.477 2 2 6.134 2 11.25c0 2.819 1.348 5.326 3.462 7.012L4.5 22l4.19-2.094A10.56 10.56 0 0012 20.5c5.523 0 10-4.134 10-9.25S17.523 2 12 2z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/30 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 7V11M7 9H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-bold text-lg text-white">
                Model<span className="gradient-text">Bridge</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              企业级 AI 中台 SaaS，连接每一个大模型，赋能每一个业务场景。
            </p>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-white font-semibold text-sm mb-4">{group}</h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="section-divider mb-8" />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600 text-sm">
          <p>© 2025 ModelBridge Inc. 保留所有权利。</p>
          <p className="flex items-center gap-1">
            <span>🇨🇳 中文</span>
            <span className="mx-2 text-slate-700">|</span>
            <span>EN</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
