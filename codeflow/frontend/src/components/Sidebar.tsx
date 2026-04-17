import { useState } from 'react';
import type { AnalysisResult, GraphNode } from '../types';

interface SidebarProps {
  result: AnalysisResult | null;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#00ff9d', B: '#88ff44', C: '#ffcc00', D: '#ff8800', F: '#ff4466',
};

const LANG_COLORS: Record<string, string> = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab',
  go: '#00add8', rust: '#ce422b', java: '#b07219', ruby: '#cc342d',
  php: '#777bb4', vue: '#41b883', svelte: '#ff3e00', csharp: '#68217a',
  cpp: '#f34b7d', c: '#555555',
};

export function Sidebar({ result, selectedNode, onSelectNode }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [langsCollapsed, setLangsCollapsed] = useState(false);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  if (!result) {
    return (
      <aside style={sidebarStyle}>
        <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>
          Enter a repository to analyze
        </div>
      </aside>
    );
  }

  const { health_score, stats } = result;
  const grade = health_score.grade;
  const gradeColor = GRADE_COLORS[grade] || '#888';

  // Build file tree
  const tree = buildTree(result.files.map(f => f.path));

  return (
    <aside style={sidebarStyle}>
      {/* Health Score Ring */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <HealthRing score={health_score.score} grade={grade} color={gradeColor} />
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>
              HEALTH SCORE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <StatLine label="Circular deps" value={health_score.circular_deps} warn={health_score.circular_deps > 0} />
              <StatLine label="Security (high)" value={health_score.high_security} warn={health_score.high_security > 0} />
              <StatLine label="Anti-patterns" value={health_score.anti_patterns} warn={health_score.anti_patterns > 0} />
              <StatLine label="Avg coupling" value={health_score.avg_coupling.toFixed(1)} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Files" value={stats.file_count} />
        <StatCard label="Lines" value={stats.total_lines.toLocaleString()} />
        <StatCard label="Circular" value={stats.circular_deps} warn={stats.circular_deps > 0} />
        <StatCard label="Security" value={result.security_issues.length} warn={result.security_issues.length > 0} />
      </div>

      {/* Languages (collapsible) */}
      <div style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div
          onClick={() => setLangsCollapsed(v => !v)}
          style={{
            padding: '10px 12px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>
            LANGUAGES ({Object.keys(stats.languages).length})
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{langsCollapsed ? '▶' : '▼'}</span>
        </div>
        {!langsCollapsed && (
          <div style={{ padding: '0 12px 10px', maxHeight: 120, overflowY: 'auto' }}>
            {Object.entries(stats.languages).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
              <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: LANG_COLORS[lang] || '#888',
                }} />
                <span style={{ color: 'var(--text-secondary)', flex: 1, fontSize: 12 }}>{lang}</span>
                <span style={{ color: 'var(--text-primary)' }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 0' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1, padding: '0 12px 8px' }}>FILES</div>
        <TreeNode
          node={tree}
          depth={0}
          expandedFolders={expandedFolders}
          onToggle={toggleFolder}
          selectedPath={selectedNode?.path || null}
          onSelectFile={(path) => {
            const node = result.graph.nodes.find(n => n.path === path);
            onSelectNode(node || null);
          }}
        />
      </div>
    </aside>
  );
}

// --- Health ring ---
function HealthRing({ score, grade, color }: { score: number; grade: string; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{grade}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{score}</div>
      </div>
    </div>
  );
}

function StatLine({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ color: warn ? 'var(--red)' : 'var(--text-secondary)' }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 6,
      padding: '8px 10px',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ color: warn ? 'var(--red)' : 'var(--accent)', fontWeight: 700, fontSize: 16 }}>{value}</div>
    </div>
  );
}

// --- File tree ---
interface TreeData {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeData[];
}

function buildTree(paths: string[]): TreeData {
  const root: TreeData = { name: '', path: '', isDir: true, children: [] };
  for (const p of paths) {
    const parts = p.split('/');
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isDir = i < parts.length - 1;
      let child = cur.children.find(c => c.name === part && c.isDir === isDir);
      if (!child) {
        child = { name: part, path: parts.slice(0, i + 1).join('/'), isDir, children: [] };
        cur.children.push(child);
      }
      cur = child;
    }
  }
  return root;
}

function TreeNode({
  node, depth, expandedFolders, onToggle, selectedPath, onSelectFile,
}: {
  node: TreeData;
  depth: number;
  expandedFolders: Set<string>;
  onToggle: (p: string) => void;
  selectedPath: string | null;
  onSelectFile: (p: string) => void;
}) {
  if (node.path === '' && node.isDir) {
    return (
      <>
        {node.children.map(child => (
          <TreeNode key={child.path} node={child} depth={depth}
            expandedFolders={expandedFolders} onToggle={onToggle}
            selectedPath={selectedPath} onSelectFile={onSelectFile} />
        ))}
      </>
    );
  }

  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  if (node.isDir) {
    return (
      <div>
        <div
          onClick={() => onToggle(node.path)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: `3px 12px 3px ${12 + depth * 14}px`,
            cursor: 'pointer', color: 'var(--text-secondary)',
            userSelect: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isExpanded ? '▼' : '▶'}</span>
          <span style={{ fontSize: 13 }}>📁</span>
          <span style={{ fontSize: 12 }}>{node.name}</span>
        </div>
        {isExpanded && node.children.map(child => (
          <TreeNode key={child.path} node={child} depth={depth + 1}
            expandedFolders={expandedFolders} onToggle={onToggle}
            selectedPath={selectedPath} onSelectFile={onSelectFile} />
        ))}
      </div>
    );
  }

  const ext = node.name.split('.').pop() || '';
  const icon = fileIcon(ext);

  return (
    <div
      onClick={() => onSelectFile(node.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: `3px 12px 3px ${12 + depth * 14}px`,
        cursor: 'pointer',
        background: isSelected ? 'var(--accent-glow)' : '',
        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = ''; }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{
        fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
      }}>{node.name}</span>
    </div>
  );
}

function fileIcon(ext: string): string {
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '📜', jsx: '⚛️', py: '🐍', go: '🐹',
    rs: '🦀', java: '☕', rb: '💎', php: '🐘', vue: '💚', svelte: '🧡',
    cs: '💜', cpp: '⚙️', c: '⚙️', h: '📎', bazel: '🔨', bzl: '🔨',
  };
  return icons[ext] || '📄';
}

const sidebarStyle: React.CSSProperties = {
  width: 260,
  background: 'var(--bg-panel)',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  overflow: 'hidden',
};
