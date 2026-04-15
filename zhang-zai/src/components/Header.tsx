'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/i18n';
import { CHAPTERS } from '@/data/chapters';

export default function Header() {
  const { t, locale, toggleLocale } = useTranslation();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gold-500/20 bg-ink-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold text-gold-400 tracking-wider">
            {locale === 'zh' ? '横渠四句' : "Zhang Zai"}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/"
            className={`transition-colors hover:text-gold-400 ${
              pathname === '/' ? 'text-gold-400' : 'text-slate-400'
            }`}
          >
            {t.navHome}
          </Link>
          {CHAPTERS.map((ch) => (
            <Link
              key={ch.slug}
              href={`/${ch.slug}`}
              className={`transition-colors hover:text-gold-400 ${
                pathname === `/${ch.slug}` ? 'text-gold-400' : 'text-slate-400'
              }`}
              title={locale === 'zh' ? ch.phrase : ch.phraseEn}
            >
              {locale === 'zh' ? ch.phrase : `Ch.${ch.id}`}
            </Link>
          ))}
        </nav>

        <button
          onClick={toggleLocale}
          className="rounded-md border border-gold-500/40 px-3 py-1 text-xs font-medium text-gold-400 transition hover:border-gold-400 hover:bg-gold-500/10"
        >
          {t.switchLang}
        </button>
      </div>
    </header>
  );
}
