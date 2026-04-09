'use client';

import { ALL_CATEGORIES } from '@/data/aiHistory';
import type { Category, FilterState, Impact } from '@/types';

interface FilterBarProps {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const CATEGORY_COLORS: Record<Category, string> = {
  Foundation: 'bg-amber-500',
  'Language Model': 'bg-indigo-500',
  'Image Generation': 'bg-pink-500',
  Multimodal: 'bg-cyan-500',
  'AI Agent': 'bg-emerald-500',
  'Open Source': 'bg-lime-500',
  Research: 'bg-violet-500',
  Infrastructure: 'bg-slate-500',
  Robotics: 'bg-orange-500',
  'Code AI': 'bg-teal-500',
};

const IMPACTS: Impact[] = ['Revolutionary', 'High', 'Medium', 'Low'];

const IMPACT_COLORS: Record<Impact, string> = {
  Revolutionary: 'border-rose-500/60 text-rose-400',
  High: 'border-orange-500/60 text-orange-400',
  Medium: 'border-blue-500/60 text-blue-400',
  Low: 'border-slate-500/60 text-slate-400',
};

export default function FilterBar({ filter, onChange, totalCount, filteredCount }: FilterBarProps) {
  const toggleCategory = (cat: Category) => {
    const has = filter.categories.includes(cat);
    onChange({
      ...filter,
      categories: has ? filter.categories.filter((c) => c !== cat) : [...filter.categories, cat],
    });
  };

  const toggleImpact = (imp: Impact) => {
    const has = filter.impacts.includes(imp);
    onChange({
      ...filter,
      impacts: has ? filter.impacts.filter((i) => i !== imp) : [...filter.impacts, imp],
    });
  };

  const reset = () =>
    onChange({ categories: [], yearRange: [1950, 2025], impacts: [], searchQuery: '' });

  const isFiltered =
    filter.categories.length > 0 ||
    filter.impacts.length > 0 ||
    filter.searchQuery !== '' ||
    filter.yearRange[0] !== 1950 ||
    filter.yearRange[1] !== 2025;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      <div className="glass rounded-2xl p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search events, organizations, tags…"
            value={filter.searchQuery}
            onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
            className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
          />
        </div>

        {/* Category chips */}
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">
            Categories
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const active = filter.categories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                    active
                      ? 'border-white/20 bg-slate-700/80 text-white'
                      : 'border-white/5 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-white/15'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]}`} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Impact filters */}
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">
            Impact
          </div>
          <div className="flex flex-wrap gap-2">
            {IMPACTS.map((imp) => {
              const active = filter.impacts.includes(imp);
              return (
                <button
                  key={imp}
                  onClick={() => toggleImpact(imp)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                    active
                      ? `${IMPACT_COLORS[imp]} bg-slate-700/60`
                      : 'border-white/5 bg-slate-900/40 text-slate-400 hover:border-white/15 hover:text-slate-200'
                  }`}
                >
                  {imp === 'Revolutionary' && '⭐ '}
                  {imp === 'High' && '🔥 '}
                  {imp}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-sm text-slate-400">
            Showing{' '}
            <span className="text-indigo-400 font-semibold">{filteredCount}</span>
            {' '}of{' '}
            <span className="text-slate-300 font-semibold">{totalCount}</span>
            {' '}events
          </span>
          {isFiltered && (
            <button
              onClick={reset}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors px-3 py-1 rounded-lg border border-white/5 hover:border-rose-500/30"
            >
              ✕ Reset filters
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
