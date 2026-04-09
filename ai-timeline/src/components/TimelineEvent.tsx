'use client';

import { useState } from 'react';
import type { AIEvent, Category, Impact } from '@/types';

interface TimelineEventProps {
  event: AIEvent;
  side: 'left' | 'right';
  isFirst: boolean;
}

const CATEGORY_STYLES: Record<Category, { bg: string; text: string; border: string; dot: string }> = {
  Foundation: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
  },
  'Language Model': {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-500',
  },
  'Image Generation': {
    bg: 'bg-pink-500/15',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
    dot: 'bg-pink-500',
  },
  Multimodal: {
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-500',
  },
  'AI Agent': {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  'Open Source': {
    bg: 'bg-lime-500/15',
    text: 'text-lime-400',
    border: 'border-lime-500/30',
    dot: 'bg-lime-500',
  },
  Research: {
    bg: 'bg-violet-500/15',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    dot: 'bg-violet-500',
  },
  Infrastructure: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500',
  },
  Robotics: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
  },
  'Code AI': {
    bg: 'bg-teal-500/15',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
    dot: 'bg-teal-500',
  },
};

const IMPACT_STYLES: Record<Impact, { bg: string; text: string; icon: string }> = {
  Revolutionary: { bg: 'bg-rose-500/15', text: 'text-rose-400', icon: '⭐' },
  High: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: '🔥' },
  Medium: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: '📈' },
  Low: { bg: 'bg-slate-500/15', text: 'text-slate-400', icon: '•' },
};

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TimelineEvent({ event, side, isFirst }: TimelineEventProps) {
  const [expanded, setExpanded] = useState(false);
  const catStyle = CATEGORY_STYLES[event.category];
  const impStyle = IMPACT_STYLES[event.impact];
  const visibleDetails = expanded ? event.details : event.details.slice(0, 3);

  const card = (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 cursor-default
        ${event.highlight
          ? 'border-indigo-500/40 bg-slate-900/80 hover:border-indigo-400/60'
          : 'border-white/8 bg-slate-900/60 hover:border-white/15'
        }
        backdrop-blur-sm hover:scale-[1.01] hover:shadow-xl
        ${event.highlight ? 'hover:shadow-indigo-500/10' : 'hover:shadow-slate-900/50'}
        p-5
      `}
      style={
        event.highlight && !isFirst
          ? { boxShadow: '0 0 0 1px rgba(99,102,241,0.2)' }
          : undefined
      }
    >
      {/* Highlight glow border */}
      {event.highlight && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none animate-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
          {event.category}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${impStyle.bg} ${impStyle.text}`}
        >
          {impStyle.icon} {event.impact}
        </span>
        <span className="ml-auto text-xs text-slate-500 font-mono">
          {event.month ? `${MONTHS[event.month]} ` : ''}
          {event.year}
        </span>
      </div>

      {/* Title */}
      <h3
        className={`text-base font-bold leading-snug mb-1 ${
          event.highlight
            ? 'bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent'
            : 'text-slate-100'
        }`}
      >
        {event.title}
      </h3>

      {/* Organization */}
      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
        <span>🏢</span> {event.organization}
      </p>

      {/* Description */}
      <p className="text-sm text-slate-300 leading-relaxed mb-3">{event.description}</p>

      {/* Details */}
      {event.details.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {visibleDetails.map((d, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
              <span className="mt-0.5 text-slate-600 flex-shrink-0">▸</span>
              <span>{d}</span>
            </li>
          ))}
          {event.details.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
            >
              {expanded ? '▴ Show less' : `▾ ${event.details.length - 3} more details`}
            </button>
          )}
        </ul>
      )}

      {/* Parameters */}
      {event.parameters && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-800/80 text-teal-400 px-2.5 py-1 rounded-lg border border-teal-500/20">
            ⚙️ {event.parameters} params
          </span>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {event.tags.slice(0, 6).map((tag) => (
          <span
            key={tag}
            className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md border border-white/5"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  // Desktop: alternate left/right. Mobile: always right column.
  return (
    <>
      {/* Desktop layout */}
      <div className={`hidden md:flex items-start gap-0 ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Card side */}
        <div className="w-[calc(50%-2rem)] px-4">{card}</div>
        {/* Center dot */}
        <div className="flex-shrink-0 flex flex-col items-center" style={{ width: '4rem' }}>
          <div
            className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 mt-5 z-10 ${catStyle.dot} ${event.highlight ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-indigo-500/60' : ''}`}
          />
        </div>
        {/* Empty opposite side */}
        <div className="w-[calc(50%-2rem)]" />
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex items-start gap-3 pl-2">
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full border-2 border-slate-900 mt-5 z-10 flex-shrink-0 ${catStyle.dot}`} />
        </div>
        <div className="flex-1 pb-2">{card}</div>
      </div>
    </>
  );
}
