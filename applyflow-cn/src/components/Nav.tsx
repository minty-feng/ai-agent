import Link from 'next/link';

export function Nav() {
  return (
    <header className="border-b border-border bg-white">
      <div className="container-content h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-primary">面试AI</Link>
        <nav className="flex items-center gap-4 md:gap-6 text-sm">
          <Link href="/jobs" className="text-text-secondary hover:text-text-primary">岗位</Link>
          <Link href="/dashboard" className="text-text-secondary hover:text-text-primary hidden md:inline">Dashboard</Link>
          <Link href="/try" className="text-text-secondary hover:text-text-primary">试用</Link>
          <Link href="/login" className="text-text-secondary hover:text-text-primary">登录</Link>
        </nav>
      </div>
    </header>
  );
}
