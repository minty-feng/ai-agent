import type { AnalyzeRequest, AnalysisResult, DirEntry, BuildDepsRequest, BuildDepsResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      msg = (await res.text()) || msg;
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function analyzeRepo(req: AnalyzeRequest): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return handleResponse<AnalysisResult>(res);
}

export async function fetchTree(
  owner: string,
  repo: string,
  path: string,
  token?: string,
): Promise<DirEntry[]> {
  const params = new URLSearchParams();
  if (path) params.set('path', path);
  if (token) params.set('token', token);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/tree/${owner}/${repo}${qs}`);
  return handleResponse<DirEntry[]>(res);
}

export async function fetchBuildDeps(req: BuildDepsRequest): Promise<BuildDepsResponse> {
  const res = await fetch(`${API_BASE}/api/build-deps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return handleResponse<BuildDepsResponse>(res);
}
