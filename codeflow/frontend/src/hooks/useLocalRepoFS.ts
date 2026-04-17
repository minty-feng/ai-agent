/**
 * Client-side local repository reading via the File System Access API.
 *
 * This module reads the directory tree and file contents entirely in the
 * browser using a `FileSystemDirectoryHandle` obtained from
 * `window.showDirectoryPicker()`.  No backend filesystem path is needed.
 */
import type { LocalTreeEntry, FilePayload } from '../types';

// ---------------------------------------------------------------------------
// Constants (mirrors backend local.rs)
// ---------------------------------------------------------------------------

const ALWAYS_SKIP = new Set(['.git', '.hg', '.svn']);

const SUGGESTED_SKIP = new Set([
  'node_modules', 'target', 'dist', 'build', 'vendor', '.next',
  'coverage', '__pycache__', '.cache', '.idea', '.vscode',
  '.mypy_cache', '.pytest_cache',
]);

const MAX_TREE_DEPTH = 10;
const MAX_FILE_SIZE = 200_000; // bytes

// ---------------------------------------------------------------------------
// Language detection (mirrors backend local.rs)
// ---------------------------------------------------------------------------

function detectLanguage(name: string): string | null {
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : null;
  if (!ext) return null;
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', go: 'go', rs: 'rust',
    java: 'java', rb: 'ruby', php: 'php',
    vue: 'vue', svelte: 'svelte', cs: 'csharp',
    cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'cpp', h: 'cpp', hpp: 'cpp',
  };
  return map[ext] ?? null;
}

function languageLabel(name: string): string {
  const lang = detectLanguage(name);
  if (lang) return lang;
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : null;
  return ext && ext !== name.toLowerCase() ? ext : 'unknown';
}

// ---------------------------------------------------------------------------
// Read directory tree from FileSystemDirectoryHandle → LocalTreeEntry
// ---------------------------------------------------------------------------

export async function readTreeFromHandle(
  handle: FileSystemDirectoryHandle,
  relPath = '',
  depth = 0,
): Promise<LocalTreeEntry> {
  const children: LocalTreeEntry[] = [];
  let fileCount = 0;

  if (depth < MAX_TREE_DEPTH) {
    // Collect and sort entries
    const entries: (FileSystemFileHandle | FileSystemDirectoryHandle)[] = [];
    for await (const entry of handle.values()) {
      entries.push(entry);
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const childRel = relPath ? `${relPath}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        if (ALWAYS_SKIP.has(entry.name)) continue;
        const suggested = SUGGESTED_SKIP.has(entry.name);
        const childEntry = await readTreeFromHandle(
          entry as FileSystemDirectoryHandle,
          childRel,
          depth + 1,
        );
        fileCount += childEntry.file_count;
        children.push({ ...childEntry, suggested_skip: suggested });
      } else {
        fileCount += 1;
        children.push({
          name: entry.name,
          path: childRel,
          is_dir: false,
          children: [],
          file_count: 1,
          suggested_skip: false,
        });
      }
    }
  }

  return {
    name: handle.name,
    path: relPath,
    is_dir: true,
    children,
    file_count: fileCount,
    suggested_skip: SUGGESTED_SKIP.has(handle.name),
  };
}

// ---------------------------------------------------------------------------
// Collect file contents from handle for analysis
// ---------------------------------------------------------------------------

export async function collectFilesFromHandle(
  handle: FileSystemDirectoryHandle,
  checkedDirs: Set<string>,
  excludePaths: string[],
  excludeExtensions: string[],
): Promise<FilePayload[]> {
  const normExclPaths = excludePaths.map(p => p.replace(/^\/|\/$/g, ''));
  const normExclExts = excludeExtensions.map(e => e.replace(/^\./, '').toLowerCase());
  const files: FilePayload[] = [];

  async function walk(dir: FileSystemDirectoryHandle, relPath: string) {
    for await (const entry of dir.values()) {
      const childRel = relPath ? `${relPath}/${entry.name}` : entry.name;

      // Check exclusion
      if (normExclPaths.some(ex => childRel === ex || childRel.startsWith(`${ex}/`))) {
        continue;
      }

      if (entry.kind === 'directory') {
        if (ALWAYS_SKIP.has(entry.name)) continue;
        // Only descend into checked dirs (or root level)
        if (!checkedDirs.has(childRel)) continue;
        await walk(entry as FileSystemDirectoryHandle, childRel);
      } else {
        // File
        const ext = entry.name.includes('.')
          ? entry.name.split('.').pop()?.toLowerCase() ?? ''
          : '';
        if (ext && normExclExts.includes(ext)) continue;

        try {
          const fileObj = await (entry as FileSystemFileHandle).getFile();
          if (fileObj.size > MAX_FILE_SIZE) continue;
          const content = await fileObj.text();
          const lang = languageLabel(entry.name);
          files.push({
            path: childRel.replace(/\\/g, '/'),
            content,
            size: fileObj.size,
            language: lang,
          });
        } catch {
          // Skip files that can't be read (e.g. binary)
        }
      }
    }
  }

  await walk(handle, '');
  return files;
}
