'use client';

import { ALL_CATEGORIES } from '@/data/aiHistory';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⚡</span>
              <span
                className="text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI Timeline
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              A comprehensive, interactive history of artificial intelligence — from Turing to AGI.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {['Papers With Code', 'Hugging Face', 'arXiv AI', 'OpenAI Blog', 'DeepMind Blog'].map(
                (r) => (
                  <li
                    key={r}
                    className="hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {r}
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Categories
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {ALL_CATEGORIES.map((cat) => (
                <li key={cat} className="hover:text-slate-300 transition-colors cursor-pointer">
                  {cat}
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              About
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {['About This Project', 'Data Sources', 'Contribute', 'Report an Error'].map((a) => (
                <li key={a} className="hover:text-slate-300 transition-colors cursor-pointer">
                  {a}
                </li>
              ))}
            </ul>
            <div className="mt-4 text-xs text-slate-600 space-y-1">
              <p>Last updated: April 2025</p>
              <p>Data curated for educational purposes.</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p>© 2025 AI Timeline. Data curated for educational purposes.</p>
          <p>Built with Next.js 14 · TypeScript · Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
