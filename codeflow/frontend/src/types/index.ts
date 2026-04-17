export interface AnalyzeRequest {
  repo: string;
  token?: string;
}

export interface GraphNode {
  id: string;
  path: string;
  language: string;
  size: number;
  blast_radius: number;
  security_count: number;
  // d3 simulation fields (added at runtime)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface SecurityIssue {
  file: string;
  line: number;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  code_snippet: string;
}

export interface Pattern {
  name: string;
  pattern_type: string; // 'good' | 'anti'
  description: string;
  files: string[];
  icon: string;
}

export interface HealthScore {
  score: number;
  grade: string;
  circular_deps: number;
  high_security: number;
  medium_security: number;
  anti_patterns: number;
  avg_coupling: number;
}

export interface Stats {
  file_count: number;
  total_lines: number;
  languages: Record<string, number>;
  circular_deps: number;
}

export interface FunctionInfo {
  name: string;
  line: number;
}

export interface AnalyzedFile {
  path: string;
  language: string;
  line_count: number;
  dependencies: string[];
  functions: FunctionInfo[];
  security_count: number;
  blast_radius: number;
}

export interface AnalysisResult {
  files: AnalyzedFile[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  health_score: HealthScore;
  security_issues: SecurityIssue[];
  patterns: Pattern[];
  stats: Stats;
}

// ---------------------------------------------------------------------------
// File browser types
// ---------------------------------------------------------------------------

export interface DirEntry {
  name: string;
  path: string;
  entry_type: 'file' | 'dir';
  size?: number;
}

// ---------------------------------------------------------------------------
// Build dependency types
// ---------------------------------------------------------------------------

export interface SourceFileInfo {
  path: string;
  last_modified: string | null;
  language: string;
}

export interface BuildDepsResponse {
  targets: string[];
  files: SourceFileInfo[];
}

export interface BuildDepsRequest {
  repo: string;
  token?: string;
  file_path: string;
  target?: string;
}
