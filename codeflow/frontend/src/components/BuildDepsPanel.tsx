import { useState, useEffect } from 'react';
import type { SourceFileInfo } from '../types';
import { fetchBuildDeps } from '../api';
import { isBuildFile } from './FileBrowser';

interface BuildDepsPanelProps {
  repo: string;
  token?: string;
  filePath: string | null;
}

const LANG_ICON: Record<string, string> = {
  cpp: '⚙️',
  c: '⚙️',
  python: '🐍',
  unknown: '📄',
};

export function BuildDepsPanel({ repo, token, filePath }: BuildDepsPanelProps) {
  const [state, setState] = useState<{
    targets: string[];
    files: SourceFileInfo[];
    loading: boolean;
    error: string | null;
    selectedTarget: string;
  }>({
    targets: [],
    files: [],
    loading: false,
    error: null,
    selectedTarget: '',
  });

  const fileName = filePath ? filePath.split('/').pop() ?? '' : '';
  const isBuild = filePath !== null && isBuildFile(fileName);

  // Reset when file changes
  useEffect(() => {
    if (!isBuild || !filePath || !repo) return;
    setState(s => ({ ...s, loading: true, error: null, targets: [], files: [], selectedTarget: '' }));
    fetchBuildDeps({ repo, token, file_path: filePath })
      .then(data => setState(s => ({
        ...s,
        loading: false,
        targets: data.targets,
        files: data.files,
        selectedTarget: '',
      })))
      .catch(e => setState(s => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      })));
  }, [filePath, repo, token, isBuild]);

  // Re-fetch when target changes
  const handleTargetChange = (target: string) => {
    if (!filePath || !repo) return;
    setState(s => ({ ...s, selectedTarget: target, loading: true, error: null, files: [] }));
    fetchBuildDeps({ repo, token, file_path: filePath, target: target || undefined })
      .then(data => setState(s => ({
        ...s,
        loading: false,
        files: data.files,
      })))
      .catch(e => setState(s => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      })));
  };

  if (!isBuild) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 40, padding: '0 16px' }}>
        Select a <code style={{ color: 'var(--accent)' }}>CMakeLists.txt</code> or{' '}
        <code style={{ color: 'var(--accent)' }}>BUILD</code> file to inspect build dependencies
      </div>
    );
  }

  const { targets, files, loading, error, selectedTarget } = state;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* File header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 6,
        padding: '8px 12px',
        borderLeft: '3px solid var(--yellow)',
      }}>
        <div style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
          🔨 {fileName}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, wordBreak: 'break-all' }}>
          {filePath}
        </div>
      </div>

      {/* Target selector */}
      {targets.length > 0 && (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>
            TARGET
          </div>
          <select
            value={selectedTarget}
            onChange={e => handleTargetChange(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              padding: '6px 10px',
              fontSize: 12,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">— All targets —</option>
            {targets.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(255,68,102,0.1)',
          border: '1px solid #ff446655',
          color: 'var(--red)',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 11,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 8 }}>
          <LoadingDots />
        </div>
      )}

      {/* Source files table */}
      {!loading && files.length > 0 && (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>
            SOURCE FILES ({files.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {files.map(f => (
              <SourceRow key={f.path} file={f} />
            ))}
          </div>
        </div>
      )}

      {!loading && !error && files.length === 0 && targets.length > 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          No .cpp / .py sources found for this target
        </div>
      )}

      {!loading && !error && targets.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          No targets found in this file
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source file row
// ---------------------------------------------------------------------------

function SourceRow({ file }: { file: SourceFileInfo }) {
  const name = file.path.split('/').pop() ?? file.path;
  const { label, color } = formatAge(file.last_modified);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 6,
      padding: '8px 10px',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>{LANG_ICON[file.language] ?? '📄'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{name}</span>
        </span>
        <span style={{
          fontSize: 10,
          color,
          background: `${color}22`,
          padding: '2px 6px',
          borderRadius: 10,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }} title={file.path}>
        {file.path}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAge(isoDate: string | null): { label: string; color: string } {
  if (!isoDate) return { label: 'unknown', color: 'var(--text-muted)' };
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffH = diffMs / (1000 * 3600);
  const diffD = diffH / 24;

  if (diffH < 1) return { label: '< 1h ago', color: '#00ff9d' };
  if (diffH < 24) return { label: `${Math.round(diffH)}h ago`, color: '#00ff9d' };
  if (diffD < 7) return { label: `${Math.round(diffD)}d ago`, color: '#ffcc00' };
  if (diffD < 30) return { label: `${Math.round(diffD / 7)}w ago`, color: '#ffcc00' };
  if (diffD < 365) return { label: `${Math.round(diffD / 30)}mo ago`, color: '#ff8800' };
  return { label: `${Math.round(diffD / 365)}y ago`, color: '#8888aa' };
}

function LoadingDots() {
  return <span>Fetching commit times…</span>;
}
