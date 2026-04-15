# 横渠四句 — Zhang Zai's Four Mottos

> 为天地立心，为生民立命，为往圣继绝学，为万世开太平。
>
> *Establish the mind of Heaven and Earth; establish destiny for the people; continue the lost learning of past sages; usher in lasting peace for all generations.*

— **Zhang Zai (张载, 1020–1077)**, Song-dynasty Confucian philosopher

---

## About

An elegant, dark-themed web application that showcases Zhang Zai's four timeless mottos displayed in large Chinese calligraphy, explains each motto in depth, and organises collected articles into four thematic chapters.

Built with **Next.js 15 · React 19 · TypeScript · Tailwind CSS**, with full **i18n** support (Chinese / English).

---

## Features

- **Large hero display** of all four mottos on the home page with a gold gradient serif typeface
- **Four chapter pages** — one per motto — each showing a full philosophical explanation and collected articles
- **i18n (Chinese / English)** — toggle in the header, preference persisted in `localStorage`
- **Expandable articles** — read summaries on the chapter page, expand to full content inline
- **Per-chapter colour themes** — amber, emerald, sky, violet
- **Dark ink aesthetic** — deep navy/black background, gold accents, Noto Serif SC for Chinese display text

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** (App Router) | 15.3.9 | SSR, routing |
| **React** | 19.1.0 | Component model |
| **TypeScript** | 5.5.3 | Type safety |
| **Tailwind CSS** | 3.4.7 | Utility-first styling |
| **Noto Serif SC** | Google Fonts | Chinese serif display font |

---

## Getting Started

```bash
cd zhang-zai
npm install
npm run dev
```

Open [http://localhost:3004](http://localhost:3004) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server on port 3004 |
| `npm run build` | Production build |
| `npm start` | Production server on port 3004 |
| `npm run lint` | ESLint (`next/core-web-vitals`) |

---

## Project Structure

```
zhang-zai/
├── docs/
│   └── architecture.md          # Component diagram, data flow, design notes
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout — I18nProvider, Header, Footer
│   │   ├── page.tsx              # Home — hero display + chapter cards
│   │   ├── globals.css           # Global styles, hero-phrase, chapter-phrase
│   │   ├── chapter-1/page.tsx    # 为天地立心
│   │   ├── chapter-2/page.tsx    # 为生民立命
│   │   ├── chapter-3/page.tsx    # 为往圣继绝学
│   │   └── chapter-4/page.tsx    # 为万世开太平
│   ├── components/
│   │   ├── Header.tsx            # Sticky nav with language toggle
│   │   ├── Footer.tsx            # Footer
│   │   ├── ChapterCard.tsx       # Card on home page
│   │   ├── ChapterPage.tsx       # Shared chapter layout
│   │   └── ArticleCard.tsx       # Expandable article card
│   ├── data/
│   │   └── chapters.ts           # All content — chapters, explanations, articles
│   ├── i18n/
│   │   ├── index.ts              # I18nProvider + useTranslation hook
│   │   ├── zh.ts                 # Chinese strings
│   │   └── en.ts                 # English strings
│   └── types/
│       └── index.ts              # Locale, Article, Chapter types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .eslintrc.json
```

---

## The Four Mottos

| # | Chinese | Pinyin | English |
|---|---------|--------|---------|
| 1 | 为天地立心 | Wèi tiāndì lì xīn | Establish the Mind of Heaven and Earth |
| 2 | 为生民立命 | Wèi shēngmín lì mìng | Establish Destiny for the People |
| 3 | 为往圣继绝学 | Wèi wǎng shèng jì jué xué | Continue the Lost Learning of Past Sages |
| 4 | 为万世开太平 | Wèi wànshì kāi tàipíng | Usher in Lasting Peace for All Generations |

---

## Adding Articles

All content lives in `src/data/chapters.ts`. Add an `Article` object to any chapter's `articles` array — no other code changes required. See [`docs/architecture.md`](docs/architecture.md) for the full schema.

---

## License

Built as part of the [ai-agent](../README.md) project collection.
