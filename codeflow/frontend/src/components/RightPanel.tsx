import { useState } from 'react';
import type { AnalysisResult, GraphNode } from '../types';
import { BuildDepsPanel } from './BuildDepsPanel';
import { GtestPanel } from './GtestPanel';
import { isBuildFile } from './FileBrowser';

interface RightPanelProps {
  result: AnalysisResult | null;
  selectedNode: GraphNode | null;
  // Browse-mode props
  repo?: string;
  token?: string;
  selectedFile?: string | null;
  // Local-mode props
  localRootPath?: string;
  /** Read a file's content from the local FS handle (FS handle mode only). */
  readFile?: (relativePath: string) => Promise<string | null>;
}

type Tab = 'details' | 'security' | 'patterns' | 'builddeps' | 'gtest';

const SEV_COLOR: Record<string, string> = {
  high: '#ff4466',
  medium: '#ffcc00',
  low: '#8888aa',
};

const SEV_BG: Record<string, string> = {
  high: 'rgba(255,68,102,0.1)',
  medium: 'rgba(255,204,0,0.08)',
  low: 'rgba(136,136,170,0.08)',
};

export function RightPanel({ result, selectedNode, repo, token, selectedFile, localRootPath, readFile }: RightPanelProps) {
  const [tab, setTab] = useState<Tab>('details');

  const secCount = result?.security_issues.length ?? 0;
  const patCount = result?.patterns.length ?? 0;

  // Determine if the selected file (from browse or analysis) is a build file
  const browseFile = selectedFile ?? null;
  const analyzeFile = selectedNode?.path ?? null;
  const activeBuildFile = browseFile ?? analyzeFile;
  const buildFileName = activeBuildFile ? activeBuildFile.split('/').pop() ?? '' : '';
  const hasBuildDeps = activeBuildFile !== null && isBuildFile(buildFileName);

  // Auto-switch to build deps tab when a build file is selected
  const [prevBuildFile, setPrevBuildFile] = useState<string | null>(null);
  if (hasBuildDeps && activeBuildFile !== prevBuildFile) {
    setPrevBuildFile(activeBuildFile);
    if (tab !== 'builddeps') setTab('builddeps');
  }
  if (!hasBuildDeps && prevBuildFile !== null) {
    setPrevBuildFile(null);
    if (tab === 'builddeps') setTab('details');
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'security', label: `Security${secCount ? ` (${secCount})` : ''}` },
    { key: 'patterns', label: `Patterns${patCount ? ` (${patCount})` : ''}` },
    ...(hasBuildDeps ? [{ key: 'builddeps' as Tab, label: '🔨 Build Deps' }] : []),
    ...(hasBuildDeps ? [{ key: 'gtest' as Tab, label: '🧪 GTest' }] : []),
  ];

  return (
    <aside style={{
      width: 300,
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: tab === t.key ? 700 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {tab === 'details' && <DetailsTab result={result} selectedNode={selectedNode} />}
        {tab === 'security' && <SecurityTab result={result} />}
        {tab === 'patterns' && <PatternsTab result={result} />}
        {tab === 'builddeps' && (
          <BuildDepsPanel
            repo={repo ?? ''}
            token={token}
            filePath={activeBuildFile}
            localRootPath={localRootPath}
            readFile={readFile}
          />
        )}
        {tab === 'gtest' && (
          <GtestPanel
            repo={repo ?? ''}
            token={token}
            filePath={activeBuildFile}
            localRootPath={localRootPath}
            readFile={readFile}
          />
        )}
      </div>
    </aside>
  );
}

// --- Details Tab ---
function DetailsTab({ result, selectedNode }: { result: AnalysisResult | null; selectedNode: GraphNode | null }) {
  if (!result) {
    return <Placeholder text="No analysis yet" />;
  }
  if (!selectedNode) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 40 }}>
        Click a node in the graph<br />to see file details
      </div>
    );
  }

  const file = result.files.find(f => f.path === selectedNode.path);
  if (!file) return <Placeholder text="File details not available" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 4, wordBreak: 'break-all' }}>
          {file.path.split('/').pop()}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8, wordBreak: 'break-all' }}>
          {file.path}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoChip label="Language" value={file.language} />
          <InfoChip label="Lines" value={file.line_count} />
          <InfoChip label="Blast Radius" value={file.blast_radius} highlight />
          <InfoChip label="Security" value={file.security_count} warn={file.security_count > 0} />
        </div>
      </div>

      {file.dependencies.length > 0 && (
        <Section title={`Dependencies (${file.dependencies.length})`}>
          {file.dependencies.map(dep => (
            <DepItem key={dep} path={dep} />
          ))}
        </Section>
      )}

      {file.functions.length > 0 && (
        <Section title={`Functions (${file.functions.length})`}>
          {file.functions.slice(0, 30).map(fn => (
            <div key={`${fn.name}-${fn.line}`} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '3px 8px', borderRadius: 4,
              color: 'var(--text-secondary)', fontSize: 11,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <span style={{ color: 'var(--text-primary)' }}>{fn.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>:{fn.line}</span>
            </div>
          ))}
          {file.functions.length > 30 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: 4 }}>
              +{file.functions.length - 30} more…
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

// --- Security Tab ---
function SecurityTab({ result }: { result: AnalysisResult | null }) {
  if (!result) return <Placeholder text="No analysis yet" />;
  if (result.security_issues.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <div style={{ color: 'var(--accent)', fontWeight: 700 }}>No security issues found!</div>
      </div>
    );
  }

  const byFile: Record<string, typeof result.security_issues> = {};
  for (const issue of result.security_issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sortedFiles = Object.entries(byFile).sort((a, b) => {
    const aMax = Math.min(...a[1].map(i => severityOrder[i.severity]));
    const bMax = Math.min(...b[1].map(i => severityOrder[i.severity]));
    return aMax - bMax;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SummaryRow result={result} />
      {sortedFiles.map(([file, issues]) => (
        <div key={file}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 6, wordBreak: 'break-all' }}>
            📄 {file}
          </div>
          {issues.map((issue, i) => (
            <div key={i} style={{
              background: SEV_BG[issue.severity],
              border: `1px solid ${SEV_COLOR[issue.severity]}33`,
              borderLeft: `3px solid ${SEV_COLOR[issue.severity]}`,
              borderRadius: 6,
              padding: '8px 10px',
              marginBottom: 6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: SEV_COLOR[issue.severity] }}>
                  {issue.title}
                </span>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 10,
                  background: SEV_COLOR[issue.severity] + '22',
                  color: SEV_COLOR[issue.severity],
                  textTransform: 'uppercase',
                }}>
                  {issue.severity}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>
                {issue.description}
              </div>
              <div style={{
                background: '#0a0a0c', borderRadius: 4, padding: '4px 8px',
                fontFamily: 'monospace', fontSize: 11, color: '#ff8888',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={issue.code_snippet}>
                {issue.code_snippet}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 4 }}>
                line {issue.line}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SummaryRow({ result }: { result: AnalysisResult }) {
  const high = result.security_issues.filter(i => i.severity === 'high').length;
  const medium = result.security_issues.filter(i => i.severity === 'medium').length;
  const low = result.security_issues.filter(i => i.severity === 'low').length;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      {high > 0 && <Badge label={`${high} HIGH`} color="#ff4466" />}
      {medium > 0 && <Badge label={`${medium} MED`} color="#ffcc00" />}
      {low > 0 && <Badge label={`${low} LOW`} color="#8888aa" />}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 10,
      background: color + '22', color, fontWeight: 700,
    }}>{label}</span>
  );
}

// --- Patterns Tab ---
function PatternsTab({ result }: { result: AnalysisResult | null }) {
  if (!result) return <Placeholder text="No analysis yet" />;
  if (result.patterns.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 40 }}>
        No patterns detected
      </div>
    );
  }

  const good = result.patterns.filter(p => p.pattern_type === 'good');
  const anti = result.patterns.filter(p => p.pattern_type === 'anti');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {good.length > 0 && (
        <div>
          <div style={{ color: 'var(--accent)', fontSize: 11, marginBottom: 8, letterSpacing: 1 }}>
            ✅ DESIGN PATTERNS
          </div>
          {good.map(p => <PatternCard key={p.name} pattern={p} />)}
        </div>
      )}
      {anti.length > 0 && (
        <div>
          <div style={{ color: 'var(--red)', fontSize: 11, marginBottom: 8, letterSpacing: 1 }}>
            ⚠️ ANTI-PATTERNS
          </div>
          {anti.map(p => <PatternCard key={p.name} pattern={p} isAnti />)}
        </div>
      )}
    </div>
  );
}

