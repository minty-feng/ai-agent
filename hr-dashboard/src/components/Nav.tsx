import Link from 'next/link';

export function Nav() {
  return (
    <header className="border-b bg-white">
      <div className="container-responsive h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold">HR</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/challenges">Challenges</Link>
          <Link href="/contests">Contests</Link>
        </nav>
      </div>
    </header>
  );
}
