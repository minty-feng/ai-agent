'use client';

import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import StatsSection from '@/components/StatsSection';
import FilterBar from '@/components/FilterBar';
import Timeline from '@/components/Timeline';
import Footer from '@/components/Footer';
import { AI_EVENTS } from '@/data/aiHistory';
import type { FilterState } from '@/types';

const DEFAULT_FILTER: FilterState = {
  categories: [],
  yearRange: [1950, 2025],
  impacts: [],
  searchQuery: '',
};

export default function Home() {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const filteredEvents = useMemo(() => {
    return AI_EVENTS.filter((e) => {
      if (filter.categories.length && !filter.categories.includes(e.category)) return false;
      if (filter.impacts.length && !filter.impacts.includes(e.impact)) return false;
      if (e.year < filter.yearRange[0] || e.year > filter.yearRange[1]) return false;
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.organization.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [filter]);

  return (
    <main className="min-h-screen">
      <Header />
      <StatsSection />
      <FilterBar
        filter={filter}
        onChange={setFilter}
        totalCount={AI_EVENTS.length}
        filteredCount={filteredEvents.length}
      />
      <Timeline events={filteredEvents} />
      <Footer />
    </main>
  );
}
