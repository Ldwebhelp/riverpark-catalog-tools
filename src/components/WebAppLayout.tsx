'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface WebAppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: '📊',
    description: 'Overview and Analytics'
  },
  {
    id: 'products',
    label: 'Product Details',
    href: '/products',
    icon: '🐟',
    description: 'BigCommerce Product Management'
  },
  {
    id: 'care-guides',
    label: 'Care Guides',
    href: '/care-guides',
    icon: '📋',
    description: 'AI-Generated Species Care Guides'
  },
  {
    id: 'information-panels',
    label: 'Information Panels',
    href: '/information',
    icon: '📄',
    description: 'Dynamic Content Management'
  },
  {
    id: 'ai-species',
    label: 'AI Species Generator',
    href: '/ai-species',
    icon: '🤖',
    description: 'AI-Powered Species Data Creation'
  },
  {
    id: 'database',
    label: 'Database Management',
    href: '/database',
    icon: '🗄️',
    description: 'Vercel Postgres Operations'
  }
];

export default function WebAppLayout({ children }: WebAppLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">☰</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              🏢 Riverpark Catalog Tools
            </h1>
            <p className="text-sm text-gray-600">
              Professional Aquarium Business Management Platform
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Database: <span className="text-green-600 font-medium">Connected</span>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            R
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <nav className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-72'
        }`}>
          <div className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`block w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900'
                        : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      {!sidebarCollapsed && (
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{item.label}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Navigation Footer */}
          {!sidebarCollapsed && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-2">System Status</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <span className="text-green-600">✓ Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BigCommerce:</span>
                    <span className="text-green-600">✓ Synced</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Services:</span>
                    <span className="text-green-600">✓ Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            © 2024 Riverpark Catalog Tools - Professional Aquarium Business Platform
          </div>
          <div className="flex items-center space-x-4">
            <span>Build: Production</span>
            <span>Version: 2.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}