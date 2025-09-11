'use client';

import { useState } from 'react';
import RealBigCommerceProducts, { type RealProduct } from './RealBigCommerceProducts';

interface GeneratedContent {
  productId: number;
  type: string;
  basicInfo: {
    scientificName: string;
    commonNames: string[];
    category: string;
    family: string;
    origin: string;
    waterType: string;
  };
  searchKeywords: string[];
  careRequirements: {
    minTankSize: string;
    temperatureRange: string;
    phRange: string;
    maxSize: string;
    diet: string;
    careLevel: string;
    temperament: string;
    socialNeeds: string;
    lifespan: string;
  };
  compatibility: {
    compatibleWith: string[];
    avoidWith: string[];
    tankMateCategories: string[];
  };
  aiContext: {
    whyPopular: string;
    keySellingPoints: string[];
    commonQuestions: Array<{
      question: string;
      answer: string;
    }>;
    alternativeNames: string[];
  };
  relatedProducts: {
    complementaryProducts: string[];
    similarSpecies: string[];
  };
  breeding: {
    breedingType: string;
    breedingDifficulty: string;
    breedingNotes: string;
  };
  metadata: {
    generatedAt: string;
    confidence: string;
    sources: string[];
  };
}

interface SpeciesContent {
  productId: number;
  type: string;
  version: string;
  basicInfo: {
    scientificName: string;
    commonNames: string[];
    category: string;
    family: string;
    origin: string;
    waterType: string;
  };
  careRequirements: {
    minTankSize: string;
    temperatureRange: string;
    phRange: string;
    maxSize: string;
    diet: string;
    careLevel: string;
    temperament: string;
    socialNeeds: string;
    lifespan: string;
  };
  compatibility: {
    compatibleWith: string[];
    avoidWith: string[];
    tankMateCategories: string[];
  };
  breeding: {
    breedingType: string;
    breedingDifficulty: string;
    breedingNotes: string;
  };
  metadata: {
    generatedAt: string;
    lastUpdated: string;
    confidence: string;
    sources: string[];
  };
}

