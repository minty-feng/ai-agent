'use client';

import { getGroupedByYear } from '@/data/aiHistory';
import type { AIEvent } from '@/types';
import TimelineEvent from './TimelineEvent';

interface TimelineProps {
  events: AIEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  const groups = getGroupedByYear(events);

  if (events.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-400 text-lg font-medium">No events match your filters</p>
        <p className="text-slate-600 text-sm mt-2">Try adjusting your search or filter criteria</p>
      </section>
    );
  }

  // Flatten events in order to assign alternating sides across the full timeline
  let globalIndex = 0;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative">
        {/* Center vertical line — desktop only */}
        <div
          className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 timeline-line"
          aria-hidden="true"
        />

        {/* Mobile left line */}
        <div
          className="md:hidden absolute left-5 top-0 bottom-0 w-px timeline-line"
          aria-hidden="true"
        />

        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.year}>
              {/* Year badge */}
              <div className="relative flex items-center justify-center py-6">
                {/* Desktop: centered badge */}
                <div className="hidden md:flex items-center justify-center z-10">
                  <div className="glass rounded-2xl px-6 py-2 border border-white/10">
                    <span
                      className="text-2xl font-extrabold tracking-wide"
                      style={{
                        background:
                          'linear-gradient(135deg, #a78bfa 0%, #6366f1 40%, #06b6d4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {group.year}
                    </span>
                  </div>
                </div>

                {/* Mobile: left-aligned year */}
                <div className="md:hidden flex items-center gap-3 w-full pl-10">
                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/40 to-transparent" />
                  <span
                    className="text-xl font-extrabold"
                    style={{
                      background: 'linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {group.year}
                  </span>
                  <div className="h-px w-8 bg-gradient-to-r from-cyan-500/40 to-transparent" />
                </div>
              </div>

              {/* Events in this year */}
              <div className="space-y-4">
                {group.events.map((event, idx) => {
                  const side: 'left' | 'right' = globalIndex % 2 === 0 ? 'left' : 'right';
                  const isFirst = idx === 0 && globalIndex === 0;
                  globalIndex++;
                  return (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      side={side}
                      isFirst={isFirst}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
