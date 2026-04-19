"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchPost, getPdfUrl } from "@/lib/api";
import type { Post } from "@/lib/types";

function ViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  if (n >= 1000) return (n / 1000).toFixed(1) + "千";
  return String(n);
}

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    fetchPost(params.id)
      .then(setPost)
      .catch(() => setError("帖子不存在或加载失败"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm" style={{ color: "var(--color-brown-400)" }}>
        加载中…
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg" style={{ color: "var(--color-vermilion-500)" }}>
          {error || "帖子不存在"}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm no-underline"
          style={{ color: "var(--color-vermilion-600)" }}
        >
          ← 返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm" style={{ color: "var(--color-brown-400)" }}>
        <Link href="/" className="no-underline hover:underline" style={{ color: "var(--color-vermilion-500)" }}>
          首页
        </Link>
        <span className="mx-2">›</span>
        <span>{post.category}</span>
        <span className="mx-2">›</span>
        <span style={{ color: "var(--color-brown-600)" }}>{post.title}</span>
      </nav>

      {/* Post header card */}
      <article className="paper-card rounded-xl overflow-hidden">
        {/* Color accent bar */}
        <div className="h-2" style={{ background: post.cover_color }} />

        <div className="p-6 sm:p-8">
          {/* Category + Featured */}
          <div className="mb-4 flex items-center gap-2">
            <span className="category-pill !cursor-default">{post.category}</span>
            {post.is_featured === 1 && (
              <span className="featured-badge">🔥 精选</span>
            )}
          </div>

          {/* Title */}
          <h1
            className="mb-4 text-2xl font-bold leading-tight sm:text-3xl"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-brown-800)" }}
          >
            {post.title}
          </h1>

          {/* Meta */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--color-brown-400)" }}>
            <span>✍️ {post.author}</span>
            <span className="flex items-center gap-1">
              <ViewIcon /> {formatCount(post.view_count)} 次阅读
            </span>
          </div>

          <div className="ink-divider mb-6" />

          {/* Description */}
          <div
            className="mb-6 text-base leading-relaxed"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-brown-600)" }}
          >
            {post.description}
          </div>

          {/* PDF viewer */}
          {post.pdf_file && (
            <div className="mt-6">
              <div className="ink-divider mb-6" />
              <h2
                className="mb-4 flex items-center gap-2 text-sm font-semibold"
                style={{ color: "var(--color-vermilion-500)" }}
              >
                📄 原文 PDF
              </h2>
              <div
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: "var(--color-parchment-300)" }}
              >
                <iframe
                  src={getPdfUrl(post.pdf_file)}
                  className="h-[70vh] w-full"
                  title={post.title}
                />
              </div>
              <div className="mt-3 text-center">
                <a
                  href={getPdfUrl(post.pdf_file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white no-underline transition-opacity hover:opacity-85"
                  style={{ background: "var(--color-vermilion-600)" }}
                >
                  📥 下载 PDF
                </a>
              </div>
            </div>
          )}

          {!post.pdf_file && (
            <div
              className="mt-6 rounded-lg p-8 text-center text-sm"
              style={{ background: "var(--color-parchment-100)", color: "var(--color-brown-400)" }}
            >
              暂无 PDF 文件，请在后台管理中上传
            </div>
          )}
        </div>
      </article>

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-block text-sm no-underline"
          style={{ color: "var(--color-vermilion-500)" }}
        >
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
