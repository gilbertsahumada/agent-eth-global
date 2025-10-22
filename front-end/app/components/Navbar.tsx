'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiDocumentText, HiFolderOpen, HiMagnifyingGlass, HiCpuChip, HiAcademicCap } from 'react-icons/hi2';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Index Docs', icon: HiDocumentText },
    { href: '/projects', label: 'Projects', icon: HiFolderOpen },
    { href: '/search', label: 'Search', icon: HiMagnifyingGlass },
    { href: '/hackathons', label: 'Hackathons', icon: HiAcademicCap },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <HiCpuChip className="text-2xl text-gray-900" />
              <span className="text-gray-900 font-bold text-xl">ETH Global RAG</span>
            </Link>
          </div>

          <div className="flex space-x-4">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="text-lg" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
