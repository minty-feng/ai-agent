'use client';

import { useTranslation } from '@/i18n';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-gold-500/20 py-8 text-center">
      <p className="text-sm text-slate-500">{t.footerText}</p>
    </footer>
  );
}
