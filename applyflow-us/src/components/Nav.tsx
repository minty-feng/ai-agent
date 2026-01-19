import Link from 'next/link';

export function Nav() {
  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="container-responsive h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-secondary-900">
          ApplyFlow
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/jobs" className="text-secondary-600 hover:text-secondary-900 transition-colors">
            Jobs
          </Link>
          <Link href="/pricing" className="text-secondary-600 hover:text-secondary-900 transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="text-secondary-600 hover:text-secondary-900 transition-colors">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary !py-2">
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
