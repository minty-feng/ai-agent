export function SkeletonLoader({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card ${className}`}>
      <div className="skeleton h-6 w-1/3 mb-4" />
      <SkeletonLoader lines={3} />
    </div>
  );
}
