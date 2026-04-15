'use client';

import { useTranslation } from '@/i18n';
import ChapterCard from '@/components/ChapterCard';
import { CHAPTERS } from '@/data/chapters';

export default function Home() {
  const { t, locale } = useTranslation();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="mb-16 text-center">
        <p className="mb-4 text-xs tracking-[0.4em] text-gold-500/70 uppercase">
          {t.siteTagline}
        </p>

        <h1 className="hero-phrase mb-6" lang="zh">
          横渠四句
        </h1>

        <div className="gold-divider mx-auto mb-6 w-48" />

        {/* Four sentences vertical display */}
        <div className="mx-auto mb-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {CHAPTERS.map((ch) => (
            <div key={ch.id} className="group text-center">
              <p
                className="font-serif text-lg font-bold text-gold-400/80 tracking-widest transition-colors group-hover:text-gold-400"
                lang="zh"
              >
                {ch.phrase}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400">
          {t.heroSubtitle}
        </p>
      </section>

      {/* Chapters grid */}
      <section>
        <h2 className="mb-8 text-center text-xs tracking-[0.3em] text-slate-500 uppercase">
          {locale === 'zh' ? '四篇章' : 'Four Chapters'}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {CHAPTERS.map((ch) => (
            <ChapterCard key={ch.id} chapter={ch} />
          ))}
        </div>
      </section>
    </div>
  );
}
