'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  backUrl?: string;
  rightAction?: ReactNode;
}

export function TopBar({ title, backUrl, rightAction }: TopBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {backUrl && (
            <Link href={backUrl as any} className="text-text-secondary hover:text-text-primary">
              ← 返回
            </Link>
          )}
          <h1 className="text-base md:text-lg font-medium text-text-primary">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </div>
  );
}
