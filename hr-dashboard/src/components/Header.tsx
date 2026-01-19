"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Practice", href: "/practice" },
  { label: "Compete", href: "/compete" },
  { label: "Jobs", href: "/jobs" },
  { label: "Leaderboard", href: "/leaderboard" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-[#0b0f14] text-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-green-500">HR</div>
              <span className="text-lg font-semibold tracking-tight">HackerRank</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6 text-sm">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`border-b-2 pb-1 font-medium transition ${
                      isActive
                        ? "border-green-400 text-green-400"
                        : "border-transparent text-gray-300 hover:border-green-400/60 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="rounded-full p-2 transition hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
              <span className="text-sm font-semibold text-white">U</span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
