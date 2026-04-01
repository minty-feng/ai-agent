"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Vocabulary", href: "/vocabulary" },
  { label: "Reading", href: "/reading" },
  { label: "Commit Msg", href: "/commit" },
  { label: "Code Review", href: "/review" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-[#0f172a] text-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-sky-400">DE</div>
              <span className="text-lg font-semibold tracking-tight">
                DevEnglish
              </span>
            </Link>
            <div className="hidden items-center space-x-6 text-sm md:flex">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`border-b-2 pb-1 font-medium transition ${
                      isActive
                        ? "border-sky-400 text-sky-400"
                        : "border-transparent text-gray-300 hover:border-sky-400/60 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            English for Programmers
          </div>
        </div>
      </nav>
    </header>
  );
}
