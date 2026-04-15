# Architecture — Zhang Zai's Four Mottos

## Overview

`zhang-zai` is a Next.js 15 (App Router) frontend application that displays the four timeless mottos of Song-dynasty Confucian philosopher Zhang Zai (张载, 1020–1077). The application supports both Chinese and English (i18n), organizes content into four thematic chapters, and allows future articles to be added per chapter.

---

## Module Diagram

```
zhang-zai/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout: I18nProvider + Header + Footer
│   │   ├── page.tsx             # Home — hero display + 4 chapter cards
│   │   ├── globals.css          # Global styles, CSS custom props, hero-phrase class
│   │   ├── chapter-1/page.tsx   # 为天地立心
│   │   ├── chapter-2/page.tsx   # 为生民立命
│   │   ├── chapter-3/page.tsx   # 为往圣继绝学
│   │   └── chapter-4/page.tsx   # 为万世开太平
│   │
│   ├── components/
│   │   ├── Header.tsx           # Sticky nav: site title, chapter links, lang toggle
│   │   ├── Footer.tsx           # Footer with attribution
│   │   ├── ChapterCard.tsx      # Card used on the home page per chapter
│   │   ├── ChapterPage.tsx      # Shared chapter page layout (hero + articles)
│   │   └── ArticleCard.tsx      # Expandable article card with tags
│   │
│   ├── data/
│   │   └── chapters.ts          # CHAPTERS array + CHAPTER_MAP (all content here)
│   │
│   ├── i18n/
│   │   ├── index.ts             # I18nProvider, useTranslation hook
│   │   ├── zh.ts                # Chinese translation strings
│   │   └── en.ts                # English translation strings
│   │
│   └── types/
│       └── index.ts             # Locale, Article, Chapter interfaces
│
├── docs/
│   └── architecture.md          # This file
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .eslintrc.json
```

---

## Data Flow

```
chapters.ts (CHAPTERS)
      │
      ├── Home page (page.tsx)
      │       └── ChapterCard × 4  ──link──▶  /chapter-{n}
      │
      └── Chapter pages (chapter-{n}/page.tsx)
              └── ChapterPage
                      └── ArticleCard × N
```

All content is statically defined in `src/data/chapters.ts`. Each `Chapter` object holds its four-character phrase, pinyin, English rendering, Chinese and English explanations, and an array of `Article` objects.

---

## i18n Architecture

```
I18nProvider (src/i18n/index.ts)
│  - stores locale ('zh' | 'en') in React state
│  - persists to localStorage (key: 'zhang-zai-locale')
│  - provides { locale, t, toggleLocale } via Context
│
├── zh.ts  — Chinese string map
└── en.ts  — English string map (same keys, typed against zh.ts)

useTranslation() — hook consumed by all client components
```

Language switching is purely client-side. No URL segments or SSR locale detection is required for this static content app.

---

## Styling Conventions

- **Dark ink palette**: `#0a0a0f` (ink-900), `#12121a` (ink-800) — defined in `tailwind.config.ts`.
- **Gold accents**: `gold-400` (`#fbbf24`) for primary interactive elements and headings.
- **Per-chapter accent colours**: amber / emerald / sky / violet — applied via the `accentClass` field on each `Chapter`.
- **`hero-phrase` CSS class**: applies `clamp`-based responsive font size, letter-spacing, and a gold gradient fill for the main title display.
- **`chapter-phrase` CSS class**: very large serif display text used on individual chapter pages.
- **Noto Serif SC**: loaded from Google Fonts, used for all Chinese calligraphic/display text.

---

## Adding New Articles

All articles live in `src/data/chapters.ts` inside the relevant chapter's `articles` array. Add a new `Article` object:

```ts
{
  id: 'c1-a3',          // unique — chapter prefix + sequential number
  title: '中文标题',
  titleEn: 'English Title',
  author: '作者姓名',
  authorEn: 'Author Name',
  summary: '一段简短的中文摘要。',
  summaryEn: 'A short English summary.',
  content: `Full Chinese article body...`,
  contentEn: `Full English article body...`,
  tags: ['标签1', '标签2'],
  tagsEn: ['Tag 1', 'Tag 2'],
}
```

No code changes are needed outside of `chapters.ts`.

---

## Adding a New Chapter

This app is designed around exactly four chapters (matching the four mottos). If extended beyond four, update:

1. `src/data/chapters.ts` — add the new `Chapter` object with a new `slug`.
2. `src/app/<slug>/page.tsx` — create the new route.
3. `src/components/Header.tsx` — the nav renders chapters dynamically from `CHAPTERS`, so no change needed there.
