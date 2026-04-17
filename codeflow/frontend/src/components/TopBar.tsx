import React, { useState } from 'react';

export type AppMode = 'analyze' | 'browse';

interface TopBarProps {
  onAnalyze: (repo: string, token?: string) => void;
  onBrowse: (repo: string, token?: string) => void;
  loading: boolean;
  mode: AppMode;
}

export function TopBar({ onAnalyze, onBrowse, loading, mode }: TopBarProps) {
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo.trim()) return;
    if (mode === 'browse') {
      onBrowse(repo.trim(), token.trim() || undefined);
    } else {
      onAnalyze(repo.trim(), token.trim() || undefined);
    }
  };

  return (
    <header style={{
      height: 56,
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
        marginRight: 8,
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
          CodeFlow
        </span>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
        {(['analyze', 'browse'] as AppMode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => m === 'analyze' ? onAnalyze('', undefined) : onBrowse('', undefined)}
            style={{
              padding: '5px 14px',
              background: mode === m ? 'var(--accent-glow)' : 'none',
              border: 'none',
              borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
              color: mode === m ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: mode === m ? 700 : 400,
              letterSpacing: 0.5,
              transition: 'all 0.15s',
            }}
          >
            {m === 'analyze' ? '⚡ Analyze' : '🗂 Browse'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, gap: 8, alignItems: 'center' }}>
        <input
          value={repo}
          onChange={e => setRepo(e.target.value)}
          placeholder="owner/repo or https://github.com/owner/repo"
          style={{
            flex: 1,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            padding: '7px 12px',
            outline: 'none',
            fontSize: 13,
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="GitHub token (optional)"
            style={{
              width: 220,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              padding: '7px 32px 7px 12px',
              outline: 'none',
              fontSize: 13,
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            type="button"
            onClick={() => setShowToken(v => !v)}
            style={{
              position: 'absolute',
              right: 8,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 14,
              padding: 0,
            }}
          >
            {showToken ? '🙈' : '👁'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !repo.trim()}
          style={{
            background: loading ? 'var(--bg-surface)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : '#000',
            border: 'none',
            borderRadius: 6,
            padding: '7px 20px',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 0.5,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Spinner /> {mode === 'browse' ? 'Loading…' : 'Analyzing…'}
            </span>
          ) : mode === 'browse' ? '🗂 Browse' : '⚡ Analyze'}
        </button>
      </form>
    </header>
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
