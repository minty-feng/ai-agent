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

### [dev-english](dev-english/)

Interactive English training app for programmers. Practice technical vocabulary (algorithms, OS, AI, networking, databases), read real technical passages with comprehension questions, write professional git commit messages, and compose code review comments — all in English. Built with Next.js 15, TypeScript, and Tailwind CSS.

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