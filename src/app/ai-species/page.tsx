'use client';

import dynamic from 'next/dynamic';

const SpeciesAIGenerator = dynamic(() => import('@/components/SpeciesAIGenerator'), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
});

export default function AISpeciesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SpeciesAIGenerator />
    </div>
  );
}