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

interface TestProduct {
  productId: string;
  name: string;
  scientificName?: string;
  commonName?: string;
}

const TEST_PRODUCTS: TestProduct[] = [
  {
    productId: '113',
    name: 'Electric Yellow Cichlid (Labidochromis caeruleus) 5cm',
    scientificName: 'Labidochromis caeruleus',
    commonName: 'Electric Yellow Cichlid'
  },
  {
    productId: '999',
    name: 'Neon Tetra (Paracheirodon innesi) 2cm',
    scientificName: 'Paracheirodon innesi', 
    commonName: 'Neon Tetra'
  },
  {
    productId: '998',
    name: 'Betta Fish (Betta splendens) Male',
    scientificName: 'Betta splendens',
    commonName: 'Siamese Fighting Fish'
  },
  {
    productId: '997',
    name: 'Bronze Corydoras (Corydoras paleatus) 4cm',
    scientificName: 'Corydoras paleatus',
    commonName: 'Bronze Corydoras'
  }
];

export default function SimpleAIGenerator() {
  const [generatedData, setGeneratedData] = useState<SpeciesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customProduct, setCustomProduct] = useState({
    productId: '',
    name: '',
    scientificName: '',
    commonName: ''
  });
  const [aiProvider, setAiProvider] = useState<'openai' | 'mock'>('mock');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        setConnectionStatus('connected');
        setError(null);
      } else {
        setConnectionStatus('failed');
        setError('Cannot connect to riverpark-catalyst-fresh AI service');
      }
    } catch (err) {
      setConnectionStatus('failed');
      setError('Cannot connect to riverpark-catalyst-fresh AI service on localhost:3000');
    }
  };

  const generateSpeciesData = async (product: TestProduct) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/generate-species', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.productId,
          name: product.name,
          scientificName: product.scientificName,
          commonName: product.commonName,
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

  const generateCustomProduct = () => {
    if (!customProduct.productId || !customProduct.name) {
      setError('Product ID and Name are required');
      return;
    }
    
    generateSpeciesData(customProduct);
  };

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
            <p className="text-green-700 font-medium">✅ Connected to AI service on localhost:3000</p>
          </div>
        )}
        
        {connectionStatus === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">❌ Connection failed</p>
            <p className="text-red-600 text-sm mt-1">Make sure riverpark-catalyst-fresh is running on localhost:3000</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="semantic-section">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Species Data</h2>
          
          {/* AI Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mock"
                  checked={aiProvider === 'mock'}
                  onChange={(e) => setAiProvider(e.target.value as 'openai' | 'mock')}
                  className="mr-2"
                />
                Mock AI (Fast Testing)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="openai"
                  checked={aiProvider === 'openai'}
                  onChange={(e) => setAiProvider(e.target.value as 'openai' | 'mock')}
                  className="mr-2"
                />
                OpenAI (Real AI)
              </label>
            </div>
          </div>

          {/* Pre-defined Products */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Test Products</h3>
            <div className="space-y-2">
              {TEST_PRODUCTS.map((product) => (
                <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{product.commonName}</div>
                    <div className="text-sm text-gray-600">{product.scientificName}</div>
                    <div className="text-xs text-gray-500">ID: {product.productId}</div>
                  </div>
                  <button
                    onClick={() => generateSpeciesData(product)}
                    disabled={loading || connectionStatus === 'failed'}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Product Form */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Custom Product</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product ID *
                </label>
                <input
                  type="text"
                  value={customProduct.productId}
                  onChange={(e) => setCustomProduct({...customProduct, productId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={customProduct.name}
                  onChange={(e) => setCustomProduct({...customProduct, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Angel Fish (Pterophyllum scalare) 8cm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scientific Name
                </label>
                <input
                  type="text"
                  value={customProduct.scientificName}
                  onChange={(e) => setCustomProduct({...customProduct, scientificName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Pterophyllum scalare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Common Name
                </label>
                <input
                  type="text"
                  value={customProduct.commonName}
                  onChange={(e) => setCustomProduct({...customProduct, commonName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Freshwater Angelfish"
                />
              </div>
              <button
                onClick={generateCustomProduct}
                disabled={loading || connectionStatus === 'failed'}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                Generate Custom Species Data
              </button>
            </div>
          </div>

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
        </div>

        {/* Display Panel */}
        <div className="semantic-section">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated Species Data</h2>
          
          {generatedData ? (
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
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No species data generated yet</p>
              <p className="text-gray-400 text-sm">Select a product above to generate AI species data</p>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <section className="semantic-section">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-medium text-gray-900">Product Input</h3>
            <p className="text-sm text-gray-600">Enter product details manually or select from test products</p>
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