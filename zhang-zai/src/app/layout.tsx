import type { Metadata } from 'next';
import { I18nProvider } from '@/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: "横渠四句 — Zhang Zai's Four Mottos",
  description:
    '为天地立心，为生民立命，为往圣继绝学，为万世开太平。北宋思想家张载的传世格言与思想文章收录。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ink-900 text-slate-200 antialiased">
        <I18nProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-12">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
