'use client';

import { CHAPTER_MAP } from '@/data/chapters';
import ChapterPage from '@/components/ChapterPage';

const chapter = CHAPTER_MAP.get('chapter-1')!;

export default function Page() {
  return <ChapterPage chapter={chapter} />;
}
