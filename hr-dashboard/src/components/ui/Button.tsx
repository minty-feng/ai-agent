'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-gray-800 focus:ring-primary disabled:bg-gray-400',
    secondary: 'bg-white text-primary border border-border hover:bg-gray-50 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className} ${(disabled || loading) ? 'cursor-not-allowed' : ''}`}
    >
      {loading ? '加载中...' : children}
    </button>
  );
}
