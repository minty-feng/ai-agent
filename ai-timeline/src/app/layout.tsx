import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Timeline — History of Artificial Intelligence',
  description:
    'An interactive, comprehensive timeline of AI development from 1950 to 2025, featuring GPT, Claude, Gemini, AI Agents, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#030712] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
