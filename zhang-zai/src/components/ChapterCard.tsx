'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n';
import type { Chapter } from '@/types';

const ACCENT_STYLES: Record<string, { border: string; glow: string; badge: string; text: string }> = {
  amber: {
    border: 'border-amber-500/40 hover:border-amber-400/70',
    glow: 'group-hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]',
    badge: 'bg-amber-500/20 text-amber-300',
    text: 'text-amber-400',
  },
  emerald: {
    border: 'border-emerald-500/40 hover:border-emerald-400/70',
    glow: 'group-hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
    badge: 'bg-emerald-500/20 text-emerald-300',
    text: 'text-emerald-400',
  },
  sky: {
    border: 'border-sky-500/40 hover:border-sky-400/70',
    glow: 'group-hover:shadow-[0_0_24px_rgba(14,165,233,0.25)]',
    badge: 'bg-sky-500/20 text-sky-300',
    text: 'text-sky-400',
  },
  violet: {
    border: 'border-violet-500/40 hover:border-violet-400/70',
    glow: 'group-hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]',
    badge: 'bg-violet-500/20 text-violet-300',
    text: 'text-violet-400',
  },
};

interface ChapterCardProps {
  chapter: Chapter;
}

export default function ChapterCard({ chapter }: ChapterCardProps) {
  const { t, locale } = useTranslation();
  const accent = ACCENT_STYLES[chapter.accentClass] ?? ACCENT_STYLES['amber'];

  return (
    <Link
      href={`/${chapter.slug}`}
      className={`group relative block rounded-2xl border bg-ink-800/60 p-6 backdrop-blur-sm transition-all duration-300 ${accent.border} ${accent.glow}`}
    >
      <div className={`mb-1 text-xs font-medium ${accent.badge} inline-block rounded-full px-2 py-0.5`}>
        {t.chapterOf} {chapter.id} {t.chapterUnit}
      </div>

      <h2
        className={`mt-3 font-serif text-4xl font-bold tracking-widest ${accent.text}`}
        lang="zh"
      >
        {chapter.phrase}
      </h2>

      <p className="mt-1 text-xs text-slate-500 tracking-wider">{chapter.pinyin}</p>

      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        {locale === 'zh' ? chapter.explanation : chapter.phraseEn}
      </p>

      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-500">
        {locale === 'zh' ? chapter.detail : chapter.detailEn}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          {chapter.articles.length} {t.articles}
        </span>
        <span className={`${accent.text} transition-transform group-hover:translate-x-1`}>→</span>
      </div>
    </Link>
  );
}
