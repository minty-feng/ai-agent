import { useState } from 'react';
import type { LocalTreeEntry } from '../types';
import { isBuildFile } from './FileBrowser';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LocalRepoBrowserProps {
  rootPath: string;
  tree: LocalTreeEntry;
  checkedDirs: Set<string>;
  exclusions: { paths: string[]; extensions: string[] };
  analyzeLoading: boolean;
  analyzeError: string | null;
  onToggleDir: (path: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAddExcludePath: (path: string) => void;
  onRemoveExcludePath: (path: string) => void;
  onAddExcludeExt: (ext: string) => void;
  onRemoveExcludeExt: (ext: string) => void;
  onAnalyze: () => void;
  onSelectBuildFile?: (path: string | null) => void;
  selectedBuildFile?: string | null;
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export function LocalRepoBrowser({
  rootPath,
  tree,
  checkedDirs,
  exclusions,
  analyzeLoading,
  analyzeError,
  onToggleDir,
  onSelectAll,
  onDeselectAll,
  onAddExcludePath,
  onRemoveExcludePath,
  onAddExcludeExt,
  onRemoveExcludeExt,
  onAnalyze,
  onSelectBuildFile,
  selectedBuildFile,
}: LocalRepoBrowserProps) {
  const [showExclusions, setShowExclusions] = useState(true);
  const [newExcludePath, setNewExcludePath] = useState('');
  const [newExcludeExt, setNewExcludeExt] = useState('');

  const checkedCount = checkedDirs.size;
  const totalDirs = countAllDirs(tree);

  const handleAddPath = () => {
    if (newExcludePath.trim()) {
      onAddExcludePath(newExcludePath.trim());
      setNewExcludePath('');
    }
  };

  const handleAddExt = () => {
    if (newExcludeExt.trim()) {
      onAddExcludeExt(newExcludeExt.trim());
      setNewExcludeExt('');
    }
  };

  return (
    <div style={{
      width: 320,
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: 0.5 }}>
            📂 LOCAL REPOSITORY
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniBtn onClick={onSelectAll} title="Select all">✓ All</MiniBtn>
            <MiniBtn onClick={onDeselectAll} title="Deselect all">✗ None</MiniBtn>
          </div>
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }} title={rootPath}>
          {rootPath}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
          {checkedCount} / {totalDirs} dirs selected
        </div>
      </div>

      {/* Directory tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
        {tree.children.length === 0 ? (
          <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>
            No entries found.
          </div>
        ) : (
          tree.children.map(child =>
            child.is_dir ? (
              <DirRow
                key={child.path}
                entry={child}
                depth={0}
                checkedDirs={checkedDirs}
                exclusions={exclusions}
                onToggle={onToggleDir}
                onSelectBuildFile={onSelectBuildFile}
                selectedBuildFile={selectedBuildFile}
              />
            ) : (
              <FileRow key={child.path} entry={child} depth={0} onSelectBuildFile={onSelectBuildFile} selectedBuildFile={selectedBuildFile} />
            ),
          )
        )}
      </div>

      {/* Exclusions panel */}
      <div style={{
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        maxHeight: showExclusions ? 260 : 36,
        overflow: 'hidden',
        transition: 'max-height 0.2s ease',
      }}>
        <button
          type="button"
          onClick={() => setShowExclusions(v => !v)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>
            {showExclusions ? '▼' : '▶'}
          </span>
          🚫 EXCLUSIONS
          {(exclusions.paths.length + exclusions.extensions.length) > 0 && (
            <span style={{
              background: 'var(--accent)',
              color: '#000',
              borderRadius: 8,
              padding: '0 5px',
              fontSize: 10,
              fontWeight: 700,
            }}>
              {exclusions.paths.length + exclusions.extensions.length}
            </span>
          )}
        </button>

        {showExclusions && (
          <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Path exclusions */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.5 }}>
                EXCLUDED PATHS
              </div>
              {exclusions.paths.map(p => (
                <ExclusionTag key={p} label={p} onRemove={() => onRemoveExcludePath(p)} />
              ))}
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <input
                  value={newExcludePath}
                  onChange={e => setNewExcludePath(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddPath()}
                  placeholder="e.g. data/raw"
                  style={inputStyle}
                />
                <AddBtn onClick={handleAddPath} />
              </div>
            </div>

            {/* Extension exclusions */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 0.5 }}>
                EXCLUDED EXTENSIONS
              </div>
              {exclusions.extensions.map(e => (
                <ExclusionTag key={e} label={`.${e}`} onRemove={() => onRemoveExcludeExt(e)} />
              ))}
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <input
                  value={newExcludeExt}
                  onChange={e => setNewExcludeExt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddExt()}
                  placeholder="e.g. json"
                  style={inputStyle}
                />
                <AddBtn onClick={handleAddExt} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analyze button */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {analyzeError && (
          <div style={{
            fontSize: 11,
            color: '#ff4466',
            marginBottom: 6,
            background: 'rgba(255,68,102,0.08)',
            padding: '4px 8px',
            borderRadius: 4,
          }}>
            ⚠ {analyzeError}
          </div>
        )}
        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzeLoading || checkedCount === 0}
          style={{
            width: '100%',
            padding: '8px',
            background: analyzeLoading || checkedCount === 0 ? 'var(--bg-surface)' : 'var(--accent)',
            color: analyzeLoading || checkedCount === 0 ? 'var(--text-muted)' : '#000',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 13,
            cursor: analyzeLoading || checkedCount === 0 ? 'not-allowed' : 'pointer',
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {analyzeLoading ? (
            <><Spinner /> Analyzing…</>
          ) : (
            '⚡ Analyze Selected'
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DirRow – a single directory row with checkbox + expand/collapse
// ---------------------------------------------------------------------------

interface DirRowProps {
  entry: LocalTreeEntry;
  depth: number;
  checkedDirs: Set<string>;
  exclusions: { paths: string[]; extensions: string[] };
  onToggle: (path: string) => void;
  onSelectBuildFile?: (path: string | null) => void;
  selectedBuildFile?: string | null;
}

function isPathExcluded(path: string, excludePaths: string[]): boolean {
  return excludePaths.some(ex => {
    const e = ex.trim().replace(/^\//, '');
    return path === e || path.startsWith(e + '/');
  });
}

function getCheckState(
  entry: LocalTreeEntry,
  checkedDirs: Set<string>,
): 'checked' | 'unchecked' | 'indeterminate' {
  const dirChildren = entry.children.filter(c => c.is_dir);
  if (dirChildren.length === 0) {
    return checkedDirs.has(entry.path) ? 'checked' : 'unchecked';
  }
  const checkedChildren = dirChildren.filter(c => checkedDirs.has(c.path));
  if (checkedChildren.length === 0 && !checkedDirs.has(entry.path)) return 'unchecked';
  if (checkedChildren.length === dirChildren.length && checkedDirs.has(entry.path)) return 'checked';
  return 'indeterminate';
}

function DirRow({ entry, depth, checkedDirs, exclusions, onToggle, onSelectBuildFile, selectedBuildFile }: DirRowProps) {
  const [expanded, setExpanded] = useState(depth === 0);

  const excluded = isPathExcluded(entry.path, exclusions.paths);
  const checkState = getCheckState(entry, checkedDirs);
  const isChecked = checkedDirs.has(entry.path);

  const hasChildren = entry.children.length > 0;

  const rowColor = excluded
    ? 'var(--text-muted)'
    : entry.suggested_skip && !isChecked
    ? 'var(--text-muted)'
    : 'var(--text-secondary)';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `3px 8px 3px ${8 + depth * 14}px`,
          opacity: excluded ? 0.45 : 1,
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '')}
      >
        {/* Expand/collapse */}
        <button
          type="button"
          onClick={() => hasChildren && setExpanded(v => !v)}
          style={{
            width: 14,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 9,
            padding: 0,
            cursor: hasChildren ? 'pointer' : 'default',
            flexShrink: 0,
          }}
        >
          {hasChildren ? (expanded ? '▼' : '▶') : ''}
        </button>

        {/* Checkbox */}
        <CheckBox
          state={excluded ? 'unchecked' : checkState}
          disabled={excluded}
          onChange={() => !excluded && onToggle(entry.path)}
        />

        {/* Icon + name */}
        <span style={{ fontSize: 12 }}>📁</span>
        <span
          onClick={() => hasChildren && setExpanded(v => !v)}
          style={{
            fontSize: 12,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: rowColor,
            cursor: hasChildren ? 'pointer' : 'default',
            userSelect: 'none',
          }}
        >
          {entry.name}
        </span>

        {/* File count badge */}
        {entry.file_count > 0 && (
          <span style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            background: 'var(--bg-surface)',
            padding: '1px 4px',
            borderRadius: 4,
            flexShrink: 0,
          }}>
            {entry.file_count}
          </span>
        )}

        {/* Excluded badge */}
        {excluded && (
          <span style={{
            fontSize: 9,
            color: '#ff4466',
            background: 'rgba(255,68,102,0.1)',
            padding: '1px 4px',
            borderRadius: 4,
            flexShrink: 0,
          }}>
            excluded
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && entry.children.length > 0 && (
        <div>
          {entry.children.map(child =>
            child.is_dir ? (
              <DirRow
                key={child.path}
                entry={child}
                depth={depth + 1}
                checkedDirs={checkedDirs}
                exclusions={exclusions}
                onToggle={onToggle}
                onSelectBuildFile={onSelectBuildFile}
                selectedBuildFile={selectedBuildFile}
              />
            ) : (
              <FileRow key={child.path} entry={child} depth={depth + 1} onSelectBuildFile={onSelectBuildFile} selectedBuildFile={selectedBuildFile} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FileRow – a single file leaf node (read-only, no checkbox)
// ---------------------------------------------------------------------------

function fileIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower === 'build.bazel' || lower === 'build' || lower.endsWith('.bzl')) return '🔧';
  if (lower === 'cmakelists.txt' || lower.endsWith('.cmake')) return '🔧';
  if (lower === 'makefile' || lower === 'gnumakefile') return '🔧';
  if (lower.endsWith('.json') || lower.endsWith('.yaml') || lower.endsWith('.yml') || lower.endsWith('.toml')) return '⚙️';
  if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.rst')) return '📝';
  return '📄';
}

function FileRow({ entry, depth, onSelectBuildFile, selectedBuildFile }: { entry: LocalTreeEntry; depth: number; onSelectBuildFile?: (path: string | null) => void; selectedBuildFile?: string | null }) {
  const isBuild = isBuildFile(entry.name);
  const isSelected = selectedBuildFile === entry.path;

  const handleClick = () => {
    if (isBuild && onSelectBuildFile) {
      onSelectBuildFile(isSelected ? null : entry.path);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: `2px 8px 2px ${8 + depth * 14 + 14 + 4}px`, // align with dir names (skip expand btn width)
        cursor: isBuild ? 'pointer' : 'default',
        background: isSelected ? 'var(--accent-glow)' : '',
        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <span style={{ fontSize: 11 }}>{fileIcon(entry.name)}</span>
      <span
        style={{
          fontSize: 12,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isSelected ? 'var(--accent)' : isBuild ? 'var(--text-secondary)' : 'var(--text-muted)',
          fontWeight: isBuild ? 600 : 400,
          userSelect: 'none',
        }}
        title={entry.path}
      >
        {entry.name}
      </span>
      {isBuild && (
        <span style={{
          fontSize: 9,
          color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
          background: isSelected ? 'var(--accent-glow)' : 'var(--bg-surface)',
          padding: '1px 4px',
          borderRadius: 4,
          flexShrink: 0,
        }}>
          build
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CheckBox
// ---------------------------------------------------------------------------

function CheckBox({
  state,
  disabled,
  onChange,
}: {
  state: 'checked' | 'unchecked' | 'indeterminate';
  disabled: boolean;
  onChange: () => void;
}) {
  const bg =
    disabled
      ? 'var(--bg-surface)'
      : state === 'checked'
      ? 'var(--accent)'
      : state === 'indeterminate'
      ? 'var(--accent-glow)'
      : 'var(--bg-surface)';

  const border =
    disabled
      ? '1.5px solid var(--border)'
      : state === 'unchecked'
      ? '1.5px solid var(--border)'
      : '1.5px solid var(--accent)';

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      title={disabled ? 'Excluded via exclusion rules' : undefined}
      style={{
        width: 14,
        height: 14,
        background: bg,
        border,
        borderRadius: 3,
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#000',
        fontSize: 9,
        fontWeight: 700,
      }}
    >
      {state === 'checked' ? '✓' : state === 'indeterminate' ? '−' : ''}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ExclusionTag
// ---------------------------------------------------------------------------

function ExclusionTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'rgba(255,68,102,0.1)',
      border: '1px solid rgba(255,68,102,0.3)',
      borderRadius: 4,
      padding: '2px 6px',
      fontSize: 11,
      color: '#ff4466',
      marginRight: 4,
      marginBottom: 4,
    }}>
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: '#ff4466',
          fontSize: 12,
          padding: 0,
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function MiniBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        color: 'var(--text-secondary)',
        fontSize: 10,
        padding: '2px 6px',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--accent)',
        border: 'none',
        borderRadius: 4,
        color: '#000',
        fontSize: 13,
        padding: '0 8px',
        cursor: 'pointer',
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      +
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text-primary)',
  padding: '4px 8px',
  fontSize: 11,
  outline: 'none',
};

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 11,
      height: 11,
      border: '2px solid var(--text-muted)',
      borderTopColor: '#000',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function countAllDirs(entry: LocalTreeEntry): number {
  let count = 0;
  function walk(e: LocalTreeEntry) {
    if (e.is_dir && e.path !== '') count++;
    for (const c of e.children) walk(c);
  }
  walk(entry);
  return count;
}
