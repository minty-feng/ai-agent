import { useState, useEffect } from 'react';
import type { DirEntry } from '../types';

interface FileBrowserProps {
  owner: string;
  repo: string;
  currentPath: string;
  treeCache: Record<string, DirEntry[]>;
  selectedFile: string | null;
  loading: boolean;
  error: string | null;
  onNavigate: (path: string) => void;
  onSelectFile: (path: string) => void;
}

export function FileBrowser({
  owner,
  repo,
  currentPath,
  treeCache,
  selectedFile,
  loading,
  error,
  onNavigate,
  onSelectFile,
}: FileBrowserProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  // Auto-expand root on first load
  useEffect(() => {
    if (treeCache[''] && !expandedDirs.has('')) {
      setExpandedDirs(new Set(['']));
    }
  }, [treeCache]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
        onNavigate(path); // lazy-load
      }
      return next;
    });
  };

  const breadcrumbs = buildBreadcrumbs(owner, repo, currentPath);

  return (
    <div style={{
      width: 300,
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Breadcrumb */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
        fontSize: 11,
        flexShrink: 0,
      }}>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span style={{ color: 'var(--text-muted)' }}>/</span>}
            <span
              onClick={() => crumb.path !== currentPath && onNavigate(crumb.path)}
              style={{
                color: i === breadcrumbs.length - 1 ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: crumb.path !== currentPath ? 'pointer' : 'default',
                fontWeight: i === breadcrumbs.length - 1 ? 700 : 400,
              }}
              onMouseEnter={e => {
                if (crumb.path !== currentPath)
                  (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
              }}
              onMouseLeave={e => {
                if (i < breadcrumbs.length - 1)
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {error && (
          <div style={{ color: 'var(--red)', fontSize: 11, padding: '8px 12px' }}>
            ⚠ {error}
          </div>
        )}
        {loading && !treeCache[''] && (
          <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 12px' }}>
            Loading…
          </div>
        )}
        {treeCache[''] && (
          <DirContents
            entries={treeCache['']}
            depth={0}
            expandedDirs={expandedDirs}
            treeCache={treeCache}
            selectedFile={selectedFile}
            onToggleDir={toggleDir}
            onSelectFile={onSelectFile}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recursive directory renderer
// ---------------------------------------------------------------------------

interface DirContentsProps {
  entries: DirEntry[];
  depth: number;
  expandedDirs: Set<string>;
  treeCache: Record<string, DirEntry[]>;
  selectedFile: string | null;
  onToggleDir: (path: string) => void;
  onSelectFile: (path: string) => void;
}

function DirContents({
  entries,
  depth,
  expandedDirs,
  treeCache,
  selectedFile,
  onToggleDir,
  onSelectFile,
}: DirContentsProps) {
  // Sort: dirs first, then files, both alphabetically
  const sorted = [...entries].sort((a, b) => {
    if (a.entry_type !== b.entry_type) return a.entry_type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {sorted.map(entry =>
        entry.entry_type === 'dir' ? (
          <DirRow
            key={entry.path}
            entry={entry}
            depth={depth}
            expandedDirs={expandedDirs}
            treeCache={treeCache}
            selectedFile={selectedFile}
            onToggleDir={onToggleDir}
            onSelectFile={onSelectFile}
          />
        ) : (
          <FileRow
            key={entry.path}
            entry={entry}
            depth={depth}
            selected={selectedFile === entry.path}
            onSelect={onSelectFile}
          />
        ),
      )}
    </>
  );
}

function DirRow({
  entry,
  depth,
  expandedDirs,
  treeCache,
  selectedFile,
  onToggleDir,
  onSelectFile,
}: Omit<DirContentsProps, 'entries'> & { entry: DirEntry }) {
  const isExpanded = expandedDirs.has(entry.path);
  const children = treeCache[entry.path];

  return (
    <div>
      <div
        onClick={() => onToggleDir(entry.path)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: `3px 12px 3px ${12 + depth * 14}px`,
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          userSelect: 'none',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
      >
        <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 10 }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span style={{ fontSize: 13 }}>📁</span>
        <span style={{ fontSize: 12 }}>{entry.name}</span>
      </div>
      {isExpanded && children && (
        <DirContents
          entries={children}
          depth={depth + 1}
          expandedDirs={expandedDirs}
          treeCache={treeCache}
          selectedFile={selectedFile}
          onToggleDir={onToggleDir}
          onSelectFile={onSelectFile}
        />
      )}
      {isExpanded && !children && (
        <div style={{
          padding: `3px 12px 3px ${12 + (depth + 1) * 14}px`,
          color: 'var(--text-muted)',
          fontSize: 11,
        }}>
          Loading…
        </div>
      )}
    </div>
  );
}

function FileRow({
  entry,
  depth,
  selected,
  onSelect,
}: {
  entry: DirEntry;
  depth: number;
  selected: boolean;
  onSelect: (path: string) => void;
}) {
  const ext = entry.name.split('.').pop() ?? '';
  return (
    <div
      onClick={() => onSelect(entry.path)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: `3px 12px 3px ${12 + depth * 14}px`,
        cursor: 'pointer',
        background: selected ? 'var(--accent-glow)' : '',
        borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent',
      }}
      onMouseEnter={e => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={e => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = '';
      }}
    >
      <span style={{ fontSize: 13 }}>{fileIcon(ext)}</span>
      <span style={{
        fontSize: 12,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: selected ? 'var(--accent)' : 'var(--text-primary)',
      }}>
        {entry.name}
      </span>
      {isBuildFile(entry.name) && (
        <span style={{ fontSize: 9, color: 'var(--yellow)', background: 'rgba(255,204,0,0.1)', padding: '1px 4px', borderRadius: 3 }}>
          BUILD
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildBreadcrumbs(owner: string, repo: string, currentPath: string) {
  const crumbs: { label: string; path: string }[] = [
    { label: `${owner}/${repo}`, path: '' },
  ];
  if (!currentPath) return crumbs;
  const parts = currentPath.split('/');
  let acc = '';
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    crumbs.push({ label: part, path: acc });
  }
  return crumbs;
}

export function isBuildFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === 'cmakelists.txt' || lower === 'build' || lower === 'build.bazel';
}

function fileIcon(ext: string): string {
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '📜', jsx: '⚛️', py: '🐍', go: '🐹',
    rs: '🦀', java: '☕', rb: '💎', php: '🐘', vue: '💚', svelte: '🧡',
    cs: '💜', cpp: '⚙️', cc: '⚙️', cxx: '⚙️', c: '⚙️', h: '📎', hpp: '📎',
    cmake: '🔨',
  };
  if (ext === 'txt') return '📄'; // catches CMakeLists.txt — icon overridden below
  return icons[ext] ?? '📄';
}
