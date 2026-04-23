# ai-agent

A collection of AI-assisted engineering projects spanning front-end applications, CLI tooling, and high-performance C++ async primitives.

## Projects

### [ai-timeline](ai-timeline/)

Interactive AI development history timeline — from the Turing Test (1950) through GPT-3, ChatGPT, Claude, Gemini, Sora, DeepSeek R1, and the AI agent era (2025). Features a premium dark glassmorphism UI with 100+ milestones across 10 categories, searchable and filterable by category, impact level, and year range. Built with Next.js 14, React 18, TypeScript, and Tailwind CSS. Data-driven architecture makes it trivial to add new events.

### [seastar-future](seastar-future/)

Standalone, header-only C++17 library that extracts the core **future / promise / .then()** continuation model from the [Seastar](https://seastar.io/) framework. Features industrial-grade optimizations including single-slot continuation (replacing `vector<function>`), move-only semantics, `noncopyable_function` with Small Buffer Optimization, and utility combinators (`do_with`, `repeat`, `parallel_for_each`, `when_all_succeed`). Zero external dependencies — drop the single header into any C++17 project.

- [Architecture docs (Chinese)](seastar-future/docs/)
- [Benchmark guide](seastar-future/docs/05-benchmark-guide.md)
- [Why no queue — design trade-offs](seastar-future/docs/06-why-no-queue.md)

### [applyflow-us](applyflow-us/)

ApplyFlow MVP — turn any job description into a tailored interview plan in minutes. Built with Next.js 14, React 18, TypeScript, and Tailwind CSS. Key features include a job tracker, resume tailoring with keyword gap analysis, AI-generated mock interviews, shareable feedback reports, and a free preview mode requiring no signup.

### [applyflow-cn](applyflow-cn/)

Chinese-localized variant of the ApplyFlow application. Uses the same Next.js App Router and Tailwind CSS stack, providing a simplified HackerRank-like dashboard UI for the Chinese market.

### [hr-dashboard](hr-dashboard/)

A modern, responsive dashboard demo inspired by HackerRank. Showcases dashboard statistics, practice challenge grids, active competitions, skill progress bars, and achievement badges. Built with Next.js 14, TypeScript, and Tailwind CSS.

### [tech-english](tech-english/)

Interactive English training app for programmers. Practice technical vocabulary (algorithms, OS, AI, networking, databases), read real technical passages with comprehension questions, write professional git commit messages, and compose code review comments — all in English. Built with Next.js 15, TypeScript, and Tailwind CSS.

### [ai-platform](ai-platform/)

Complete commercial website for the ModelBridge AI SaaS platform. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS 4. Five pages covering: a full landing page (Hero / stats / feature grid / model preview / architecture / pricing / testimonials / CTA), a Model Gallery (50+ LLMs across flagship, open-source, domestic, and embedding/multimodal categories with pricing and specs), a Tools & Features deep-dive (API gateway, RAG pipeline, LLM parameter extraction, Agent framework, LLMOps monitoring, enterprise security), a Pricing page (Free / Pro ¥999/mo / Enterprise with full comparison table and FAQ), and a Developer Docs page (quick-start, multi-language examples, API reference, SDK downloads, OpenAI migration guide). Dark glassmorphism design with Indigo–Violet–Cyan gradient branding, fully responsive.

### [opencode](opencode/)

Minimal TUI CLI extraction from the OpenCode dev branch. Isolates the CLI entry points (`attach`, `thread`) and their worker/RPC bridge without pulling in the full application. Includes network configuration, RPC client/server via `postMessage`, and command builder utilities.

### [claude-code](claude-code/)

Modern interactive terminal UI application built with React + Ink, inspired by claude-code (Anthropic CLI tool). Includes a full-screen TUI demo (ink-ui) supporting chat interaction, 3D dice animation, rainbow text, countdown timer, calculator, UUID generation, Base64 encode/decode, progress bar, and 12+ slash commands. Also includes a terminal UI library overview (Ink / Blessed / Rich / Textual / Bubble Tea / Ratatui / ncurses).

### [github-crawler](github-crawler/)

GitHub Markdown Crawler — search GitHub repositories with four strategies (by name, stars, language, or topic) and download all Markdown files in one click. Python (FastAPI + httpx) backend with a vanilla HTML/CSS/JS frontend for configuring storage paths and triggering downloads.

### [dev-roadmap](dev-roadmap/)

Precise, comprehensive, and in-depth panoramic guide to developer skill stacks. Covers the core technologies required by four engineering roles — **Front-End, Back-End, Full-Stack, and LLM Application Development** — ranked by importance across a five-tier rating system (⭐⭐⭐⭐⭐ → ⭐). Spans language fundamentals, frameworks, system design, and expert-level depth tracks, with a cross-role skill comparison matrix. Aligned to real-world engineering practice and top-tier tech stacks, with collapsible tiered display for easy exploration.

### [zhang-zai](zhang-zai/)

An elegant dark-themed web app showcasing Zhang Zai's (张载) four timeless Confucian mottos — *为天地立心，为生民立命，为往圣继绝学，为万世开太平* — displayed in large gold serif calligraphy. Each motto anchors one of four thematic chapters that collect and explain philosophical articles. Supports i18n (Chinese / English) with a localStorage-persisted language toggle. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

### [girlfriend-daily-reco](girlfriend-daily-reco/)

Modern recommendation workspace for solving the daily "what to wear" and "what to eat" decision loop. Built with a Python 3.12 + SQLite backend and a polished browser UI, it supports creating, editing, and deleting outfit/meal assets, generating recommendations from weather, mood, occasion, diet, and budget, auto-detecting live weather from geolocation, producing next-day plans, exporting results, sending them by email (backend SMTP or mailto), generating shareable links, downloading high-resolution image cards, and storing recommendation history for later review.

### [tianya-posts](tianya-posts/)

Classic Tianya Forum posts collection (天涯神贴) — curating legendary posts from China's iconic Tianya forum, spanning economic predictions, historical analysis, life reflections, supernatural stories, and more. Features a warm vintage parchment-themed frontend for reading, with an admin backend for managing posts and uploading PDF source materials. Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4 (frontend) and Python FastAPI + SQLite (backend).

### [how-big-is-space](how-big-is-space/)

Interactive 3D scale journey from a single human to the edge of the observable universe across 8 cosmic stops. Features an animated rocket launch, warp-speed transitions with camera fly-in, procedural planet textures, rim-lighting GLSL shaders, and a logarithmic scale bar spanning 27 orders of magnitude. Built with Three.js r158 and vanilla ES modules — no bundler required.

### [universe-sim](universe-sim/)

Production-quality real-time 3D solar system simulator with all 8 planets, scientifically accurate orbital mechanics (Kepler ellipses, axial tilts, relative periods), Saturn/Uranus ring systems, 14,500+ stars with Milky Way density boost, and a full control panel (speed slider 0–100×, planet focus, pause/play). Procedural textures generated via Canvas 2D API — no external image assets. Built with Three.js r158 and vanilla ES modules.

### [dify](dify/)

Dify — 开源 LLM 应用开发平台深度解析。涵盖可视化工作流编排（DAG 拖拽节点）、内置 RAG 管线（文档上传→分块→向量化→混合检索→Rerank）、Agent 能力（ReAct / Function Calling）、100+ 模型供应商统一管理、LLMOps（日志 / 标注 / 评估）、Docker Compose / Kubernetes 私有部署、多租户 RBAC、API 与 SDK 设计，以及与 LangChain、LlamaIndex、Flowise 的横向对比，并给出企业私有化落地要点与和 ModelBridge 的协同架构。

### [langchain](langchain/)

LangChain — 最主流 LLM 应用开发框架深度解析（Python + TypeScript 双栈）。涵盖核心抽象（Runnable / LCEL 管道语法）、RAG 管线（文档加载 → 分块 → 向量化 → 检索 → 生成，含 Multi-Query / RAG Fusion / Parent-Child 等高级策略）、Agent 与工具调用、对话记忆、LangGraph 有状态多 Agent 工作流、LangSmith LLMOps 平台（Trace / Playground / Evaluation）、100+ 模型集成（OpenAI / Claude / Gemini / Ollama）、LangServe 生产部署，以及常见生产陷阱与和 ModelBridge 的协同模式。

### [ai-tools-comparison](ai-tools-comparison/)

AI 工具全景横向对比 —— **Dify / LangChain / LlamaIndex / AutoGen / CrewAI / Flowise / Haystack / ModelBridge** 八款工具的核心维度对比矩阵（功能、易用性、定制度、生产稳定性）、各工具深度介绍与代码示例、场景化选型建议（8 类典型场景）、四种典型架构组合方案、学习成本与上手时间估算、LLM API 与向量库成本分析，以及 2025 年多 Agent / 本地模型 / LLMOps 技术趋势总结。

### [modelbridge](modelbridge/)

ModelBridge — 面向国内/国际企业与开发者的 AI 中台 SaaS 产品方案，提供 **模型管理 + API 服务 + 智能机器人接入 + LLM 参数提取** 能力，支持自托管 / 云端部署、按需微调与多模型推理。本目录是产品的完整设计文档（产品 / 技术 / 运营 / 合规 / 路线图），并附可执行的 MVP 与 30 / 90 / 180 天计划，以及核心 REST API 的 OpenAPI 3.0 草案（`/v1/infer`、`/v1/extract`、模型 / Key / 用量管理接口）。

### [codeflow](codeflow/)

Code architecture visualizer that fetches any GitHub repository, parses its import graph, detects hardcoded secrets, anti-patterns, and circular dependencies, computes an A–F health score, and renders an interactive D3 force-directed graph with blast-radius node sizing. Supports local mode with CMake/Bazel BUILD-file analysis and GTest dependency resolution. Built with Rust (Axum) backend and React 18/TypeScript/Vite/D3 frontend.