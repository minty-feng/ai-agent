const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchPosts(category?: string): Promise<import("./types").Post[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const url = `${API_BASE}/api/posts${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function fetchPost(id: string): Promise<import("./types").Post> {
  const res = await fetch(`${API_BASE}/api/posts/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export function getPdfUrl(filename: string): string {
  return `${API_BASE}/uploads/${filename}`;
}
