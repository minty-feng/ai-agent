import { useState, useCallback } from 'react';
import type { LocalTreeEntry, AnalysisResult } from '../types';
import { fetchLocalTree, analyzeLocalRepo } from '../api';

// ---------------------------------------------------------------------------
// Helpers to traverse the tree
// ---------------------------------------------------------------------------

/** Collect every directory path in the tree (excluding root ""). */
function collectAllDirPaths(entry: LocalTreeEntry): string[] {
  const result: string[] = [];
  function walk(e: LocalTreeEntry) {
    if (e.is_dir && e.path !== '') result.push(e.path);
    for (const child of e.children) walk(child);
  }
  walk(entry);
  return result;
}

/** Collect all descendant directory paths of a given path in the tree. */
function collectDescendantDirPaths(entry: LocalTreeEntry, targetPath: string): string[] {
  function find(e: LocalTreeEntry): string[] | null {
    if (e.path === targetPath) {
      const desc: string[] = [];
      function gather(x: LocalTreeEntry) {
        for (const c of x.children) {
          if (c.is_dir) { desc.push(c.path); gather(c); }
        }
      }
      gather(e);
      return desc;
    }
    for (const c of e.children) {
      const r = find(c);
      if (r !== null) return r;
    }
    return null;
  }
  return find(entry) ?? [];
}

// ---------------------------------------------------------------------------
// Request builder
// ---------------------------------------------------------------------------

/**
 * Build the analysis request from the current checkbox + exclusion state.
 *
 * Strategy: send the *unchecked* dirs as explicit exclude_paths together with
 * the user's manual exclusions.  include_paths is kept empty (= all) so the
 * backend does not need to enumerate every selected dir.
 */
function buildRequest(
  rootPath: string,
  checkedDirs: Set<string>,
  allDirPaths: string[],
  exclusions: { paths: string[]; extensions: string[] },
) {
  const unchecked = allDirPaths.filter(p => !checkedDirs.has(p));
  return {
    path: rootPath,
    include_paths: [] as string[],
    exclude_paths: [...unchecked, ...exclusions.paths],
    exclude_extensions: exclusions.extensions,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface LocalRepoState {
  rootPath: string;
  tree: LocalTreeEntry | null;
  allDirPaths: string[];
  checkedDirs: Set<string>;
  exclusions: { paths: string[]; extensions: string[] };
  treeLoading: boolean;
  treeError: string | null;
  analyzeLoading: boolean;
  analyzeError: string | null;
  result: AnalysisResult | null;

  loadTree: (path: string) => Promise<void>;
  /** Toggle a directory (with cascade to all descendants). */
  toggleDir: (path: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  addExcludePath: (path: string) => void;
  removeExcludePath: (path: string) => void;
  addExcludeExt: (ext: string) => void;
  removeExcludeExt: (ext: string) => void;
  analyze: () => Promise<void>;
  reset: () => void;
}

export function useLocalRepo(): LocalRepoState {
  const [rootPath, setRootPath] = useState('');
  const [tree, setTree] = useState<LocalTreeEntry | null>(null);
  const [allDirPaths, setAllDirPaths] = useState<string[]>([]);
  const [checkedDirs, setCheckedDirs] = useState<Set<string>>(new Set());
  const [exclusions, setExclusions] = useState<{ paths: string[]; extensions: string[] }>({
    paths: [],
    extensions: [],
  });
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const loadTree = useCallback(async (path: string) => {
    setTreeLoading(true);
    setTreeError(null);
    setTree(null);
    setResult(null);
    setRootPath(path);
    try {
      const entry = await fetchLocalTree(path);
      const dirs = collectAllDirPaths(entry);

      // Default: check all dirs EXCEPT suggested-skip ones.
      const initialChecked = new Set<string>();
      function initChecks(e: LocalTreeEntry) {
        if (e.is_dir && e.path !== '') {
          if (!e.suggested_skip) initialChecked.add(e.path);
        }
        // For suggested-skip dirs, still recurse so their children default correctly.
        // But we only add non-suggested-skip dirs.
        for (const c of e.children) initChecks(c);
      }
      initChecks(entry);

      setTree(entry);
      setAllDirPaths(dirs);
      setCheckedDirs(initialChecked);
      setExclusions({ paths: [], extensions: [] });
    } catch (e) {
      setTreeError(e instanceof Error ? e.message : String(e));
    } finally {
      setTreeLoading(false);
    }
  }, []);

  const toggleDir = useCallback((path: string) => {
    setCheckedDirs(prev => {
      if (!tree) return prev;
      const descendants = collectDescendantDirPaths(tree, path);
      const all = [path, ...descendants];
      const isChecked = prev.has(path);
      const next = new Set(prev);
      if (isChecked) {
        all.forEach(p => next.delete(p));
      } else {
        all.forEach(p => next.add(p));
      }
      return next;
    });
  }, [tree]);

  const selectAll = useCallback(() => {
    setCheckedDirs(new Set(allDirPaths));
  }, [allDirPaths]);

  const deselectAll = useCallback(() => {
    setCheckedDirs(new Set());
  }, []);

  const addExcludePath = useCallback((path: string) => {
    const p = path.trim().replace(/^\//, '');
    if (!p) return;
    setExclusions(prev =>
      prev.paths.includes(p) ? prev : { ...prev, paths: [...prev.paths, p] },
    );
  }, []);

  const removeExcludePath = useCallback((path: string) => {
    setExclusions(prev => ({ ...prev, paths: prev.paths.filter(p => p !== path) }));
  }, []);

  const addExcludeExt = useCallback((ext: string) => {
    const e = ext.trim().replace(/^\./, '').toLowerCase();
    if (!e) return;
    setExclusions(prev =>
      prev.extensions.includes(e) ? prev : { ...prev, extensions: [...prev.extensions, e] },
    );
  }, []);

  const removeExcludeExt = useCallback((ext: string) => {
    setExclusions(prev => ({ ...prev, extensions: prev.extensions.filter(e => e !== ext) }));
  }, []);

  const analyze = useCallback(async () => {
    if (!tree) return;
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setResult(null);
    try {
      const req = buildRequest(rootPath, checkedDirs, allDirPaths, exclusions);
      const data = await analyzeLocalRepo(req);
      setResult(data);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzeLoading(false);
    }
  }, [tree, rootPath, checkedDirs, allDirPaths, exclusions]);

  const reset = useCallback(() => {
    setRootPath('');
    setTree(null);
    setAllDirPaths([]);
    setCheckedDirs(new Set());
    setExclusions({ paths: [], extensions: [] });
    setTreeLoading(false);
    setTreeError(null);
    setAnalyzeLoading(false);
    setAnalyzeError(null);
    setResult(null);
  }, []);

  return {
    rootPath,
    tree,
    allDirPaths,
    checkedDirs,
    exclusions,
    treeLoading,
    treeError,
    analyzeLoading,
    analyzeError,
    result,
    loadTree,
    toggleDir,
    selectAll,
    deselectAll,
    addExcludePath,
    removeExcludePath,
    addExcludeExt,
    removeExcludeExt,
    analyze,
    reset,
  };
}
