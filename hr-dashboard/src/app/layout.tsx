import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ApplyFlow - Turn job descriptions into tailored interview plans',
  description: 'Track applications, tailor your resume, practice with mock interviews, and share reports to get feedback.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-white text-gray-900">{children}</body>
    </html>
  );
}
