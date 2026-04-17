export function EmptyState() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      gap: 16,
      padding: 40,
    }}>
      <div style={{ fontSize: 64 }}>⚡</div>
      <h2 style={{ color: 'var(--accent)', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
        CodeFlow
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 480 }}>
        Enter a GitHub repository above to visualize its dependency graph,
        detect security issues, analyze design patterns, and compute a health score.
      </p>
      <div style={{ display: 'flex', gap: 32, marginTop: 16 }}>
        {[
          { icon: '🕸️', label: 'Dependency Graph' },
          { icon: '💥', label: 'Blast Radius' },
          { icon: '🔒', label: 'Security Scanner' },
          { icon: '🏥', label: 'Health Score' },
        ].map(({ icon, label }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 28 }}>{icon}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 24,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '12px 20px',
        fontSize: 12,
        color: 'var(--text-secondary)',
      }}>
        Try: <span style={{ color: 'var(--accent)' }}>facebook/react</span> or{' '}
        <span style={{ color: 'var(--accent)' }}>torvalds/linux</span>
      </div>
    </div>
  );
}
