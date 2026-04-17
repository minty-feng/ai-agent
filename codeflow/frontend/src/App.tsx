import { useState } from 'react';
import { useAnalysis } from './hooks/useAnalysis';
import { useFileBrowser } from './hooks/useFileBrowser';
import { useLocalRepo } from './hooks/useLocalRepo';
import { TopBar } from './components/TopBar';
import type { AppMode } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { FileBrowser } from './components/FileBrowser';
import { LocalRepoBrowser } from './components/LocalRepoBrowser';
import { GraphView } from './components/GraphView';
import { RightPanel } from './components/RightPanel';
import { EmptyState } from './components/EmptyState';

export default function App() {
  const [mode, setMode] = useState<AppMode>('analyze');
  const [localSelectedBuildFile, setLocalSelectedBuildFile] = useState<string | null>(null);

  const { result, loading: analyzeLoading, error: analyzeError, selectedNode, setSelectedNode, analyze, analyzedRepo, analyzedToken } = useAnalysis();
  const browser = useFileBrowser();
  const local = useLocalRepo();

  const handleAnalyze = (repo: string, token?: string) => {
    setMode('analyze');
    if (repo) analyze(repo, token);
  };

  const handleBrowse = (repo: string, token?: string) => {
    setMode('browse');
    if (repo) {
      const cleaned = repo.trim()
        .replace(/^https?:\/\/github\.com\//, '')
        .replace(/\/$/, '');
      const parts = cleaned.split('/');
      if (parts.length >= 2) {
        browser.init(parts[0], parts[1], token);
      }
    }
  };

  const handleLoadLocal = (path: string) => {
    setMode('local');
    local.loadTree(path);
  };

  const handleModeChange = (m: AppMode) => {
    setMode(m);
    if (m === 'local' && !local.tree && !local.treeLoading) {
      // Just switch tab; user will enter a path and click Load
    }
  };

  // The "repo" string to pass down for build-deps API calls
  const browseRepo = browser.owner && browser.repo ? `${browser.owner}/${browser.repo}` : '';

  const topBarLoading =
    mode === 'analyze' ? analyzeLoading
    : mode === 'browse' ? browser.loading
    : local.treeLoading;

  const topLevelError =
    mode === 'analyze' ? analyzeError
    : mode === 'browse' ? browser.error
    : local.treeError;

  // For local mode: after analysis completes, show the result via the standard sidebar + graph
  const localResult = local.result;
  const localSelectedNode = selectedNode;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar
        onAnalyze={handleAnalyze}
        onBrowse={handleBrowse}
        onLoadLocal={handleLoadLocal}
        onModeChange={handleModeChange}
        loading={topBarLoading}
        mode={mode}
      />

      {topLevelError && (
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
          <span>{topLevelError}</span>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        {mode === 'analyze' ? (
          <Sidebar
            result={result}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
        ) : mode === 'browse' ? (
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
        ) : local.tree ? (
          /* Local mode: show selector when tree is loaded */
          <>
            <LocalRepoBrowser
              rootPath={local.rootPath}
              tree={local.tree}
              checkedDirs={local.checkedDirs}
              exclusions={local.exclusions}
              analyzeLoading={local.analyzeLoading}
              analyzeError={local.analyzeError}
              onToggleDir={local.toggleDir}
              onSelectAll={local.selectAll}
              onDeselectAll={local.deselectAll}
              onAddExcludePath={local.addExcludePath}
              onRemoveExcludePath={local.removeExcludePath}
              onAddExcludeExt={local.addExcludeExt}
              onRemoveExcludeExt={local.removeExcludeExt}
              onAnalyze={local.analyze}
              onSelectBuildFile={setLocalSelectedBuildFile}
              selectedBuildFile={localSelectedBuildFile}
            />
            {/* Show analysis sidebar next to browser once result is available */}
            {localResult && (
              <Sidebar
                result={localResult}
                selectedNode={localSelectedNode}
                onSelectNode={setSelectedNode}
              />
            )}
          </>
        ) : (
          /* Local mode: no tree loaded yet */
          <LocalEmptyState loading={local.treeLoading} />
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
          ) : mode === 'browse' ? (
            <BrowseEmptyState hasBrowser={!!browser.owner} selectedFile={browser.selectedFile} />
          ) : localResult ? (
            <GraphView
              nodes={localResult.graph.nodes}
              edges={localResult.graph.edges}
              selectedNode={localSelectedNode}
              onSelectNode={setSelectedNode}
            />
          ) : (
            <LocalMainEmptyState hasTree={!!local.tree} loading={local.analyzeLoading} />
          )}
        </main>

        <RightPanel
          result={mode === 'local' ? localResult : result}
          selectedNode={selectedNode}
          repo={mode === 'analyze' ? analyzedRepo : browseRepo}
          token={mode === 'analyze' ? analyzedToken : (browser.token || undefined)}
          selectedFile={mode === 'browse' ? browser.selectedFile : mode === 'local' ? localSelectedBuildFile : null}
          localRootPath={mode === 'local' ? local.rootPath : undefined}
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

function LocalEmptyState({ loading }: { loading: boolean }) {
  return (
    <div style={{
      width: 320,
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: 'var(--text-muted)',
      flexShrink: 0,
    }}>
      {loading ? (
        <>
          <div style={{ fontSize: 32 }}>⏳</div>
          <div style={{ fontSize: 13 }}>Reading directory…</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 48 }}>💻</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: '0 24px' }}>
            Enter the absolute path to a local repository and click Load
          </div>
          <div style={{ fontSize: 12, textAlign: 'center', padding: '0 24px' }}>
            Then select the directories you want to analyze
          </div>
        </>
      )}
    </div>
  );
}

function LocalMainEmptyState({ hasTree, loading }: { hasTree: boolean; loading: boolean }) {
  if (loading) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: 32 }}>⚡</div>
        <div style={{ fontSize: 14 }}>Analyzing…</div>
      </div>
    );
  }
  if (!hasTree) return <EmptyState />;
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48 }}>📂</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
        Select directories on the left and click ⚡ Analyze Selected
      </div>
    </div>
  );
}

