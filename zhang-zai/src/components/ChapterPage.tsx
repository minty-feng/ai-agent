'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n';
import ArticleCard from '@/components/ArticleCard';
import type { Chapter } from '@/types';

const ACCENT_TEXT: Record<string, string> = {
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  sky: 'text-sky-400',
  violet: 'text-violet-400',
};

const ACCENT_BORDER: Record<string, string> = {
  amber: 'border-amber-500/30',
  emerald: 'border-emerald-500/30',
  sky: 'border-sky-500/30',
  violet: 'border-violet-500/30',
};

interface ChapterPageProps {
  chapter: Chapter;
}

export default function ChapterPage({ chapter }: ChapterPageProps) {
  const { t, locale } = useTranslation();
  const accentText = ACCENT_TEXT[chapter.accentClass] ?? ACCENT_TEXT['amber'];
  const accentBorder = ACCENT_BORDER[chapter.accentClass] ?? ACCENT_BORDER['amber'];

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-300"
      >
        ← {t.backToHome}
      </Link>

      {/* Chapter hero */}
      <section className={`mb-12 border-b ${accentBorder} pb-12 text-center`}>
        <p className="mb-3 text-xs tracking-[0.4em] text-slate-500 uppercase">
          {t.chapterOf} {chapter.id}
        </p>

        <h1
          className={`chapter-phrase mb-4 ${accentText}`}
          lang="zh"
        >
          {chapter.phrase}
        </h1>

        <p className="mb-2 text-sm tracking-wider text-slate-500">{chapter.pinyin}</p>

        {locale === 'en' && (
          <p className="mb-6 text-xl font-light text-slate-300 italic">{chapter.phraseEn}</p>
        )}

        <div className="gold-divider mx-auto mb-6 w-32" />

        <p className="mx-auto max-w-2xl text-sm leading-8 text-slate-400">
          {locale === 'zh' ? chapter.detail : chapter.detailEn}
        </p>
      </section>

      {/* Articles */}
      <section>
        <h2 className="mb-6 text-xs tracking-[0.3em] text-slate-500 uppercase">
          {locale === 'zh' ? '收录文章' : t.articles}
        </h2>

        {chapter.articles.length === 0 ? (
          <p className="text-center text-sm text-slate-600">{t.noArticles}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {chapter.articles.map((article) => (
              <ArticleCard key={article.id} article={article} accentClass={chapter.accentClass} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
