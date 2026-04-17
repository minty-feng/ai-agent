import { useState, useCallback, useRef } from 'react';
import type { LocalTreeEntry, AnalysisResult } from '../types';
import { fetchLocalTree, analyzeLocalRepo, analyzeLocalFiles } from '../api';
import { readTreeFromHandle, collectFilesFromHandle, readFileFromHandle } from './useLocalRepoFS';

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
// Request builder (for backend-path mode only)
// ---------------------------------------------------------------------------

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
// Shared init-checks helper
// ---------------------------------------------------------------------------

function initCheckedDirs(entry: LocalTreeEntry): Set<string> {
  const initialChecked = new Set<string>();
  function walk(e: LocalTreeEntry) {
    if (e.is_dir && e.path !== '') {
      if (!e.suggested_skip) initialChecked.add(e.path);
    }
    for (const c of e.children) walk(c);
  }
  walk(entry);
  return initialChecked;
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

  /** Load tree from an absolute path via the backend. */
  loadTree: (path: string) => Promise<void>;
  /** Load tree from a FileSystemDirectoryHandle (showDirectoryPicker). */
  loadTreeFromHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
  /** Toggle a directory (with cascade to all descendants). */
  toggleDir: (path: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  addExcludePath: (path: string) => void;
  removeExcludePath: (path: string) => void;
  addExcludeExt: (ext: string) => void;
  removeExcludeExt: (ext: string) => void;
  analyze: () => Promise<void>;
  /** Read a single file's content by relative path (FS handle mode only). */
  readFile: (relativePath: string) => Promise<string | null>;
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

  // Store the directory handle for FS-based mode
  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  // ----- Load tree from backend (path mode) -----
  const loadTree = useCallback(async (path: string) => {
    dirHandleRef.current = null; // clear handle mode
    setTreeLoading(true);
    setTreeError(null);
    setTree(null);
    setResult(null);
    setRootPath(path);
    try {
      const entry = await fetchLocalTree(path);
      const dirs = collectAllDirPaths(entry);
      setTree(entry);
      setAllDirPaths(dirs);
      setCheckedDirs(initCheckedDirs(entry));
      setExclusions({ paths: [], extensions: [] });
    } catch (e) {
      setTreeError(e instanceof Error ? e.message : String(e));
    } finally {
      setTreeLoading(false);
    }
  }, []);

  // ----- Load tree from FileSystemDirectoryHandle -----
  const loadTreeFromHandle = useCallback(async (handle: FileSystemDirectoryHandle) => {
    dirHandleRef.current = handle;
    setTreeLoading(true);
    setTreeError(null);
    setTree(null);
    setResult(null);
    setRootPath(handle.name); // display name only (no absolute path)
    try {
      const entry = await readTreeFromHandle(handle);
      const dirs = collectAllDirPaths(entry);
      setTree(entry);
      setAllDirPaths(dirs);
      setCheckedDirs(initCheckedDirs(entry));
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
      if (dirHandleRef.current) {
        // FS handle mode: read file contents client-side and send to backend
        const files = await collectFilesFromHandle(
          dirHandleRef.current,
          checkedDirs,
          exclusions.paths,
          exclusions.extensions,
        );
        if (files.length === 0) {
          throw new Error('No supported source files found with the current selection.');
        }
        const data = await analyzeLocalFiles({ files });
        setResult(data);
      } else {
        // Backend path mode (fallback)
        const req = buildRequest(rootPath, checkedDirs, allDirPaths, exclusions);
        const data = await analyzeLocalRepo(req);
        setResult(data);
      }
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzeLoading(false);
    }
  }, [tree, rootPath, checkedDirs, allDirPaths, exclusions]);

  const readFile = useCallback(async (relativePath: string): Promise<string | null> => {
    if (!dirHandleRef.current) return null;
    try {
      return await readFileFromHandle(dirHandleRef.current, relativePath);
    } catch {
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    dirHandleRef.current = null;
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
    loadTreeFromHandle,
    toggleDir,
    selectAll,
    deselectAll,
    addExcludePath,
    removeExcludePath,
    addExcludeExt,
    removeExcludeExt,
    analyze,
    readFile,
    reset,
  };
}
