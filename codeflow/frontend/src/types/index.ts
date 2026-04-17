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
// Local repository types
// ---------------------------------------------------------------------------

export interface LocalTreeEntry {
  name: string;
  /** Relative path from root using '/' separators. Root entry has path "". */
  path: string;
  is_dir: boolean;
  children: LocalTreeEntry[];
  /** Number of analysable source files under this entry (recursive). */
  file_count: number;
  /** True when the backend recommends skipping this directory by default. */
  suggested_skip: boolean;
}

export interface LocalAnalyzeRequest {
  /** Absolute path to the root directory. */
  path: string;
  /** Relative dir paths to include.  Empty = include everything. */
  include_paths: string[];
  /** Relative paths (dirs or files) to always exclude. */
  exclude_paths: string[];
  /** File extensions without leading dot, e.g. "json". */
  exclude_extensions: string[];
}


export interface SourceFileInfo {
  path: string;
  last_modified: string | null;
  language: string;
}

export interface BuildDepsResponse {
  targets: string[];
  /** Subset of targets that are GTest / test targets. */
  test_targets: string[];
  files: SourceFileInfo[];
}

export interface BuildDepsRequest {
  repo: string;
  token?: string;
  file_path: string;
  target?: string;
}

// ---------------------------------------------------------------------------
// GTest analysis types
// ---------------------------------------------------------------------------

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface GtestFileAnalysis {
  path: string;
  language: string;
  commits: CommitInfo[];
  includes: string[];
}

export interface DepEdge {
  from: string;
  to: string;
}

export interface GtestAnalyzeResponse {
  target: string;
  files: GtestFileAnalysis[];
  dep_edges: DepEdge[];
}

export interface GtestAnalyzeRequest {
  repo: string;
  token?: string;
  build_file_path: string;
  target: string;
}

// ---------------------------------------------------------------------------
// Local build deps / gtest types
// ---------------------------------------------------------------------------

export interface LocalBuildDepsRequest {
  root_path: string;
  file_path: string;
  target?: string;
}

export interface LocalGtestAnalyzeRequest {
  root_path: string;
  build_file_path: string;
  target: string;
}

// ---------------------------------------------------------------------------
// File-content based analysis (used with showDirectoryPicker)
// ---------------------------------------------------------------------------

export interface FilePayload {
  path: string;
  content: string;
  size: number;
  language: string;
}

export interface AnalyzeFilesRequest {
  files: FilePayload[];
}
