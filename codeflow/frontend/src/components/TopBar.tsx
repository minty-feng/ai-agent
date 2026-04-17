import React, { useState } from 'react';

export type AppMode = 'analyze' | 'browse' | 'local';

interface TopBarProps {
  onAnalyze: (repo: string, token?: string) => void;
  onOpenFolder: (path: string) => void;
  onRefresh: () => void;
  onReset: () => void;
  loading: boolean;
  mode: AppMode;
  hasData: boolean;
}

export function TopBar({ onAnalyze, onOpenFolder, onRefresh, onReset, loading, mode, hasData }: TopBarProps) {
  const [repo, setRepo] = useState('');
  const [authMethod, setAuthMethod] = useState<'none' | 'pat'>('none');
  const [token, setToken] = useState('');

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo.trim() || loading) return;
    onAnalyze(repo.trim(), authMethod === 'pat' && token.trim() ? token.trim() : undefined);
  };

  const handleOpenFolder = () => {
    if (loading) return;
    const path = prompt('Enter the absolute path to a local repository:');
    if (path && path.trim()) {
      onOpenFolder(path.trim());
    }
  };

  const analyzeDisabled = loading || !repo.trim();

  return (
    <header style={{
      height: 48,
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
        cursor: 'pointer',
      }}>
        <div style={{
          width: 28,
          height: 28,
          background: 'linear-gradient(135deg, var(--accent), var(--blue))',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}>
          ⚡
        </div>
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          CODEFLOW
        </span>
      </div>

      {/* Repo input */}
      <form onSubmit={handleAnalyze} style={{ display: 'flex', flex: 1, gap: 8, alignItems: 'center', maxWidth: 600 }}>
        <input
          value={repo}
          onChange={e => setRepo(e.target.value)}
          placeholder="owner/repo or GitHub URL"
          style={{
            flex: 1,
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '6px 12px',
            outline: 'none',
            fontSize: 11,
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />

        {/* Auth selector */}
        <select
          value={authMethod}
          onChange={e => setAuthMethod(e.target.value as 'none' | 'pat')}
          style={{
            padding: '6px 28px 6px 10px',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: 10,
            cursor: 'pointer',
            minWidth: 100,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888aa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="none">No Auth</option>
          <option value="pat">Token (PAT)</option>
        </select>

        {/* Token input (only shown when PAT selected) */}
        {authMethod === 'pat' && (
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="GitHub token"
            style={{
              width: 160,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              padding: '6px 12px',
              outline: 'none',
              fontSize: 11,
              fontFamily: 'inherit',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        )}

        {/* Analyze button */}
        <button
          type="submit"
          disabled={analyzeDisabled}
          style={{
            padding: '6px 12px',
            background: analyzeDisabled ? 'var(--bg-surface)' : 'var(--accent)',
            color: analyzeDisabled ? 'var(--text-muted)' : 'var(--bg-base)',
            border: analyzeDisabled ? '1px solid var(--border)' : '1px solid var(--accent)',
            borderRadius: 6,
            fontFamily: 'inherit',
            fontSize: 10,
            fontWeight: 700,
            cursor: analyzeDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          {loading && mode === 'analyze' ? (
            <><Spinner /> Analyzing…</>
          ) : (
            '🔍 Analyze'
          )}
        </button>
      </form>

      {/* Open Folder button */}
      <TopBarButton
        onClick={handleOpenFolder}
        disabled={loading}
        active={loading && mode === 'local'}
      >
        {loading && mode === 'local' ? (
          <><Spinner /> Loading…</>
        ) : (
          '📁 Open Folder'
        )}
      </TopBarButton>

      {/* Refresh button */}
      {hasData && (
        <TopBarButton onClick={onRefresh} disabled={loading}>
          <span style={{ fontSize: 12 }}>↻</span> Refresh
        </TopBarButton>
      )}

      {/* Reset button */}
      {hasData && (
        <TopBarButton onClick={onReset} disabled={loading}>
          <span style={{ fontSize: 12 }}>✕</span> Reset
        </TopBarButton>
      )}
    </header>
  );
}

function TopBarButton({ children, onClick, disabled, active }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 12px',
        background: active ? 'var(--accent-glow)' : 'var(--bg-surface)',
        border: `1px solid ${hovered && !disabled ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 6,
        color: hovered && !disabled ? 'var(--accent)' : 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 12,
      height: 12,
      border: '2px solid var(--text-muted)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('codeflow-spin')) {
  const style = document.createElement('style');
  style.id = 'codeflow-spin';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}
