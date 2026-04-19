import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "天涯神贴 — 那些年轰动天涯的经典帖子",
  description:
    "收录天涯论坛历年经典神贴，涵盖经济预言、历史解读、人生感悟、灵异悬疑等多个分类。重温互联网黄金时代的文字力量。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-parchment-50 text-brown-700">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-brown-200/40 bg-parchment-50/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <span className="text-2xl">📜</span>
              <span
                className="text-xl font-bold tracking-wide"
                style={{ fontFamily: "var(--font-serif)", color: "var(--color-vermilion-600)" }}
              >
                天涯神贴
              </span>
            </Link>
            <p
              className="hidden text-xs tracking-wider sm:block"
              style={{ color: "var(--color-brown-400)" }}
            >
              重温经典 · 文字的力量
            </p>
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-brown-200/40 py-6 text-center text-xs" style={{ color: "var(--color-brown-400)" }}>
          <p>天涯神贴 — 收录天涯论坛历年经典帖子</p>
          <p className="mt-1">内容来源于互联网，仅供学习交流</p>
        </footer>
      </body>
    </html>
  );
}
