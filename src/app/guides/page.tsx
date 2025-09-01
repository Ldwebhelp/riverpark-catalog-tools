'use client';

import { useState } from 'react';
import { CareGuideGenerator } from '@/components/CareGuideGenerator';

export default function GuidesPage() {
  return (
    <div className="semantic-layout">
      <header className="semantic-header">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Care Guide Generator</h1>
          <p className="text-gray-600 mt-2">Generate comprehensive 7-section care guides for your aquarium species</p>
        </div>
      </header>

      <main className="semantic-main">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <CareGuideGenerator />
        </div>
      </main>
    </div>
  );
}