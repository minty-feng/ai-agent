import { useState, useEffect } from 'react';
import type { CommitInfo, DepEdge, GtestFileAnalysis } from '../types';
import { fetchBuildDeps, fetchGtestAnalysis } from '../api';
import { isBuildFile } from './FileBrowser';

interface GtestPanelProps {
  repo: string;
  token?: string;
  filePath: string | null;
}

export function GtestPanel({ repo, token, filePath }: GtestPanelProps) {
  const fileName = filePath ? filePath.split('/').pop() ?? '' : '';
  const isBuild = filePath !== null && isBuildFile(fileName);

  const [testTargets, setTestTargets] = useState<string[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetsError, setTargetsError] = useState<string | null>(null);

  const [selectedTarget, setSelectedTarget] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [files, setFiles] = useState<GtestFileAnalysis[]>([]);
  const [depEdges, setDepEdges] = useState<DepEdge[]>([]);

  // Load test targets when build file changes
  useEffect(() => {
    if (!isBuild || !filePath || !repo) {
      setTestTargets([]);
      setSelectedTarget('');
      setFiles([]);
      setDepEdges([]);
      return;
    }
    setTargetsLoading(true);
    setTargetsError(null);
    setTestTargets([]);
    setSelectedTarget('');
    setFiles([]);
    setDepEdges([]);
    fetchBuildDeps({ repo, token, file_path: filePath })
      .then(data => {
        setTargetsLoading(false);
        setTestTargets(data.test_targets);
      })
      .catch(e => {
        setTargetsLoading(false);
        setTargetsError(e instanceof Error ? e.message : String(e));
      });
  }, [filePath, repo, token, isBuild]);

  // Run GTest analysis when target is selected
  const handleSelectTarget = (target: string) => {
    setSelectedTarget(target);
    setFiles([]);
    setDepEdges([]);
    setAnalysisError(null);
    if (!target || !filePath || !repo) return;
    setAnalysisLoading(true);
    fetchGtestAnalysis({ repo, token, build_file_path: filePath, target })
      .then(data => {
        setAnalysisLoading(false);
        setFiles(data.files);
        setDepEdges(data.dep_edges);
      })
      .catch(e => {
        setAnalysisLoading(false);
        setAnalysisError(e instanceof Error ? e.message : String(e));
      });
  };

  if (!isBuild) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 40, padding: '0 16px' }}>
        Select a <code style={{ color: 'var(--accent)' }}>CMakeLists.txt</code> or{' '}
        <code style={{ color: 'var(--accent)' }}>BUILD</code> file to inspect GTest targets
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* File header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 6,
        padding: '8px 12px',
        borderLeft: '3px solid #00bfff',
      }}>
        <div style={{ color: '#00bfff', fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
          🧪 {fileName}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, wordBreak: 'break-all' }}>
          {filePath}
        </div>
      </div>

      {/* Loading targets */}
      {targetsLoading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
          Scanning for GTest targets…
        </div>
      )}

      {/* Error loading targets */}
      {targetsError && <ErrorBox message={targetsError} />}

      {/* No test targets found */}
      {!targetsLoading && !targetsError && testTargets.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          No GTest / cc_test targets found in this build file
        </div>
      )}

      {/* Target selector */}
      {testTargets.length > 0 && (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>
            TEST TARGET
          </div>
          <select
            value={selectedTarget}
            onChange={e => handleSelectTarget(e.target.value)}
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
            <option value="">— Select a test target —</option>
            {testTargets.map(t => (
              <option key={t} value={t}>🧪 {t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Analysis loading */}
      {analysisLoading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 8 }}>
          Fetching source files and commit history…
        </div>
      )}

      {/* Analysis error */}
      {analysisError && <ErrorBox message={analysisError} />}

      {/* Dependency graph */}
      {!analysisLoading && depEdges.length > 0 && (
        <DepGraph edges={depEdges} />
      )}

      {/* File list with commits + includes */}
      {!analysisLoading && files.length > 0 && (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>
            SOURCE FILES ({files.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {files.map(f => (
              <GtestFileCard key={f.path} file={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dependency graph (simple text representation)
// ---------------------------------------------------------------------------

function DepGraph({ edges }: { edges: DepEdge[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 6,
      overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        <span style={{ color: '#00bfff', fontWeight: 700, fontSize: 12 }}>
          🔗 File Dependencies ({edges.length})
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '6px 12px' }}>
          {edges.map((e, i) => (
            <div key={i} style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              padding: '3px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflow: 'hidden',
            }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>
                {e.from.split('/').pop()}
              </span>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>→</span>
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--text-secondary)',
              }} title={e.to}>
                {e.to.split('/').pop()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single file card
// ---------------------------------------------------------------------------

const LANG_ICON: Record<string, string> = {
  cpp: '⚙️',
  c: '⚙️',
  python: '🐍',
  unknown: '📄',
};

function GtestFileCard({ file }: { file: GtestFileAnalysis }) {
  const [showCommits, setShowCommits] = useState(false);
  const [showIncludes, setShowIncludes] = useState(false);

  const name = file.path.split('/').pop() ?? file.path;
  const latestDate = file.commits[0]?.date ?? null;
  const { label, color } = formatAge(latestDate);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 6,
      overflow: 'hidden',
      borderLeft: `3px solid ${color}`,
    }}>
      {/* Header row */}
      <div style={{ padding: '8px 10px' }}>
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

        {/* Toggle buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {file.commits.length > 0 && (
            <button
              onClick={() => setShowCommits(v => !v)}
              style={toggleBtnStyle}
            >
              📝 {file.commits.length} commit{file.commits.length !== 1 ? 's' : ''}
              {showCommits ? ' ▲' : ' ▼'}
            </button>
          )}
          {file.includes.length > 0 && (
            <button
              onClick={() => setShowIncludes(v => !v)}
              style={toggleBtnStyle}
            >
              📎 {file.includes.length} include{file.includes.length !== 1 ? 's' : ''}
              {showIncludes ? ' ▲' : ' ▼'}
            </button>
          )}
        </div>
      </div>

      {/* Commit history */}
      {showCommits && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '6px 10px' }}>
          {file.commits.map((c, i) => (
            <CommitRow key={i} commit={c} />
          ))}
        </div>
      )}

      {/* Includes */}
      {showIncludes && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '6px 10px' }}>
          {file.includes.map((inc, i) => (
            <div key={i} style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              padding: '2px 0',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }} title={inc}>
              #include "{inc}"
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const toggleBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text-muted)',
  fontSize: 10,
  padding: '2px 6px',
  cursor: 'pointer',
};

function CommitRow({ commit }: { commit: CommitInfo }) {
  const { label, color } = formatAge(commit.date);
  return (
    <div style={{
      padding: '4px 0',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
        <span style={{
          fontSize: 10,
          fontFamily: 'monospace',
          color: '#00bfff',
          background: '#00bfff18',
          padding: '1px 5px',
          borderRadius: 4,
          flexShrink: 0,
        }}>
          {commit.sha}
        </span>
        <span style={{ fontSize: 10, color, whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }} title={commit.message}>
        {commit.message || '(no message)'}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        {commit.author}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      background: 'rgba(255,68,102,0.1)',
      border: '1px solid #ff446655',
      color: 'var(--red)',
      borderRadius: 6,
      padding: '8px 12px',
      fontSize: 11,
    }}>
      ⚠ {message}
    </div>
  );
}

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
