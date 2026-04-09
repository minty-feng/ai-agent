'use client';

const STATS = [
  {
    icon: '📅',
    value: '75+',
    label: 'Years',
    sub: 'AI Research History',
    gradient: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/30',
    valueColor: 'text-amber-400',
  },
  {
    icon: '🎯',
    value: '100+',
    label: 'Events',
    sub: 'Key Milestones',
    gradient: 'from-indigo-500/20 to-purple-500/10',
    border: 'border-indigo-500/30',
    valueColor: 'text-indigo-400',
  },
  {
    icon: '🔬',
    value: '10',
    label: 'Categories',
    sub: 'Research Areas',
    gradient: 'from-cyan-500/20 to-teal-500/10',
    border: 'border-cyan-500/30',
    valueColor: 'text-cyan-400',
  },
  {
    icon: '🚀',
    value: '2025',
    label: 'Latest Updates',
    sub: 'Including DeepSeek & Claude 4',
    gradient: 'from-emerald-500/20 to-green-500/10',
    border: 'border-emerald-500/30',
    valueColor: 'text-emerald-400',
  },
];

export default function StatsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`relative rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.gradient} backdrop-blur-sm p-5 flex flex-col gap-1 hover:scale-[1.02] transition-transform duration-200`}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-3xl font-extrabold ${stat.valueColor}`}>{stat.value}</div>
            <div className="text-white font-semibold text-sm">{stat.label}</div>
            <div className="text-slate-500 text-xs">{stat.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
