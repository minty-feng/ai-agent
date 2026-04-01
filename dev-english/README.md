# DevEnglish — English for Programmers

Interactive English training app for programmers. Practice technical vocabulary, read real technical passages with comprehension questions, write professional git commit messages, and compose code review comments — all in English.

## Tech Stack

- **Framework**: Next.js 15.3.9 (App Router)
- **Language**: TypeScript 5.5.3
- **Styling**: Tailwind CSS 3.4.7
- **UI Library**: React 19.1.0
- **Node.js**: 22+

## Getting Started

### Prerequisites

- Node.js 22+ installed (see `.node-version`)
- npm package manager

### Installation

1. Navigate to the project directory:
```bash
cd dev-english
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3003](http://localhost:3003) in your browser

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server on port 3003 |
| `npm run build` | Build the production application |
| `npm start` | Start the production server on port 3003 |
| `npm run lint` | Run ESLint to check code quality |

### Production Build

```bash
npm run build   # generates .next/ output
npm start       # serves production build on port 3003
```

## Project Structure

```
dev-english/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout — metadata, Header, global styles
│   │   ├── page.tsx              # Home / Dashboard — module cards & overview
│   │   ├── vocabulary/page.tsx   # Technical Vocabulary module
│   │   ├── reading/page.tsx      # Reading Comprehension module
│   │   ├── commit/page.tsx       # Commit Message Practice module
│   │   └── review/page.tsx       # Code Review in English module
│   ├── components/
│   │   └── Header.tsx            # Navigation bar with active-link highlight
│   ├── data/
│   │   ├── vocabulary.ts         # 40 terms across 5 categories
│   │   ├── reading.ts            # 4 technical articles with questions
│   │   ├── commits.ts            # 5 commit message exercises
│   │   └── review.ts             # 4 code review exercises
│   └── styles/
│       └── globals.css           # Tailwind directives
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── .eslintrc.json
```

## Code Architecture

### Pages (App Router)

All pages use the Next.js App Router and are **client components** (`"use client"`) for interactivity.

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Dashboard landing page with 4 module cards and a "How It Works" overview |
| `/vocabulary` | `app/vocabulary/page.tsx` | Browse/Quiz modes for 40 technical terms across 5 categories |
| `/reading` | `app/reading/page.tsx` | Read technical articles and answer multiple-choice comprehension questions |
| `/commit` | `app/commit/page.tsx` | View code diffs and practice writing Conventional Commit messages |
| `/review` | `app/review/page.tsx` | Read code snippets, identify issues, and write professional review comments |

### Components

- **Header** (`components/Header.tsx`) — Top navigation bar with logo ("DE"), page links, and active-route highlighting via `usePathname()`. Responsive: collapses on mobile, full nav on `md+` breakpoints.

### Data Modules

All exercise content lives in `src/data/` as typed TypeScript arrays. Each module exports both an **interface** and a **data constant**.

| File | Interface | Content |
|------|-----------|---------|
| `vocabulary.ts` | `VocabCategory`, `Term` | 5 categories × 8 terms = **40 terms** (definition, code example, Chinese translation) |
| `reading.ts` | `ReadingPassage` | **4 articles** with difficulty levels and 3 multiple-choice questions each |
| `commits.ts` | `CommitExercise` | **5 exercises** covering Bug Fix, Feature, Performance, Testing, and Breaking Change |
| `review.ts` | `ReviewExercise` | **4 exercises** in TypeScript, React, Go, and Python with 2–3 issues each |

### Styling

- **Tailwind CSS** utility-first approach with a consistent color palette:
  - Sky blue — Vocabulary / primary accent
  - Emerald — Reading
  - Amber — Commit Messages
  - Purple — Code Review
  - Slate — Neutral backgrounds and text
- Responsive breakpoints (`sm`, `md`, `lg`) for mobile-first layout
- Dark code blocks for diffs and review exercises

## Completed Features

### 1. Technical Vocabulary 📚
- **5 categories**: Algorithms & Data Structures, Operating Systems, AI & Machine Learning, Networking & Distributed Systems, Databases & Storage
- **40 terms** with English definition, code example, and Chinese translation
- **Browse Mode**: Category tabs, flip-card reveal
- **Quiz Mode**: See definition + example, type the term, instant correct/incorrect feedback

### 2. Reading Comprehension 📖
- **4 technical articles** (Big-O Notation, Virtual Memory, Transformer Architecture, Database Indexing)
- Difficulty badges (Beginner / Intermediate / Advanced)
- **3 multiple-choice questions** per article with explanations
- Score display and answer review

### 3. Commit Message Practice ✍️
- **5 exercises** spanning Bug Fix, Feature, Performance, Testing, and Breaking Change categories
- Color-coded git diffs (green additions, red deletions, cyan hunk headers)
- Textarea for writing your own commit message
- Reveal good vs. bad commit examples with explanation and best-practice tips
- Teaches Conventional Commits format (`feat:`, `fix:`, `perf:`, `test:`, etc.)

### 4. Code Review in English 🔍
- **4 exercises** covering Security (SQL injection), Performance (memory leak), Concurrency (race condition), and Error Handling (resource leak)
- Code snippets in TypeScript, React, Go, and Python with line numbers
- 2–3 issues per exercise — write your own review comment
- Expert answers with professional suggestion and example comment

### 5. Dashboard & Navigation
- Home page with module overview cards and "How It Works" guide
- Persistent header with active-route highlighting
- Fully responsive layout

## Incomplete Features / TODO

- [ ] **Automated tests** — No unit/integration tests; no Jest or Vitest configuration
- [ ] **Progress persistence** — User progress is lost on page refresh (no localStorage or database)
- [ ] **User authentication** — No login/signup system
- [ ] **Admin panel** — No way to add or edit exercises from a UI
- [ ] **AI-powered grading** — Commit messages and review comments are self-checked, not auto-scored
- [ ] **Pronunciation / listening** — No audio for vocabulary terms
- [ ] **Spaced repetition** — No algorithm to schedule vocabulary review
- [ ] **PWA support** — No offline mode or service worker
- [ ] **Analytics** — No tracking of user learning behavior or progress metrics
- [ ] **i18n framework** — Chinese translations exist in vocabulary data, but no full i18n setup
- [ ] **Accessibility** — No ARIA labels, keyboard navigation, or screen-reader optimization
- [ ] **Dark mode** — App uses a light theme with dark code blocks; no global dark mode toggle

## Backend Integration Plan

The current app is **fully client-side** — all data is hardcoded in `src/data/`. Below is the planned backend integration path.

### Phase 1 — API Routes & Database

| Task | Detail |
|------|--------|
| Add Next.js API routes | Create `app/api/` endpoints for vocabulary, reading, commits, and review data |
| Database setup | PostgreSQL (or SQLite for dev) via Prisma ORM |
| Seed scripts | Migrate existing `src/data/*.ts` content into the database |
| CRUD endpoints | `GET /api/vocabulary`, `GET /api/reading/:id`, etc. |

### Phase 2 — User System & Progress

| Task | Detail |
|------|--------|
| Authentication | NextAuth.js (GitHub / Google OAuth + email/password) |
| User model | Store user profile, learning history, and preferences |
| Progress tracking | Record quiz scores, articles read, exercises completed per user |
| API protection | Auth middleware for user-specific endpoints |

### Phase 3 — AI-Assisted Grading

| Task | Detail |
|------|--------|
| LLM integration | Call OpenAI / Claude API from server-side routes |
| Commit grading | Auto-score commit messages against Conventional Commits rules and clarity |
| Review grading | Evaluate code review comments for accuracy, tone, and completeness |
| Feedback API | `POST /api/grade/commit`, `POST /api/grade/review` returning structured feedback |

### Phase 4 — Content Management & Analytics

| Task | Detail |
|------|--------|
| Admin dashboard | Protected pages for adding/editing exercises |
| Content versioning | Track exercise revisions in the database |
| Analytics pipeline | Collect per-user learning metrics (time spent, accuracy trends) |
| Spaced repetition | Schedule vocabulary review based on past performance |

### Target API Shape (Draft)

```
GET    /api/vocabulary              # List all categories & terms
GET    /api/reading                 # List articles
GET    /api/reading/:id             # Single article with questions
GET    /api/commits                 # List commit exercises
GET    /api/review                  # List review exercises
POST   /api/progress               # Save user progress
GET    /api/progress               # Retrieve user progress
POST   /api/grade/commit           # AI-grade a commit message
POST   /api/grade/review           # AI-grade a review comment
POST   /api/auth/[...nextauth]     # NextAuth.js handlers
```

## License

This is a demonstration project for educational purposes.