export default function RealProductContentGenerator() {
  const [selectedProduct, setSelectedProduct] = useState<RealProduct | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [speciesContent, setSpeciesContent] = useState<SpeciesContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{
    database: boolean;
    aiSearch: { local?: string; catalyst?: string; saved?: boolean };
    species: { local?: string; catalyst?: string; saved?: boolean };
  } | null>(null);
  const [resending, setResending] = useState(false);
  const [sendingToCatalyst, setSendingToCatalyst] = useState(false);
  
  // Store generated content for each product to persist when switching
  const [productContentMap, setProductContentMap] = useState<Map<number, {
    aiContent: GeneratedContent;
    speciesContent: SpeciesContent;
    storageInfo: { 
      database: boolean; 
      aiSearch: { local?: string; catalyst?: string; saved?: boolean };
      species: { local?: string; catalyst?: string; saved?: boolean };
    } | null;
  }>>(new Map());
  
  // Track which products have generated content for badges
  const [productsWithContent, setProductsWithContent] = useState<Set<number>>(new Set());
  
  // Tab state for switching between AI Search and Species views
  const [activeTab, setActiveTab] = useState<'ai-search' | 'species'>('ai-search');

  const extractScientificName = (productName: string): string => {
    // Extract scientific name from product name (usually in parentheses)
    const match = productName.match(/\((.*?)\)/);
    return match ? match[1] : '';
  };

  const extractCommonName = (productName: string): string => {
    // Get the part before the parentheses as common name
    const parts = productName.split('(');
    return parts[0].trim().replace(/^\d+cm\s*/, ''); // Remove size prefix if present
  };

  // Create species content from AI search data
  const createSpeciesContent = (aiContent: GeneratedContent): SpeciesContent => {
    return {
      productId: aiContent.productId,
      type: 'species',
      version: '1.0',
      basicInfo: aiContent.basicInfo,
      careRequirements: aiContent.careRequirements,
      compatibility: aiContent.compatibility,
      breeding: aiContent.breeding,
      metadata: {
        generatedAt: aiContent.metadata.generatedAt,
        lastUpdated: aiContent.metadata.generatedAt,
        confidence: aiContent.metadata.confidence,
        sources: aiContent.metadata.sources
      }
    };
  };

  // Initialize storage info structure
  const initializeStorageInfo = () => ({
    database: false,
    aiSearch: { saved: false },
    species: { saved: false }
  });

  // Update storage info for a specific file type
  const updateStorageInfo = (fileType: 'aiSearch' | 'species', data: { local?: string; catalyst?: string; saved: boolean }) => {
    setStorageInfo(prev => ({
      ...prev,
      database: prev?.database || false,
      [fileType]: data,
      ...(prev || initializeStorageInfo())
    }));
  };

  // Save files individually to track each one
  const saveFilesIndividually = async (aiContent: GeneratedContent, speciesContent: SpeciesContent) => {
    if (!selectedProduct) return;

    try {
      // Save AI search file
      console.log('📄 Saving AI search file...');
      const aiResponse = await fetch('/api/ai-content/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: aiContent.productId,
          contentType: 'ai-search',
          contentData: aiContent,
          autoSave: true
        }),
      });

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        updateStorageInfo('aiSearch', {
          local: aiResult.paths?.local,
          catalyst: aiResult.paths?.catalyst,
          saved: true
        });
        console.log('✅ AI search file saved:', aiResult.paths);
      } else {
        updateStorageInfo('aiSearch', { saved: false });
      }

      // Save species file
      console.log('🐟 Saving species file...');
      const speciesResponse = await fetch('/api/ai-content/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: speciesContent.productId,
          contentType: 'species',
          contentData: speciesContent,
          autoSave: true
        }),
      });

      if (speciesResponse.ok) {
        const speciesResult = await speciesResponse.json();
        updateStorageInfo('species', {
          local: speciesResult.paths?.local,
          catalyst: speciesResult.paths?.catalyst,
          saved: true
        });
        console.log('✅ Species file saved:', speciesResult.paths);
      } else {
        updateStorageInfo('species', { saved: false });
      }

    } catch (error) {
      console.error('❌ Error saving files:', error);
      updateStorageInfo('aiSearch', { saved: false });
      updateStorageInfo('species', { saved: false });
    }
  };

  const handleProductSelect = (product: RealProduct) => {
    setSelectedProduct(product);
    setError(null);
    
    // Restore previously generated content for this product if it exists
    const existingContent = productContentMap.get(product.entityId);
    if (existingContent) {
      setGeneratedContent(existingContent.aiContent);
      setSpeciesContent(existingContent.speciesContent);
      setStorageInfo(existingContent.storageInfo);
    } else {
      setGeneratedContent(null);
      setSpeciesContent(null);
      setStorageInfo(null);
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedProduct) return;

    setGenerating(true);
    setError(null);
    
    // Initialize storage info for tracking both file saves
    setStorageInfo(initializeStorageInfo());

    try {
      console.log('🤖 Generating AI content for product:', selectedProduct.name);

      const scientificName = extractScientificName(selectedProduct.name);
      const commonName = extractCommonName(selectedProduct.name);

      // Convert RealProduct to the format expected by the AI search generator
      const realProductData = {
        entityId: selectedProduct.entityId,
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        description: selectedProduct.description,
        plainTextDescription: selectedProduct.description ? 
          selectedProduct.description.replace(/<[^>]*>/g, '') : null,
        brand: selectedProduct.brand,
        prices: {
          price: {
            value: selectedProduct.price,
            currencyCode: 'GBP'
          }
        }
      };

      const response = await fetch('/api/ai-search-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.entityId.toString(),
          name: selectedProduct.name,
          scientificName: scientificName,
          commonName: commonName,
          provider: 'openai',
          realProductData: realProductData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const content = await response.json();
      const species = createSpeciesContent(content);
      
      setGeneratedContent(content);
      setSpeciesContent(species);
      
      // Store content in the map for persistence when switching products
      const newMap = new Map(productContentMap);
      newMap.set(selectedProduct.entityId, {
        aiContent: content,
        speciesContent: species,
        storageInfo: initializeStorageInfo()
      });
      setProductContentMap(newMap);
      
      // Add to products with content set for badge display
      const newSet = new Set(productsWithContent);
      newSet.add(selectedProduct.entityId);
      setProductsWithContent(newSet);
      
      console.log('✅ AI content generated successfully');
      
      // Save files individually to track progress
      await saveFilesIndividually(content, species);

    } catch (err) {
      console.error('❌ Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedContent) return;

    const dataStr = JSON.stringify(generatedContent, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-search-data-${generatedContent.productId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResendFiles = async () => {
    if (!generatedContent || !speciesContent) return;

    setResending(true);
    try {
      await saveFilesIndividually(generatedContent, speciesContent);
    } catch (error) {
      console.error('❌ Error resending files:', error);
    } finally {
      setResending(false);
    }
  };

  const handleSendToCatalyst = async () => {
    if (!generatedContent || !speciesContent) return;

    setSendingToCatalyst(true);
    try {
      await saveFilesIndividually(generatedContent, speciesContent);
    } catch (error) {
      console.error('❌ Error sending files to Catalyst:', error);
    } finally {
      setSendingToCatalyst(false);
    }
  };

  return (
    <div className="h-full flex bg-gray-50 overflow-hidden">
      {/* Left Panel - Product List */}
      <div className="w-2/5 bg-white shadow-sm border-r border-gray-200">
        <RealBigCommerceProducts
          onProductSelect={handleProductSelect}
          selectedProductId={selectedProduct?.entityId}
          productsWithContent={productsWithContent}
        />
      </div>

      {/* Right Panel - Content Generation */}
      <div className="w-3/5 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Content Generator</h2>
              <p className="text-sm text-gray-600">
                Generate AI search data and species reference files from real BigCommerce products
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {!selectedProduct ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Product</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Choose a product from the list to generate AI search data and species reference files.
                </p>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>• AI search optimization data</p>
                  <p>• Species reference information</p>
                  <p>• Two files: [productId]-ai-search.json & [productId]-species.json</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8">
              {/* Selected Product Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Product</h3>
                <div className="flex items-start space-x-4">
                  {selectedProduct.defaultImage && (
                    <img
                      src={selectedProduct.defaultImage.url}
                      alt={selectedProduct.defaultImage.altText}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{selectedProduct.name}</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">ID:</span>
                        <span className="ml-2 text-gray-900">{selectedProduct.entityId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-2 text-gray-900 font-medium">£{selectedProduct.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="mb-6">
                <button
                  onClick={handleGenerateContent}
                  disabled={generating}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Generating AI Content...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate AI Content</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 text-red-500 mt-0.5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-red-800 font-medium">Generation Failed</h4>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Content Display */}
              {generatedContent && (
                <div className="space-y-8">
                  {/* Success Header with Actions */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-green-800 font-medium">Content Generated Successfully</h4>
                          <p className="text-green-700 text-sm">AI search data and species data have been automatically saved</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleDownload}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Download</span>
                          </div>
                        </button>
                        <button
                          onClick={handleSendToCatalyst}
                          disabled={sendingToCatalyst}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center space-x-1">
                            {sendingToCatalyst ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                            <span>{sendingToCatalyst ? 'Sending...' : 'Send to Catalyst'}</span>
                          </div>
                        </button>
                        <button
                          onClick={handleResendFiles}
                          disabled={resending}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center space-x-1">
                            {resending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                            <span>{resending ? 'Resending...' : 'Resend'}</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Storage Status */}
                    <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                      <h5 className="text-green-800 font-medium mb-3 text-sm">File Storage Status</h5>
                      
                      {/* AI Search File Status */}
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${storageInfo?.aiSearch?.saved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span className="text-blue-800 font-medium text-sm">AI Search File</span>
                          <span className="text-xs text-blue-600">({selectedProduct?.entityId || 'N/A'}-ai-search.json)</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Catalyst Project:</span>
                            <span className={`font-medium ${storageInfo?.aiSearch?.saved ? 'text-green-600' : 'text-yellow-600'}`}>
                              {storageInfo?.aiSearch?.saved ? 'Saved' : 'Saving...'}
                            </span>
                          </div>
                          {storageInfo?.aiSearch?.catalyst && (
                            <div className="text-gray-500 font-mono break-all bg-white p-1 rounded text-xs">
                              /frontend/content/ai-search/
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Species File Status */}
                      <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${storageInfo?.species?.saved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span className="text-purple-800 font-medium text-sm">Species File</span>
                          <span className="text-xs text-purple-600">({selectedProduct?.entityId || 'N/A'}-species.json)</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Catalyst Project:</span>
                            <span className={`font-medium ${storageInfo?.species?.saved ? 'text-green-600' : 'text-yellow-600'}`}>
                              {storageInfo?.species?.saved ? 'Saved' : 'Saving...'}
                            </span>
                          </div>
                          {storageInfo?.species?.catalyst && (
                            <div className="text-gray-500 font-mono break-all bg-white p-1 rounded text-xs">
                              /frontend/content/species/
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Database Status */}
                      <div className="p-2 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${storageInfo?.database ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-gray-700 text-xs">Database: {storageInfo?.database ? 'Stored' : 'Not configured'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabbed Content Preview */}
                  <div className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                      <nav className="flex space-x-8">
                        <button
                          onClick={() => setActiveTab('ai-search')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'ai-search'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          AI Search Data
                        </button>
                        <button
                          onClick={() => setActiveTab('species')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'species'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Species Reference
                        </button>
                      </nav>
                    </div>

                    {/* AI Search Tab Content */}
                    {activeTab === 'ai-search' && (
                      <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Scientific Name</span>
                                <p className="text-gray-900 font-medium">{generatedContent.basicInfo.scientificName}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Origin</span>
                                <p className="text-gray-900">{generatedContent.basicInfo.origin}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Category</span>
                                <p className="text-gray-900">{generatedContent.basicInfo.category}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Water Type</span>
                                <p className="text-gray-900">{generatedContent.basicInfo.waterType}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Search Keywords */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Search Keywords</h4>
                          <div className="flex flex-wrap gap-3">
                            {generatedContent.searchKeywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full text-sm font-medium shadow-sm"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* AI Context */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">AI Context</h4>
                          <div className="space-y-6">
                            <div>
                              <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2 block">Why Popular</span>
                              <p className="text-gray-700 leading-relaxed">{generatedContent.aiContext.whyPopular}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3 block">Key Selling Points</span>
                              <div className="space-y-2">
                                {generatedContent.aiContext.keySellingPoints.map((point, index) => (
                                  <div key={index} className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-gray-700">{point}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Full AI Search JSON */}
                        <details className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                          <summary className="font-bold text-gray-900 text-lg cursor-pointer hover:text-gray-800 transition-colors">
                            <div className="flex items-center space-x-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                              <span>View Full AI Search JSON</span>
                            </div>
                          </summary>
                          <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-x-auto">
                            <pre className="text-sm text-green-400 font-mono">
                              {JSON.stringify(generatedContent, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Species Tab Content */}
                    {activeTab === 'species' && speciesContent && (
                      <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Scientific Name</span>
                                <p className="text-gray-900 font-medium">{speciesContent.basicInfo.scientificName}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Origin</span>
                                <p className="text-gray-900">{speciesContent.basicInfo.origin}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Category</span>
                                <p className="text-gray-900">{speciesContent.basicInfo.category}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Water Type</span>
                                <p className="text-gray-900">{speciesContent.basicInfo.waterType}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Care Requirements */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Care Requirements</h4>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Tank Size</span>
                                <p className="text-gray-900 font-medium">{speciesContent.careRequirements.minTankSize}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">pH Range</span>
                                <p className="text-gray-900">{speciesContent.careRequirements.phRange}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Diet</span>
                                <p className="text-gray-900">{speciesContent.careRequirements.diet}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Social Needs</span>
                                <p className="text-gray-900">{speciesContent.careRequirements.socialNeeds}</p>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Temperature</span>
                                <p className="text-gray-900">{speciesContent.careRequirements.temperatureRange}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Care Level</span>
                                <p className="text-gray-900">{speciesContent.careRequirements.careLevel}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Max Size</span>
                                <p className="text-gray-900">{speciesContent.careRequirements.maxSize}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Lifespan</span>
                                <p className="text-gray-900">{speciesContent.careRequirements.lifespan}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Compatibility */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Compatibility</h4>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2 block">Compatible With</span>
                                <div className="space-y-1">
                                  {speciesContent.compatibility.compatibleWith.map((species, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                      <span className="text-gray-700">{species}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2 block">Avoid With</span>
                                <div className="space-y-1">
                                  {speciesContent.compatibility.avoidWith.map((species, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                      <span className="text-gray-700">{species}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Breeding Information */}
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Breeding Information</h4>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Type</span>
                                <p className="text-gray-900">{speciesContent.breeding.breedingType}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Difficulty</span>
                                <p className="text-gray-900">{speciesContent.breeding.breedingDifficulty}</p>
                              </div>
                            </div>
                          </div>
                          {speciesContent.breeding.breedingNotes && (
                            <div className="mt-4">
                              <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2 block">Notes</span>
                              <p className="text-gray-700 leading-relaxed">{speciesContent.breeding.breedingNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Full Species JSON */}
                        <details className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                          <summary className="font-bold text-gray-900 text-lg cursor-pointer hover:text-gray-800 transition-colors">
                            <div className="flex items-center space-x-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                              <span>View Full Species JSON</span>
                            </div>
                          </summary>
                          <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-x-auto">
                            <pre className="text-sm text-green-400 font-mono">
                              {JSON.stringify(speciesContent, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}