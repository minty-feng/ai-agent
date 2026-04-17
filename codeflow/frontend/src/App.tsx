import { useState } from 'react';
import { useAnalysis } from './hooks/useAnalysis';
import { useFileBrowser } from './hooks/useFileBrowser';
import { TopBar } from './components/TopBar';
import type { AppMode } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { FileBrowser } from './components/FileBrowser';
import { GraphView } from './components/GraphView';
import { RightPanel } from './components/RightPanel';
import { EmptyState } from './components/EmptyState';

export default function App() {
  const [mode, setMode] = useState<AppMode>('analyze');

  const { result, loading: analyzeLoading, error: analyzeError, selectedNode, setSelectedNode, analyze } = useAnalysis();
  const browser = useFileBrowser();

  const handleAnalyze = (repo: string, token?: string) => {
    setMode('analyze');
    if (repo) analyze(repo, token);
  };

  const handleBrowse = (repo: string, token?: string) => {
    setMode('browse');
    if (repo) {
      // parse owner/repo from the input
      const cleaned = repo.trim()
        .replace(/^https?:\/\/github\.com\//, '')
        .replace(/\/$/, '');
      const parts = cleaned.split('/');
      if (parts.length >= 2) {
        browser.init(parts[0], parts[1], token);
      }
    }
  };

  // The "repo" string to pass down for build-deps API calls
  const browseRepo = browser.owner && browser.repo ? `${browser.owner}/${browser.repo}` : '';

  const loading = mode === 'analyze' ? analyzeLoading : browser.loading;
  const error = mode === 'analyze' ? analyzeError : browser.error;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar
        onAnalyze={handleAnalyze}
        onBrowse={handleBrowse}
        onModeChange={setMode}
        loading={loading}
        mode={mode}
      />

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
        {mode === 'analyze' ? (
          <Sidebar
            result={result}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
        ) : (
          <FileBrowser
            owner={browser.owner}
            repo={browser.repo}
            currentPath={browser.currentPath}
            treeCache={browser.treeCache}
            selectedFile={browser.selectedFile}
            loading={browser.loading}
            error={browser.error}
            onNavigate={browser.navigateTo}
            onSelectFile={browser.selectFile}
          />
        )}

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {mode === 'analyze' ? (
            result ? (
              <GraphView
                nodes={result.graph.nodes}
                edges={result.graph.edges}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
              />
            ) : (
              <EmptyState />
            )
          ) : (
            <BrowseEmptyState hasBrowser={!!browser.owner} selectedFile={browser.selectedFile} />
          )}
        </main>

        <RightPanel
          result={result}
          selectedNode={selectedNode}
          repo={browseRepo}
          token={browser.token || undefined}
          selectedFile={mode === 'browse' ? browser.selectedFile : null}
        />
      </div>
    </div>
  );
}

function BrowseEmptyState({ hasBrowser, selectedFile }: { hasBrowser: boolean; selectedFile: string | null }) {
  if (!hasBrowser) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        gap: 12,
      }}>
        <div style={{ fontSize: 48 }}>🗂</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Enter a repository and click Browse</div>
        <div style={{ fontSize: 12 }}>Navigate the file tree and select a CMakeLists.txt or BUILD file</div>
      </div>
    );
  }
  if (selectedFile) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        gap: 8,
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Selected: <span style={{ color: 'var(--accent)' }}>{selectedFile}</span>
        </div>
        <div style={{ fontSize: 12 }}>
          Check the 🔨 Build Deps tab on the right for CMake/Bazel targets
        </div>
      </div>
    );
  }
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      gap: 8,
    }}>
      <div style={{ fontSize: 13 }}>Browse the tree on the left to select a file</div>
    </div>
  );
}
