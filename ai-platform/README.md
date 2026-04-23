# ai-platform — ModelBridge 商业官网

企业级 AI 中台 SaaS 平台的完整商业官网，展示 ModelBridge 的模型广场、功能特性、定价方案与开发者文档。

## 技术栈

- **Next.js 15** (App Router) + **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**（通过 `@tailwindcss/postcss`）

## 页面结构

| 路由 | 说明 |
|------|------|
| `/` | 首页：Hero、数据指标、功能卡、模型预览、架构图、定价预览、客户案例、CTA |
| `/models` | 模型广场：50+ 大模型分类展示（旗舰推理、开源、国产、嵌入/多模态） |
| `/tools` | 功能特性：API 网关、RAG 管线、参数提取、Agent、LLMOps、安全合规 |
| `/pricing` | 定价方案：免费 / 专业版（¥999/月）/ 企业版，功能对比表，FAQ |
| `/docs` | 开发文档：快速开始、多语言示例、API 参考、SDK、OpenAI 迁移指南 |

## 运行

```bash
cd ai-platform
npm install
npm run dev      # 开发服务器 → http://localhost:3000
npm run build    # 生产构建
npm run start    # 生产启动
```

## 设计特点

- 深色玻璃态 UI（Dark Glassmorphism），品牌色 Indigo → Violet → Cyan
- 响应式设计，移动端完整适配，Hamburger 导航
- 所有功能模块均附真实代码示例（Python / Node.js / cURL / Go / Java）
- 完整商业化内容：定价对比 / 功能说明 / 客户案例 / FAQ / OpenAI 迁移指南
- 纯静态生成（SSG），可直接部署到 Vercel / CDN
