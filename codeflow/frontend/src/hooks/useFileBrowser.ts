import { useState, useCallback } from 'react';
import type { DirEntry } from '../types';
import { fetchTree } from '../api';

export interface FileBrowserState {
  owner: string;
  repo: string;
  token: string;
  currentPath: string;
  selectedFile: string | null;
  treeCache: Record<string, DirEntry[]>;
  loading: boolean;
  error: string | null;
  init: (owner: string, repo: string, token?: string) => Promise<void>;
  navigateTo: (path: string) => Promise<void>;
  selectFile: (path: string) => void;
  clearSelection: () => void;
}

export function useFileBrowser(): FileBrowserState {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [treeCache, setTreeCache] = useState<Record<string, DirEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPath = useCallback(
    async (ownerVal: string, repoVal: string, tokenVal: string, path: string) => {
      setLoading(true);
      setError(null);
      try {
        const entries = await fetchTree(ownerVal, repoVal, path, tokenVal || undefined);
        setTreeCache(prev => ({ ...prev, [path]: entries }));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const init = useCallback(
    async (ownerVal: string, repoVal: string, tokenVal?: string) => {
      const tok = tokenVal ?? '';
      setOwner(ownerVal);
      setRepo(repoVal);
      setToken(tok);
      setCurrentPath('');
      setSelectedFile(null);
      setTreeCache({});
      await loadPath(ownerVal, repoVal, tok, '');
    },
    [loadPath],
  );

  const navigateTo = useCallback(
    async (path: string) => {
      setCurrentPath(path);
      setSelectedFile(null);
      // Lazy-load only if not already cached
      setTreeCache(prev => {
        if (!prev[path]) {
          loadPath(owner, repo, token, path);
        }
        return prev;
      });
    },
    [owner, repo, token, loadPath],
  );

  const selectFile = useCallback((path: string) => {
    setSelectedFile(path);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return {
    owner,
    repo,
    token,
    currentPath,
    selectedFile,
    treeCache,
    loading,
    error,
    init,
    navigateTo,
    selectFile,
    clearSelection,
  };
}
