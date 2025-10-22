'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiCpuChip } from 'react-icons/hi2';

const links = [
  { href: '/', label: 'Sponsor Tools' },
  { href: '/search', label: 'Search' },
  { href: '/hackathons', label: 'Hackathons' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-900 transition hover:text-slate-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
            <HiCpuChip className="text-lg" />
          </span>
          <span className="text-sm font-semibold tracking-tight">ETH Global RAG</span>
        </Link>

        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 shadow-sm">
          {links.map(({ href, label }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`relative overflow-hidden rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ease-out ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span
                  className={`pointer-events-none absolute inset-0 scale-95 rounded-full bg-slate-900 transition-all duration-300 ease-out ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                  aria-hidden
                ></span>
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
