import Link from "next/link";
import { Navigation } from '@/components/Navigation';

export default function Home() {
  return (
    <>
      <Navigation />
      <div className="semantic-layout">
      <header className="semantic-header">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🐠 Catalog Management</h1>
              <p className="text-gray-600 mt-1">Professional tools for aquarium business data</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Riverpark Catalyst
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="semantic-main">
        <div className="space-y-8">
          {/* Welcome Section */}
          <section className="semantic-section text-center">
            <div className="mb-6">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🐠</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Catalog Management Suite</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Professional tools for managing aquarium species data and generating comprehensive care guides
              </p>
            </div>
          </section>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Species Tool - Featured */}
            <Link 
              href="/ai-species" 
              className="semantic-card group hover:border-orange-300 relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                🤖 UPDATED
              </div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600">AI Species Generator</h3>
                  <p className="text-gray-600">Simple & clean AI species data generation</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Clean interface like the test page
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Test individual products with instant results
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Visual species data with JSON preview
                </div>
              </div>
            </Link>

            {/* Species Tool */}
            <Link 
              href="/species" 
              className="semantic-card group hover:border-blue-300"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">Species Data Generator</h3>
                  <p className="text-gray-600">Transform Excel data into structured species JSON files</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Enhanced fish care database with 50+ species
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Smart family-based inference for unknown species
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Download tracking and progress management
                </div>
              </div>
            </Link>

            {/* Care Guide Tool */}
            <Link 
              href="/guides" 
              className="semantic-card group hover:border-green-300"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600">Care Guide Generator</h3>
                  <p className="text-gray-600">Create comprehensive care guides for each species</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  7-section comprehensive guides
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Professional formatting and structure
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Bulk generation and download management
                </div>
              </div>
            </Link>

            {/* Products Tool */}
            <Link 
              href="/products" 
              className="semantic-card group hover:border-purple-300"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600">BigCommerce Products</h3>
                  <p className="text-gray-600">Browse live product catalog with real data</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Real-time BigCommerce API integration
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Category-based filtering with subcategories
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Pagination and search functionality
                </div>
              </div>
            </Link>
          </div>

          {/* Coming Soon */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <div className="flex justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="text-lg mr-2">📦</span>
                <span>Inventory Manager</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-2">📊</span>
                <span>Analytics Dashboard</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-2">🔄</span>
                <span>API Integrations</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <section className="semantic-section">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">50+</div>
                <div className="text-sm text-gray-600">Species in Database</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">7</div>
                <div className="text-sm text-gray-600">Guide Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">JSON</div>
                <div className="text-sm text-gray-600">Export Format</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">UK</div>
                <div className="text-sm text-gray-600">Market Focused</div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/ai-species" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
              >
                🤖 AI Species Generator
              </Link>
              <Link 
                href="/species" 
                className="btn-primary"
              >
                Generate Species Data
              </Link>
              <Link 
                href="/guides" 
                className="btn-success"
              >
                Create Care Guides
              </Link>
              <Link 
                href="/api/health" 
                target="_blank"
                className="btn-secondary"
              >
                API Health Check
              </Link>
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}