function PatternCard({ pattern, isAnti }: { pattern: { name: string; description: string; files: string[]; icon: string }; isAnti?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = isAnti ? 'var(--red)' : 'var(--accent)';
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${isAnti ? '#ff446633' : '#00ff9d22'}`,
      borderRadius: 6,
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      <div
        style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'flex-start' }}
        onClick={() => setExpanded(v => !v)}
      >
        <span style={{ fontSize: 18 }}>{pattern.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color, marginBottom: 2 }}>{pattern.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{pattern.description}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 3 }}>
            {pattern.files.length} file{pattern.files.length !== 1 ? 's' : ''} — click to {expanded ? 'collapse' : 'expand'}
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '6px 12px' }}>
          {pattern.files.map(f => (
            <div key={f} style={{
              fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title={f}>
              📄 {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Helpers ---
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 6, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function DepItem({ path }: { path: string }) {
  return (
    <div style={{
      padding: '3px 8px', fontSize: 11, color: 'var(--text-secondary)',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
      title={path}
    >
      → {path}
    </div>
  );
}

function InfoChip({ label, value, highlight, warn }: { label: string; value: string | number; highlight?: boolean; warn?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', borderRadius: 6, padding: '6px 10px',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{
        fontWeight: 700, fontSize: 14,
        color: warn ? 'var(--red)' : highlight ? 'var(--yellow)' : 'var(--accent)',
      }}>{value}</div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 40 }}>
      {text}
    </div>
  );
}
