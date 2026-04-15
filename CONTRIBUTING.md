# Contributing — Adding a New Sub-Project

This document defines the conventions every sub-project in this repository must follow. Consistency keeps the collection easy to browse, understand, and extend.

---

## 1. Top-Level README Overview

Every sub-project **must** have an entry in the root [`README.md`](README.md) under the `## Projects` section. Follow this template:

```markdown
### [<project-name>](<project-name>/)

One or two sentences in **English** describing what the project does, its key features, and the tech stack. Keep it concise — a reader should know what the project is and why it exists without clicking through.
```

Rules:
- Write in **English** only.
- Mention the primary tech stack (e.g., "Built with Next.js 15, TypeScript, Tailwind CSS").
- Keep the description under ~100 words.
- Add the entry in rough chronological order of creation.

---

## 2. Sub-Project README

Every sub-project **must** contain a `README.md` in its root directory with the following sections (in order):

| Section | Required | Notes |
|---------|----------|-------|
| `# Project Title` with a short tagline | ✅ | Single `h1` with emoji icon recommended |
| Tech stack table or bullet list | ✅ | Framework, language, styling, runtime versions |
| Getting Started | ✅ | `cd <dir>`, `npm install`, `npm run dev` |
| Project Structure | ✅ | ASCII tree showing `src/` layout |
| Key Features or Completed Features | ✅ | Describe what works today |
| License or attribution line | ✅ | Link back to the root collection |

---

## 3. `docs/` Directory

Sub-projects that have non-trivial architecture or require design decisions **should** include a `docs/` directory. Place at minimum:

- `docs/architecture.md` — high-level component/module diagram, data flow, and key design choices.

Additional docs (API shape, benchmark guide, migration notes, etc.) are encouraged for complex projects.

---

## 4. Naming Conventions

### Directory Names (sub-project roots)
- Use **kebab-case**: `ai-timeline`, `dev-english`, `zhang-zai`.
- Keep names short (1–3 words) and descriptive.
- No version suffixes (no `v2`, `new-`, `-final`).

### Source File Names
- **TypeScript / React components**: `PascalCase.tsx` — e.g., `Header.tsx`, `ChapterCard.tsx`.
- **Data modules**: `camelCase.ts` — e.g., `aiHistory.ts`, `chapters.ts`.
- **Type definitions**: `index.ts` inside a `types/` folder or co-located `*.types.ts`.
- **Style files**: `globals.css` inside `src/app/` or `src/styles/`.
- **Config files**: follow framework convention — `next.config.js`, `tailwind.config.ts`, `tsconfig.json`.

### Directory Names Inside `src/`
- `app/` — Next.js App Router pages and layouts.
- `components/` — Reusable React components.
- `data/` — Static typed content (articles, datasets).
- `types/` — TypeScript interface / type definitions.
- `hooks/` — Custom React hooks.
- `i18n/` — Locale files and translation utilities (when the project supports i18n).
- `styles/` — Global stylesheets (if not co-located in `app/`).

### Route Segments (Next.js App Router)
- Use **kebab-case**: `chapter-1/`, `code-review/`, `about/`.

---

## 5. Code Conventions

- **Language**: TypeScript strict mode for all new projects.
- **Framework**: Next.js 14+ (App Router) + React 18+.
- **Styling**: Tailwind CSS utility-first. Avoid writing raw CSS except for global resets or CSS custom properties in `globals.css`.
- **Client components**: Add `'use client'` directive only where interactivity requires it. Prefer server components for static content.
- **Data**: All static content lives in `src/data/*.ts` as typed arrays/objects — never inline in components.
- **No default exports from data files**: export named constants (e.g., `export const CHAPTERS = [...]`).
- **Component props**: always typed with explicit TypeScript interfaces or `type` aliases.

---

## 6. i18n Support

Projects that target both Chinese-speaking and English-speaking audiences **should** implement i18n:

- Store translations in `src/i18n/zh.ts` and `src/i18n/en.ts`.
- Expose a `LanguageContext` provider at the root layout.
- Provide a `useTranslation()` hook that returns the active locale's strings.
- Default locale: `zh` (Chinese). Allow switching to `en` via a UI toggle.
- Persist the user's language preference in `localStorage`.

---

## 7. Quick Checklist

Before opening a PR that adds a new sub-project, confirm all boxes are checked:

- [ ] `README.md` entry added to **root** `README.md`
- [ ] Sub-project `README.md` exists with all required sections
- [ ] `docs/architecture.md` present (or explicitly skipped with justification)
- [ ] Directory name is kebab-case
- [ ] Component files use PascalCase, data/hook files use camelCase
- [ ] TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- [ ] `npm run lint` passes (ESLint `next/core-web-vitals` config)
- [ ] `npm run build` succeeds with no type errors
