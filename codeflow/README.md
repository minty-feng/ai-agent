# ⚡ CodeFlow

A code architecture visualizer that takes a GitHub repository, fetches its file tree and contents via the GitHub API, and renders an interactive dependency graph with security scanning, pattern detection, and a health score.

Inspired by [braedonsaunders/codeflow](https://github.com/braedonsaunders/codeflow).

## Architecture

```
codeflow/
├── README.md
├── frontend/      # React 18 + TypeScript + Vite + Tailwind CSS + D3
└── backend/       # Rust + Axum
```

```
Browser ──POST /api/analyze──► Rust/Axum backend
                                  │
                         GitHub REST API
                                  │
                        ┌─────────▼──────────┐
                        │  File Tree Fetch    │
                        │  Content Decode     │
                        └─────────┬──────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  Dependency extractor│
                        │  Security scanner   │
                        │  Pattern detector   │
                        │  Health calculator  │
                        │  Blast radius BFS   │
                        └─────────┬──────────┘
                                  │
                          JSON AnalysisResult
                                  │
                        ┌─────────▼──────────┐
                        │  D3 Force Graph     │
                        │  Sidebar / Stats    │
                        │  Right Panel Tabs   │
                        └────────────────────┘
```

## Features

| Feature | Description |
|---------|-------------|
| 🕸️ **Dependency Graph** | D3 force-directed graph — nodes are files, edges are imports |
| 💥 **Blast Radius** | Node size reflects how many files transitively depend on it |
| 🔒 **Security Scanner** | Detects hardcoded secrets, eval(), SQL injection, XSS sinks, debug statements |
| 🏭 **Pattern Detection** | Singleton, Factory, Observer, React custom hooks, God Object, High Coupling |
| 🏥 **Health Score** | A–F grade based on circular deps, security issues, coupling, anti-patterns |
| 📂 **File Tree** | Collapsible sidebar tree with language icons |
| 📋 **File Details** | Click any node to inspect its deps, functions, security issues |

## Tech Stack

**Backend**
- [Rust](https://www.rust-lang.org/) + [Axum 0.7](https://github.com/tokio-rs/axum)
- `reqwest` for GitHub API calls
- `regex` for dependency/security/pattern analysis
- `base64` for decoding GitHub file content
- `tower-http` CORS middleware

**Frontend**
- [React 18](https://react.dev/) + TypeScript
- [Vite 6](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- [D3.js v7](https://d3js.org/) — force simulation, zoom/pan
- JetBrains Mono (Google Fonts)

## Setup

### Prerequisites

- Rust 1.75+ (`rustup`)
- Node.js 18+ and npm

### 1. Start the Backend

```bash
cd codeflow/backend
cargo run
# Backend running on http://localhost:3001
```

### 2. Start the Frontend

```bash
cd codeflow/frontend
npm install
npm run dev
# Frontend on http://localhost:5173
```

Open http://localhost:5173 and enter any public GitHub repository (e.g. `facebook/react`).

### Optional: GitHub Token

For private repos or to avoid rate-limiting, enter a [GitHub personal access token](https://github.com/settings/tokens) in the token field. The token is sent only to your local backend — never stored.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend URL override for the frontend |

## Supported Languages

`.js` `.jsx` `.ts` `.tsx` `.py` `.go` `.rs` `.java` `.rb` `.php` `.vue` `.svelte` `.cs` `.cpp` `.c` `.h`

## Screenshot

![CodeFlow Screenshot](screenshot.png)

> _Run the app and take a screenshot to add here._

## Limits

- Maximum 150 files per repo are fetched (to respect GitHub API rate limits)
- Files larger than 200 KB are skipped
- Unauthenticated GitHub API allows ~60 requests/hour; use a token for larger repos
