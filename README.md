# ai-agent

A collection of AI-assisted engineering projects spanning front-end applications, CLI tooling, and high-performance C++ async primitives.

## Projects

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

### [github-crawler](github-crawler/)

GitHub Markdown Crawler — search GitHub repositories with four strategies (by name, stars, language, or topic) and download all Markdown files in one click. Python (FastAPI + httpx) backend with a vanilla HTML/CSS/JS frontend for configuring storage paths and triggering downloads.