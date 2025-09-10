'use client';

import { useState } from 'react';

interface SpeciesData {
  productId: string;
  type: string;
  scientificName: string;
  commonName: string;
  specifications: {
    'Min Tank Size': string;
    'Temperature': string;
    'pH Range': string;
    'Max Size': string;
    'Diet': string;
    'Group Size': string;
    'Difficulty': string;
    'Temperament': string;
  };
  species?: {
    family: string;
    habitat: string;
    origin: string;
    lifespan: string;
    waterType: string;
    description: string;
  };
  generatedAt?: string;
  aiProvider?: string;
}

interface Product {
  entityId: number;
  name: string;
  path: string;
  brand?: { name: string };
  prices: {
    price: { value: number; currencyCode: string };
    salePrice: { value: number; currencyCode: string } | null;
  };
  defaultImage?: {
    url: string;
    altText: string;
  };
}

export default function SimpleAIGenerator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [generatedData, setGeneratedData] = useState<SpeciesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'openai' | 'mock'>('mock');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');
  const [searchTerm, setSearchTerm] = useState('');

  const loadProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    
    try {
      // Load fish products from riverpark-catalyst-fresh
      const fishSearches = ['cichlid', 'tetra', 'angelfish', 'betta', 'corydoras'];
      const allProducts: Product[] = [];
      
      for (const search of fishSearches) {
        const response = await fetch('http://localhost:3002/api/search/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchTerm: search, limit: 10 })
        });
        
        if (response.ok) {
          const data = await response.json();
          allProducts.push(...(data.products || []));
        }
      }
      
      // Remove duplicates based on entityId
      const uniqueProducts = allProducts.filter((product, index, array) => 
        array.findIndex(p => p.entityId === product.entityId) === index
      );
      
      setProducts(uniqueProducts);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/health/');
      if (response.ok) {
        setConnectionStatus('connected');
        setError(null);
      } else {
        setConnectionStatus('failed');
        setError('Cannot connect to riverpark-catalyst-fresh AI service');
      }
    } catch (err) {
      setConnectionStatus('failed');
      setError('Cannot connect to riverpark-catalyst-fresh AI service on localhost:3002');
    }
  };

  const generateSpeciesData = async (product: Product) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3002/api/ai/generate-species/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.entityId,
          name: product.name,
          provider: aiProvider
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setGeneratedData(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      <section className="semantic-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Connection Status</h2>
            <p className="text-gray-600 mt-1">Test connection to riverpark-catalyst-fresh AI service</p>
          </div>
          <button
            onClick={testConnection}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Test Connection
          </button>
        </div>
        
        {connectionStatus === 'connected' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium">✅ Connected to AI service on localhost:3002</p>
          </div>
        )}
        
        {connectionStatus === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">❌ Connection failed</p>
            <p className="text-red-600 text-sm mt-1">Make sure riverpark-catalyst-fresh is running on localhost:3002</p>
          </div>
        )}
      </section>

      {/* Product Discovery */}
      <section className="semantic-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Real Products from BigCommerce</h2>
            <p className="text-gray-600 mt-1">Load and select fish products from your catalog</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mock"
                  checked={aiProvider === 'mock'}
                  onChange={(e) => setAiProvider(e.target.value as 'openai' | 'mock')}
                  className="mr-2"
                />
                Mock AI
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="openai"
                  checked={aiProvider === 'openai'}
                  onChange={(e) => setAiProvider(e.target.value as 'openai' | 'mock')}
                  className="mr-2"
                />
                OpenAI
              </label>
            </div>
            <button
              onClick={loadProducts}
              disabled={loadingProducts}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
            >
              {loadingProducts ? 'Loading...' : 'Load Products'}
            </button>
          </div>
        </div>

        {/* Search Products */}
        {products.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {/* Products Table */}
        {products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.slice(0, 20).map((product) => (
                  <tr key={product.entityId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.brand && (
                        <div className="text-sm text-gray-500">Brand: {product.brand.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.entityId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      £{product.prices.price.value.toFixed(2)}
                      {product.prices.salePrice && (
                        <div className="text-sm text-green-600">Sale: £{product.prices.salePrice.value.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Fish Species
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => generateSpeciesData(product)}
                        disabled={loading || connectionStatus === 'failed'}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        {loading ? 'Generating...' : 'Generate AI'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length > 20 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing first 20 of {filteredProducts.length} products. Use search to narrow results.
              </div>
            )}
          </div>
        )}

        {products.length === 0 && !loadingProducts && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l7 7-7 7"></path>
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No products loaded yet</p>
            <p className="text-gray-400 text-sm">Click &ldquo;Load Products&rdquo; to fetch real products from BigCommerce</p>
          </div>
        )}

        {/* Status */}
        {loading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-700">Generating species data with AI...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error:</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </section>

      {/* Display Panel */}
      {generatedData && (
        <section className="semantic-section">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated Species Data</h2>
          
          <div className="space-y-6">
            {/* Species Header */}
            <div className="border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-900">{generatedData.commonName}</h3>
              <p className="text-lg text-gray-600 italic">{generatedData.scientificName}</p>
              <p className="text-sm text-gray-500">Product ID: {generatedData.productId}</p>
              {generatedData.aiProvider && (
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  generatedData.aiProvider === 'openai' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {generatedData.aiProvider === 'openai' ? '🤖 OpenAI Generated' : '📝 Mock Data'}
                </span>
              )}
            </div>

            {/* Quick Info Specifications */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Quick Info</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(generatedData.specifications).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">{key}</div>
                    <div className="text-sm text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Species Data */}
            {generatedData.species && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Detailed Information</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Family</div>
                    <div className="text-sm text-gray-900">{generatedData.species.family}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Origin</div>
                    <div className="text-sm text-gray-900">{generatedData.species.origin}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Habitat</div>
                    <div className="text-sm text-gray-900">{generatedData.species.habitat}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Lifespan</div>
                    <div className="text-sm text-gray-900">{generatedData.species.lifespan}</div>
                  </div>
                  {generatedData.species.description && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Description</div>
                      <div className="text-sm text-gray-900">{generatedData.species.description}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* JSON Preview */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">JSON Output</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(generatedData, null, 2)}
              </pre>
            </div>

            {/* File Path Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-1">File Created</h4>
              <p className="text-sm text-green-700">
                Species data is saved automatically in riverpark-catalyst-fresh
              </p>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-medium text-gray-900">Load Products</h3>
            <p className="text-sm text-gray-600">Fetch real fish products from your BigCommerce catalog</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h3 className="font-medium text-gray-900">AI Processing</h3>
            <p className="text-sm text-gray-600">AI generates comprehensive species data using scientific knowledge</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h3 className="font-medium text-gray-900">File Creation</h3>
            <p className="text-sm text-gray-600">JSON file saved to content/fish-species/ directory</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">4</span>
            </div>
            <h3 className="font-medium text-gray-900">Display</h3>
            <p className="text-sm text-gray-600">Data appears on product pages as Quick Info section</p>
          </div>
        </div>
      </section>
    </div>
  );
}