'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HiCpuChip } from 'react-icons/hi2';

const links = [
  { href: '/', label: 'Sponsor Tools' },
  { href: '/hackathons', label: 'Hackathons' },
];

interface ActiveHackathon {
  id: string;
  name: string;
  location: string | null;
}

export default function Navbar() {
  const pathname = usePathname();
  const [activeHackathon, setActiveHackathon] = useState<ActiveHackathon | null>(null);

  // Fetch active hackathon on mount
  useEffect(() => {
    async function fetchActiveHackathon() {
      try {
        const response = await fetch('/api/hackathons/active');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.hackathon) {
            setActiveHackathon(data.hackathon);
          }
        }
      } catch (error) {
        console.error('Error fetching active hackathon:', error);
      }
    }

    fetchActiveHackathon();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveHackathon, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-slate-900 transition hover:text-slate-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
              <HiCpuChip className="text-lg" />
            </span>
            <span className="text-sm font-semibold tracking-tight">ETH Global RAG</span>
          </Link>

          {/* Active Hackathon Indicator */}
          {activeHackathon && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px]">
              <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-emerald-900">
                {activeHackathon.name}
              </span>
            </div>
          )}
        </div>

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
