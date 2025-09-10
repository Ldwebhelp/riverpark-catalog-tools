'use client';

import { useState, useEffect } from 'react';
import WebAppLayout from '@/components/WebAppLayout';

// Simple product interface
interface SimpleProduct {
  id: number;
  name: string;
  sku?: string;
}

export default function ProductSelectorPage() {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SimpleProduct | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadSimpleProducts();
  }, []);

  const loadSimpleProducts = async () => {
    setLoading(true);
    try {
      // Just load some simple test products for now
      const testProducts = [
        { id: 113, name: 'Electric Yellow Cichlid (Labidochromis caeruleus)', sku: 'EYC001' },
        { id: 114, name: 'Blue Dolphin Cichlid (Cyrtocara moorii)', sku: 'BDC002' },
        { id: 115, name: 'Red Zebra Cichlid (Maylandia zebra)', sku: 'RZC003' },
        { id: 116, name: 'Yellow Lab Cichlid (Labidochromis caeruleus)', sku: 'YLC004' },
        { id: 117, name: 'Peacock Cichlid (Aulonocara sp.)', sku: 'PC005' }
      ];
      
      setProducts(testProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    if (!selectedProduct) return;
    
    setGenerating(true);
    try {
      // Simple generation - just create basic JSON
      const content = {
        productId: selectedProduct.id.toString(),
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        careGuide: {
          temperature: '24-26°C',
          tankSize: '120L minimum',
          pH: '7.5-8.5',
          diet: 'Omnivore - cichlid pellets',
          groupSize: '6+ fish',
          difficulty: 'Beginner friendly'
        },
        generatedAt: new Date().toISOString()
      };
      
      setGeneratedContent(content);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadJSON = () => {
    if (!generatedContent) return;
    
    const blob = new Blob([JSON.stringify(generatedContent, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product_${generatedContent.productId}_care_guide.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <WebAppLayout>
        <div className="p-8">
          <div>Loading products...</div>
        </div>
      </WebAppLayout>
    );
  }

  return (
    <WebAppLayout>
      <div className="h-full flex">
        {/* Left: Product List */}
        <div className="w-1/2 p-6 border-r">
          <h2 className="text-xl font-bold mb-4">Select Product</h2>
          
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`p-3 border rounded cursor-pointer ${
                  selectedProduct?.id === product.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-600">ID: {product.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Generate & Results */}
        <div className="w-1/2 p-6">
          {selectedProduct ? (
            <div>
              <h3 className="text-lg font-bold mb-4">Selected: {selectedProduct.name}</h3>
              
              <button
                onClick={generateContent}
                disabled={generating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded mb-6 hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Care Guide'}
              </button>

              {generatedContent && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Generated Content</h4>
                    <button
                      onClick={downloadJSON}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Download JSON
                    </button>
                  </div>
                  
                  <div className="bg-gray-900 text-green-400 p-4 rounded text-sm">
                    <pre>{JSON.stringify(generatedContent, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              Select a product from the list to get started
            </div>
          )}
        </div>
      </div>
    </WebAppLayout>
  );
}