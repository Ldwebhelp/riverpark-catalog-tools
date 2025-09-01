import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { AIEnhancedCareGuideGenerator } from '@/components/AIEnhancedCareGuideGenerator';

export default function AIGuidesPage() {
  return (
    <>
      <Navigation />
      <div className="semantic-layout">
        <header className="semantic-header">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <nav className="semantic-nav">
                  <Link href="/">Dashboard</Link>
                  <span>/</span>
                  <span className="text-blue-600">AI Care Guides</span>
                </nav>
                <h1 className="text-3xl font-bold text-gray-900">🤖 AI-Enhanced Care Guide Generator</h1>
                <p className="text-gray-600 mt-1">Revolutionary AI system for UK aquatics retail - No other retailer has this!</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/species" 
                  className="btn-secondary"
                >
                  Species Generator
                </Link>
                <Link 
                  href="/guides" 
                  className="btn-secondary"
                >
                  Basic Guides
                </Link>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  🇬🇧 UK Innovation
                </span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="semantic-main">
          <AIEnhancedCareGuideGenerator />
        </main>
        
        <footer className="bg-white border-t mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-gray-600">
              <p>&copy; 2024 Riverpark Catalyst - AI-Powered Aquarium Business Tools</p>
              <p className="text-sm mt-1">World&apos;s first AI product recommendation system for aquarium care guides</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}