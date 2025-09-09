'use client';

import dynamic from 'next/dynamic';
import { Navigation } from '@/components/Navigation';

const SpeciesAIGenerator = dynamic(() => import('@/components/SpeciesAIGenerator'), {
  ssr: false,
  loading: () => (
    <div className="semantic-layout">
      <div className="semantic-main">
        <div className="animate-pulse space-y-6">
          <div className="semantic-section">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          </div>
          <div className="semantic-section">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="semantic-section">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="semantic-section">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
});

export default function AISpeciesPage() {
  return (
    <>
      <Navigation />
      <div className="semantic-layout">
        <header className="semantic-header">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🤖 AI Species Generator</h1>
                <p className="text-gray-600 mt-1">Automatically discover fish products and generate comprehensive species data using AI</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  Real AI Integration
                </span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="semantic-main">
          <SpeciesAIGenerator />
        </main>
      </div>
    </>
  );
}