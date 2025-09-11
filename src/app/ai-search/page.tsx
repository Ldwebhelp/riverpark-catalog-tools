'use client';

import dynamic from 'next/dynamic';
import WebAppLayout from '@/components/WebAppLayout';

const AISearchGenerator = dynamic(() => import('@/components/AISearchGenerator'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex">
      <div className="w-1/2 border-r border-gray-200 animate-pulse">
        <div className="h-full bg-gray-100"></div>
      </div>
      <div className="w-1/2 animate-pulse">
        <div className="h-full bg-gray-50"></div>
      </div>
    </div>
  )
});

export default function AISearchPage() {
  return (
    <WebAppLayout>
      <AISearchGenerator />
    </WebAppLayout>
  );
}