import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white border border-border rounded-lg p-3 md:p-5 ${className}`}>
      {title && <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">{title}</h3>}
      {children}
    </div>
  );
}
