'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'blue' | 'green' | 'red';
  className?: string;
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  const variantStyles = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface ChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, onClick, className = '' }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
