export type Category =
  | 'Foundation'
  | 'Language Model'
  | 'Image Generation'
  | 'Multimodal'
  | 'AI Agent'
  | 'Open Source'
  | 'Research'
  | 'Infrastructure'
  | 'Robotics'
  | 'Code AI';

export type Impact = 'Low' | 'Medium' | 'High' | 'Revolutionary';

export interface AIEvent {
  id: string;
  year: number;
  month?: number;
  title: string;
  organization: string;
  category: Category;
  impact: Impact;
  description: string;
  details: string[];
  parameters?: string;
  links?: { label: string; url: string }[];
  tags: string[];
  highlight?: boolean;
}

export interface YearGroup {
  year: number;
  events: AIEvent[];
}

export interface FilterState {
  categories: Category[];
  yearRange: [number, number];
  impacts: Impact[];
  searchQuery: string;
}
