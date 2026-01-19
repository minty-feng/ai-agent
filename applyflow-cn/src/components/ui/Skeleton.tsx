'use client';

export function Skeleton({ className = '', rows = 3 }: { className?: string; rows?: number }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  );
}
