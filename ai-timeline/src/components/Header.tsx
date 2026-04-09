'use client';

// Pre-computed star positions to avoid server/client hydration mismatch
// (Math.random() produces different values on server vs client)
const STARS = Array.from({ length: 30 }, (_, i) => ({
  width: ((i * 7 + 1) % 2) + 1 + 'px',
  height: ((i * 11 + 1) % 2) + 1 + 'px',
  top: ((i * 37 + 13) % 100) + '%',
  left: ((i * 53 + 7) % 100) + '%',
  opacity: (((i * 17 + 5) % 50) / 100 + 0.1),
}));

export default function Header() {
  return (
    <header className="relative w-full overflow-hidden">
      {/* Mesh gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(6,182,212,0.2) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 20% 50%, rgba(139,92,246,0.2) 0%, transparent 55%), #030712',
        }}
      />

      {/* Star dots decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={star}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-3xl">⚡</span>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 35%, #06b6d4 70%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI Timeline
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-slate-300 text-lg sm:text-xl font-medium mb-2">
          The Complete History of Artificial Intelligence
        </p>
        <p className="text-slate-500 text-sm mb-10">
          From Alan Turing&apos;s imitation game to autonomous AI agents — every milestone that
          shaped the future
        </p>

        {/* Stats bar */}
        <div className="inline-flex flex-wrap justify-center gap-2 sm:gap-4 px-4 py-3 rounded-2xl glass">
          {[
            { icon: '📅', value: '75+ Years', label: 'of AI History' },
            { icon: '🎯', value: '100+ Milestones', label: 'documented' },
            { icon: '🔬', value: '10 Categories', label: 'of research' },
            { icon: '🚀', value: 'Updated 2025', label: 'latest models' },
          ].map((stat) => (
            <div
              key={stat.value}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300"
            >
              <span className="text-base">{stat.icon}</span>
              <span className="font-semibold text-white">{stat.value}</span>
              <span className="text-slate-500 hidden sm:inline">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#030712] to-transparent" />
    </header>
  );
}
