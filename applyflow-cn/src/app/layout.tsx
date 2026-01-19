import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI 面试准备平台',
  description: '基于AI的面试准备工具 - 生成定制化面试题，模拟真实面试，获取专业复盘报告'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased bg-white text-gray-900">{children}</body>
    </html>
  );
}
