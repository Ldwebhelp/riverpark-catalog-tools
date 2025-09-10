'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '🏠' },
    { href: '/ai-species', label: 'AI Species', icon: '🤖' },
    { href: '/database', label: 'Database', icon: '🗄️' },
    { href: '/species', label: 'Species Generator', icon: '🐠' },
    { href: '/guides', label: 'Care Guides', icon: '📖' },
    { href: '/products', label: 'Products', icon: '📦' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
              RC
            </div>
            <span className="font-semibold text-gray-900">Riverpark Catalog</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-3">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}