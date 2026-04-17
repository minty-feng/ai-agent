import { useAnalysis } from './hooks/useAnalysis';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { GraphView } from './components/GraphView';
import { RightPanel } from './components/RightPanel';
import { EmptyState } from './components/EmptyState';

export default function App() {
  const { result, loading, error, selectedNode, setSelectedNode, analyze } = useAnalysis();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar onAnalyze={analyze} loading={loading} />

      {error && (
        <div style={{
          background: 'rgba(255,68,102,0.12)',
          border: '1px solid #ff446655',
          color: '#ff4466',
          padding: '8px 16px',
          fontSize: 13,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          result={result}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
        />

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {result ? (
            <GraphView
              nodes={result.graph.nodes}
              edges={result.graph.edges}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          ) : (
            <EmptyState />
          )}
        </main>

        <RightPanel result={result} selectedNode={selectedNode} />
      </div>
    </div>
  );
}
