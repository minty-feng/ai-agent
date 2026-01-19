'use client';

import { ReactNode } from 'react';

interface BottomStickyCTAProps {
  children: ReactNode;
  className?: string;
}

export function BottomStickyCTA({ children, className = '' }: BottomStickyCTAProps) {
  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 ${className}`}>
      {children}
    </div>
  );
}
