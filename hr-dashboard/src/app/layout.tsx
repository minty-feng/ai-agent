import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HR Dashboard',
  description: 'HackerRank-like dashboard clone for demo purposes'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-white text-gray-900">{children}</body>
    </html>
  );
}
