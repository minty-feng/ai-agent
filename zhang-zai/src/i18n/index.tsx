'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { zh } from './zh';
import { en } from './en';
import type { Locale } from '@/types';
import type { Translations } from './zh';

const STORAGE_KEY = 'zhang-zai-locale';

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'zh',
  t: zh,
  toggleLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === 'zh' || stored === 'en') {
      setLocale(stored);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t: Translations = locale === 'zh' ? zh : en;

  return (
    <I18nContext.Provider value={{ locale, t, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}
