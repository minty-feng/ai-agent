import { useState, useCallback } from 'react';
import type { AnalysisResult, GraphNode } from '../types';
import { analyzeRepo } from '../api';

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const analyze = useCallback(async (repo: string, token?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedNode(null);
    try {
      const data = await analyzeRepo({ repo, token });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, selectedNode, setSelectedNode, analyze };
}
