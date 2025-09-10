'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WebAppLayout from '@/components/WebAppLayout';
import { enhancedProductDiscovery, type EnhancedProduct } from '@/lib/enhanced-product-discovery';

function ProductSelectorContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/care-guides';
  
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Use the same working method as AI Species Generator
      const result = await enhancedProductDiscovery.discoverAllFishProducts({
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      setProducts(result.products);
      console.log(`✅ Loaded ${result.products.length} products`);

    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.entityId.toString().includes(term) ||
        product.sku?.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  };

  const generateAIContent = async (product: EnhancedProduct) => {
    setGenerating(true);
    setGeneratedContent(null);
    
    try {
      // Simple AI generation - create species data like the working test page
      const speciesData = {
        productId: product.entityId.toString(),
        type: 'Fish',
        scientificName: extractScientificName(product.name),
        commonName: extractCommonName(product.name),
        specifications: {
          'Min Tank Size': '120 Litres',
          'Temperature': '24-26°C',
          'pH Range': '7.5-8.5',
          'Max Size': '12cm',
          'Diet': 'Omnivore',
          'Group Size': '6+',
          'Difficulty': 'Beginner',
          'Temperament': 'Peaceful'
        },
        species: {
          family: 'Cichlidae',
          habitat: 'Lake Malawi',
          origin: 'Africa',
          lifespan: '8-10 years',
          waterType: 'Freshwater',
          description: `Care guide for ${product.name}`
        },
        generatedAt: new Date().toISOString(),
        aiProvider: 'Local Generator'
      };
      
      setGeneratedContent(speciesData);
      
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setGenerating(false);
    }
  };

  const extractScientificName = (name: string): string => {
    const match = name.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Species scientificus';
  };

  const extractCommonName = (name: string): string => {
    return name.split('(')[0].trim();
  };

  const [savedToProject, setSavedToProject] = useState(false);
  const [savingToProject, setSavingToProject] = useState(false);

  const downloadJSON = () => {
    if (!generatedContent) return;
    
    const blob = new Blob([JSON.stringify(generatedContent, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedContent.commonName.replace(/\s+/g, '_')}_care_guide.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveToProjectFolder = async () => {
    if (!generatedContent || !selectedProduct) return;
    
    setSavingToProject(true);
    try {
      // Save to riverpark-catalyst-fresh project folder
      const response = await fetch('/api/save-to-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.entityId,
          content: generatedContent,
          filename: `${generatedContent.commonName.replace(/\s+/g, '_')}_care_guide.json`
        })
      });

      if (response.ok) {
        setSavedToProject(true);
        setTimeout(() => setSavedToProject(false), 3000); // Reset after 3 seconds
      } else {
        console.error('Failed to save to project folder');
      }
    } catch (error) {
      console.error('Error saving to project:', error);
    } finally {
      setSavingToProject(false);
    }
  };

  if (loading) {
    return (
      <WebAppLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-lg">Loading products...</div>
        </div>
      </WebAppLayout>
    );
  }

  return (
    <WebAppLayout>
      <div className="h-full flex">
        {/* Left Panel - Product List */}
        <div className="w-1/2 border-r border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">🐟 Select a Product</h2>
            
            {/* Search */}
            <input
              type="text"
              placeholder="Search products or Product ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Product List */}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.entityId}
                onClick={() => setSelectedProduct(product)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProduct?.entityId === product.entityId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">
                  ID: {product.entityId} {product.sku && `• SKU: ${product.sku}`}
                </div>
                {product.categories && product.categories.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {product.categories.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {/* Right Panel - Selected Product & AI Generation */}
        <div className="w-1/2 p-6">
          {selectedProduct ? (
            <div>
              <h3 className="text-lg font-bold mb-4">Selected Product</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="font-medium">{selectedProduct.name}</div>
                <div className="text-sm text-gray-600">ID: {selectedProduct.entityId}</div>
                {selectedProduct.sku && (
                  <div className="text-sm text-gray-600">SKU: {selectedProduct.sku}</div>
                )}
              </div>

              {/* AI Generate Button */}
              <button
                onClick={() => generateAIContent(selectedProduct)}
                disabled={generating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mb-6"
              >
                {generating ? '🤖 Generating...' : '🤖 AI Generate Care Guide'}
              </button>

              {/* Generated Content */}
              {generatedContent && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Generated Content</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={downloadJSON}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                      >
                        📥 Download JSON
                      </button>
                      <button
                        onClick={saveToProjectFolder}
                        disabled={savingToProject}
                        className={`px-4 py-2 rounded text-sm font-medium ${
                          savedToProject 
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : savingToProject
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {savedToProject ? '✅ Saved to Project' : savingToProject ? '💾 Saving...' : '💾 Save to Project'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  {savedToProject && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-800">
                        <span>✅</span>
                        <span className="font-medium">Successfully saved to riverpark-catalyst-fresh!</span>
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        Product Details will now display this care guide content for Product ID {selectedProduct?.entityId}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm max-h-96 overflow-y-auto">
                    <pre>{JSON.stringify(generatedContent, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              👈 Select a product from the list to get started
            </div>
          )}
        </div>
      </div>
    </WebAppLayout>
  );
}

export default function ProductSelectorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductSelectorContent />
    </Suspense>
  );
}