'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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
    id: 'product-selector',
    label: 'Product Selector',
    href: '/product-selector',
    icon: '✅',
    description: 'Select Products for Content Creation'
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
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showQuickNav, setShowQuickNav] = useState(false);

  // Get current page info
  const currentPage = navigationItems.find(item => item.href === pathname);
  
  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', href: '/' }];
    
    if (segments.length > 0) {
      const currentItem = navigationItems.find(item => item.href === pathname);
      if (currentItem) {
        breadcrumbs.push({ label: currentItem.label, href: pathname });
      }
    }
    
    return breadcrumbs;
  };

  // Quick navigation handler
  const handleGlobalSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      const matchedItem = navigationItems.find(item => 
        item.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(globalSearch.toLowerCase())
      );
      
      if (matchedItem) {
        router.push(matchedItem.href);
        setGlobalSearch('');
        setShowQuickNav(false);
      }
    }
    
    if (e.key === 'Escape') {
      setGlobalSearch('');
      setShowQuickNav(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for quick navigation
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickNav(true);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

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
          {/* Quick Navigation Search */}
          <div className="relative">
            <button
              onClick={() => setShowQuickNav(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span>🔍</span>
              <span>Quick Nav</span>
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">⌘K</span>
            </button>
          </div>
          
          {/* System Status Indicators */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Database</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>BigCommerce</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>AI Services</span>
            </div>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            R
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <nav className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
          sidebarCollapsed ? 'w-16' : 'w-72'
        }`}>
          <div className="p-4 flex-1 overflow-y-auto">
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

        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {/* Breadcrumbs */}
          {currentPage && (
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center space-x-2 text-sm">
                {generateBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center space-x-2">
                    {index > 0 && <span className="text-gray-400">›</span>}
                    <Link
                      href={crumb.href}
                      className={`${
                        index === generateBreadcrumbs().length - 1
                          ? 'text-gray-900 font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </div>
              {currentPage && (
                <div className="mt-1">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{currentPage.icon}</span>
                    <span>{currentPage.label}</span>
                  </h2>
                  <p className="text-sm text-gray-600">{currentPage.description}</p>
                </div>
              )}
            </div>
          )}
          
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

      {/* Quick Navigation Modal */}
      {showQuickNav && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="text-lg">🔍</span>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  placeholder="Search pages and Product IDs... (type to filter, Enter to navigate)"
                  className="flex-1 text-lg border-none outline-none bg-transparent"
                  autoFocus
                />
                <button
                  onClick={() => setShowQuickNav(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {navigationItems
                .filter(item => 
                  !globalSearch || 
                  item.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
                  item.description.toLowerCase().includes(globalSearch.toLowerCase())
                )
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.href);
                      setShowQuickNav(false);
                      setGlobalSearch('');
                    }}
                    className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{item.label}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
            
            <div className="p-3 bg-gray-50 text-xs text-gray-600 border-t border-gray-200">
              <div className="flex justify-between">
                <span>↑↓ Navigate</span>
                <span>Enter to select</span>
                <span>Esc to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}