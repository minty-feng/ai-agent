export type Locale = 'zh' | 'en';

export interface Article {
  id: string;
  title: string;
  titleEn: string;
  author: string;
  authorEn: string;
  summary: string;
  summaryEn: string;
  content: string;
  contentEn: string;
  tags: string[];
  tagsEn: string[];
}

export interface Chapter {
  id: number;
  /** Route segment, e.g. "chapter-1" */
  slug: string;
  /** Chinese four-character phrase */
  phrase: string;
  /** Pinyin romanisation */
  pinyin: string;
  /** English rendering of the phrase */
  phraseEn: string;
  /** Short Chinese explanation (~50 chars) */
  explanation: string;
  /** Full Chinese explanation */
  detail: string;
  /** Full English explanation */
  detailEn: string;
  /** Accent color class (Tailwind) used for this chapter's theme */
  accentClass: string;
  articles: Article[];
}
