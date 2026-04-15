'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n';
import type { Article } from '@/types';

const ACCENT_TEXT: Record<string, string> = {
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  sky: 'text-sky-400',
  violet: 'text-violet-400',
};

const ACCENT_TAG: Record<string, string> = {
  amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  sky: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  violet: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
};

interface ArticleCardProps {
  article: Article;
  accentClass: string;
}

export default function ArticleCard({ article, accentClass }: ArticleCardProps) {
  const { t, locale } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const title = locale === 'zh' ? article.title : article.titleEn;
  const author = locale === 'zh' ? article.author : article.authorEn;
  const summary = locale === 'zh' ? article.summary : article.summaryEn;
  const content = locale === 'zh' ? article.content : article.contentEn;
  const tags = locale === 'zh' ? article.tags : article.tagsEn;

  const accentText = ACCENT_TEXT[accentClass] ?? ACCENT_TEXT['amber'];
  const accentTag = ACCENT_TAG[accentClass] ?? ACCENT_TAG['amber'];

  return (
    <article className="rounded-xl border border-white/8 bg-ink-800/50 p-6 backdrop-blur-sm">
      <h3 className={`font-serif text-lg font-semibold leading-snug ${accentText}`}>{title}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {t.authorLabel}: {author}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">{summary}</p>

      {expanded && (
        <div className="mt-4 border-t border-white/8 pt-4">
          <p className="whitespace-pre-wrap text-sm leading-8 text-slate-300">{content}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className={`rounded-full px-2 py-0.5 text-xs ${accentTag}`}>
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-slate-500 transition hover:text-slate-300"
        >
          {expanded ? '↑ 收起' : `↓ ${t.readMore}`}
        </button>
      </div>
    </article>
  );
}
