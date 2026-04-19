"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPosts, fetchCategories } from "@/lib/api";
import type { Post } from "@/lib/types";

function ViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  if (n >= 1000) return (n / 1000).toFixed(1) + "千";
  return String(n);
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/post/${post.id}`} className="block no-underline">
      <article className="paper-card rounded-xl overflow-hidden">
        {/* Color strip top */}
        <div className="h-1.5" style={{ background: post.cover_color }} />
        <div className="p-5">
          {/* Top row: category + featured */}
          <div className="mb-3 flex items-center gap-2">
            <span className="category-pill !cursor-default text-xs">{post.category}</span>
            {post.is_featured === 1 && (
              <span className="featured-badge">精选</span>
            )}
          </div>

          {/* Title */}
          <h3
            className="mb-2 text-base font-semibold leading-snug"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-brown-800)" }}
          >
            {post.title}
          </h3>

          {/* Description */}
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--color-brown-500)" }}>
            {post.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-brown-400)" }}>
            <span>✍️ {post.author}</span>
            <span className="flex items-center gap-1">
              <ViewIcon /> {formatCount(post.view_count)}
            </span>
            {post.pdf_file && (
              <span className="flex items-center gap-1" style={{ color: "var(--color-vermilion-500)" }}>
                <PdfIcon /> PDF
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPosts(activeCategory || undefined)
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeCategory]);

  const featured = posts.filter((p) => p.is_featured);
  const rest = posts.filter((p) => !p.is_featured);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="mb-10 text-center">
        <h1
          className="mb-2 text-3xl font-bold tracking-wide sm:text-4xl"
          style={{ fontFamily: "var(--font-serif)", color: "var(--color-vermilion-600)" }}
        >
          天涯神贴
        </h1>
        <p className="mx-auto max-w-lg text-sm leading-relaxed" style={{ color: "var(--color-brown-400)" }}>
          收录天涯论坛历年经典帖子 — 经济预言、历史解读、人生感悟、灵异悬疑……
          <br />
          重温互联网黄金时代的文字力量
        </p>
        <div className="ink-divider mx-auto mt-5 w-48" />
      </section>

      {/* Category filters */}
      <section className="mb-8 flex flex-wrap justify-center gap-2">
        <button
          className={`category-pill ${activeCategory === "" ? "active" : ""}`}
          onClick={() => setActiveCategory("")}
        >
          全部
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`category-pill ${activeCategory === c ? "active" : ""}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </section>

      {loading && (
        <p className="py-20 text-center text-sm" style={{ color: "var(--color-brown-400)" }}>
          加载中…
        </p>
      )}

      {!loading && posts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-lg" style={{ color: "var(--color-brown-400)" }}>暂无帖子</p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-brown-300)" }}>
            请先在后台管理中添加帖子
          </p>
        </div>
      )}

      {/* Featured section */}
      {!loading && featured.length > 0 && (
        <section className="mb-10">
          <h2
            className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-vermilion-500)" }}
          >
            <span>🔥</span> 精选推荐
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* All posts */}
      {!loading && rest.length > 0 && (
        <section>
          <h2
            className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-brown-500)" }}
          >
            <span>📖</span> {activeCategory || "全部帖子"}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
