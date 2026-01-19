import Link from 'next/link';

interface LimitBannerProps {
  current: number;
  max: number;
  type: 'jobs' | 'sessions';
  className?: string;
}

export function LimitBanner({ current, max, type, className = '' }: LimitBannerProps) {
  const isAtLimit = current >= max;
  
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-secondary-700">
          Free plan: <strong>{current}/{max}</strong> {type} used
          {isAtLimit && <span className="ml-1 text-yellow-700">• Limit reached</span>}
        </span>
      </div>
      <Link href="/pricing" className="text-sm font-medium text-primary-600 hover:text-primary-700">
        Upgrade
      </Link>
    </div>
  );
}
