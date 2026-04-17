import type { AnalyzeRequest, AnalysisResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function analyzeRepo(req: AnalyzeRequest): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      msg = await res.text() || msg;
    }
    throw new Error(msg);
  }
  return res.json();
}
