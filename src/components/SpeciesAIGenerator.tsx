'use client';

import { useState, useRef, useCallback } from 'react';
import { aiClient, type AISpeciesRequest, type BatchGenerationProgress } from '@/lib/ai-client';
import { productDiscovery, getFishForAIGeneration, type ProductInfo } from '@/lib/product-discovery';

interface ConnectionStatus {
  aiService: { connected: boolean; error?: string };
  bigcommerce: { connected: boolean; error?: string; storeInfo?: any };
}

interface GenerationStats {
  totalProducts: number;
  totalGenerated: number;
  totalFailed: number;
  lastGeneration?: string;
}

export default function SpeciesAIGenerator() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<BatchGenerationProgress | null>(null);
  const [generationStats, setGenerationStats] = useState<GenerationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'openai' | 'mock'>('openai');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [includeProductRecommendations, setIncludeProductRecommendations] = useState(true);
  const [allProducts, setAllProducts] = useState<ProductInfo[]>([]);

  // Refs for batch processing
  const isGenerating = useRef(false);

  const addLogMessage = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const testConnections = async () => {
    setLoading(true);
    addLogMessage('🔍 Testing connections...');

    try {
      // Test AI service
      const aiHealth = await aiClient.healthCheck();
      
      // Test BigCommerce
      const bcTest = await productDiscovery.testConnection();

      const status: ConnectionStatus = {
        aiService: { 
          connected: aiHealth.available, 
          error: aiHealth.error 
        },
        bigcommerce: { 
          connected: bcTest.connected, 
          error: bcTest.error,
          storeInfo: bcTest.storeInfo
        }
      };

      setConnectionStatus(status);
      
      addLogMessage(`✅ AI Service: ${aiHealth.available ? 'Connected' : 'Failed'}`);
      addLogMessage(`✅ BigCommerce: ${bcTest.connected ? 'Connected' : 'Using Mock Data'}`);

    } catch (error) {
      addLogMessage(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const discoverProducts = async () => {
    setLoading(true);
    addLogMessage('🔍 Discovering products...');

    try {
      // Get fish products for species generation
      const fishProducts = await getFishForAIGeneration({ limit: 100 });
      setProducts(fishProducts);
      
      // Get all products for AI recommendations (if enabled)
      if (includeProductRecommendations) {
        addLogMessage('🛒 Loading all products for AI recommendations...');
        const allProductsResult = await productDiscovery.discoverProducts({ limit: 500 });
        setAllProducts(allProductsResult.products);
        addLogMessage(`✅ Loaded ${allProductsResult.products.length} products for recommendations`);
      }
      
      // Get categories for filtering
      const allCategories = await productDiscovery.getProductCategories();
      setCategories(allCategories.filter(cat => 
        cat.toLowerCase().includes('fish') || 
        cat.toLowerCase().includes('livestock') ||
        cat.toLowerCase().includes('cichlid') ||
        cat.toLowerCase().includes('tetra')
      ));

      addLogMessage(`✅ Discovered ${fishProducts.length} fish products`);

    } catch (error) {
      addLogMessage(`❌ Product discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSingleSpecies = async (product: ProductInfo) => {
    const generationType = includeProductRecommendations ? 'ecosystem' : 'species data';
    addLogMessage(`🤖 Generating ${generationType} for ${product.name}...`);

    try {
      const request: AISpeciesRequest = {
        productId: product.productId,
        name: product.name,
        provider: aiProvider,
        availableProducts: includeProductRecommendations ? allProducts : undefined,
        includeProductRecommendations
      };

      let result;
      if (includeProductRecommendations) {
        // Use ecosystem generation for enhanced AI with product recommendations
        const ecosystemData = await aiClient.generateEcosystem(request);
        
        // Save the ecosystem data using the save endpoint
        const saveResult = await aiClient.saveSpeciesData(ecosystemData.species);
        
        result = {
          success: saveResult.success,
          productId: product.productId,
          fileName: `${product.productId}-ecosystem.json`,
          filePath: saveResult.filePath,
          error: saveResult.error,
          duration: 0 // We don't track duration for this flow yet
        };
        
        if (result.success) {
          addLogMessage(`📊 Generated ecosystem with ${Object.keys(ecosystemData.productEcosystem?.equipment || {}).length} equipment categories`);
        }
      } else {
        // Use regular species generation
        result = await aiClient.generateAndSave(request);
      }
      
      if (result.success) {
        addLogMessage(`✅ Generated: ${product.name} (${result.duration}ms)`);
        return result;
      } else {
        addLogMessage(`❌ Failed: ${product.name} - ${result.error}`);
        return result;
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLogMessage(`❌ Error generating ${product.name}: ${errorMsg}`);
      throw error;
    }
  };

  const generateBatchSpecies = async () => {
    if (isGenerating.current) return;
    
    const selectedProductList = products.filter(p => selectedProducts.has(p.productId));
    
    if (selectedProductList.length === 0) {
      addLogMessage('⚠️ No products selected for batch generation');
      return;
    }

    isGenerating.current = true;
    addLogMessage(`🚀 Starting batch generation for ${selectedProductList.length} products...`);

    try {
      const requests: AISpeciesRequest[] = selectedProductList.map(product => ({
        productId: product.productId,
        name: product.name,
        provider: aiProvider,
        availableProducts: includeProductRecommendations ? allProducts : undefined,
        includeProductRecommendations
      }));

      const result = await aiClient.batchGenerate(requests, {
        concurrency: 3,
        skipExisting: true,
        onProgress: (progress) => {
          setBatchProgress(progress);
          if (progress.current) {
            addLogMessage(`🔄 Processing: ${progress.current}`);
          }
        }
      });

      setBatchProgress(result);
      addLogMessage(`🎉 Batch completed: ${result.completed} successful, ${result.failed} failed`);

      // Update stats
      setGenerationStats({
        totalProducts: products.length,
        totalGenerated: result.completed,
        totalFailed: result.failed,
        lastGeneration: new Date().toISOString()
      });

    } catch (error) {
      addLogMessage(`❌ Batch generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isGenerating.current = false;
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    const filteredProducts = getFilteredProducts();
    setSelectedProducts(new Set(filteredProducts.map(p => p.productId)));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || 
        product.categories?.some(cat => cat.includes(categoryFilter));

      return matchesSearch && matchesCategory;
    });
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="space-y-8">
      {/* Controls */}
      <section className="semantic-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Controls</h2>
            <p className="text-gray-600 mt-1">
              Connect to services and manage AI species generation
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLog(!showLog)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showLog 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showLog ? 'Hide' : 'Show'} Log
            </button>
          </div>
        </div>
      </section>

      {/* Connection Status */}
      <section className="semantic-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <button
            onClick={testConnections}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Connections'}
          </button>
        </div>

        {connectionStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              connectionStatus.aiService.connected 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="font-medium">AI Service</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  connectionStatus.aiService.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus.aiService.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {connectionStatus.aiService.connected 
                  ? 'riverpark-catalyst-fresh AI system ready'
                  : connectionStatus.aiService.error
                }
              </p>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              connectionStatus.bigcommerce.connected 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Product Source</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  connectionStatus.bigcommerce.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {connectionStatus.bigcommerce.connected ? 'BigCommerce' : 'Mock Data'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {connectionStatus.bigcommerce.connected 
                  ? `Connected to ${connectionStatus.bigcommerce.storeInfo?.name || 'BigCommerce store'}`
                  : 'Using mock fish product data for testing'
                }
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Product Discovery */}
      <section className="semantic-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Discovery</h3>
          <button
            onClick={discoverProducts}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Discovering...' : 'Discover Fish Products'}
          </button>
        </div>

        {products.length > 0 && (
          <div className="space-y-4">
            {/* Filters and Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm text-green-800 font-medium">
                  🤖 OpenAI Real AI Only (No Mock Data)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeProductRecommendations"
                  checked={includeProductRecommendations}
                  onChange={(e) => setIncludeProductRecommendations(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeProductRecommendations" className="text-sm text-gray-700">
                  🛒 Include Product Recommendations
                </label>
              </div>

              <button
                onClick={selectAllProducts}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Select All ({filteredProducts.length})
              </button>

              <button
                onClick={deselectAllProducts}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Deselect All
              </button>
            </div>

            {/* Batch Generation Controls */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <h4 className="font-medium text-blue-900">
                  Batch Generation ({selectedProducts.size} selected)
                </h4>
                {includeProductRecommendations && allProducts.length > 0 && (
                  <div className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    📦 {allProducts.length} products available for AI recommendations
                  </div>
                )}
                {batchProgress && (
                  <div className="text-sm text-blue-700">
                    {batchProgress.status === 'running' 
                      ? `Processing: ${batchProgress.completed}/${batchProgress.total}`
                      : `Completed: ${batchProgress.completed} successful, ${batchProgress.failed} failed`
                    }
                  </div>
                )}
              </div>
              
              <button
                onClick={generateBatchSpecies}
                disabled={selectedProducts.size === 0 || isGenerating.current}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isGenerating.current ? 'Generating...' : `Generate ${selectedProducts.size} Species Files`}
              </button>
            </div>

            {/* Progress Bar */}
            {batchProgress && batchProgress.status === 'running' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress: {batchProgress.completed}/{batchProgress.total}</span>
                  <span>{Math.round((batchProgress.completed / batchProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(batchProgress.completed / batchProgress.total) * 100}%` 
                    }}
                  ></div>
                </div>
                {batchProgress.current && (
                  <div className="text-sm text-blue-600">
                    Currently processing: {batchProgress.current}
                  </div>
                )}
              </div>
            )}

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-6 py-3">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.has(p.productId))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllProducts();
                          } else {
                            deselectAllProducts();
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr 
                      key={product.productId} 
                      className={`hover:bg-gray-50 ${
                        selectedProducts.has(product.productId) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.productId)}
                          onChange={() => toggleProductSelection(product.productId)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.sku && (
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.productId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.categories?.slice(0, 2).join(', ')}
                        {product.categories && product.categories.length > 2 && '...'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.price ? `£${product.price.toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => generateSingleSpecies(product)}
                          disabled={loading}
                          className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                        >
                          Generate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Generation Stats */}
      {generationStats && (
        <section className="semantic-section">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{generationStats.totalProducts}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{generationStats.totalGenerated}</div>
              <div className="text-sm text-gray-600">Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{generationStats.totalFailed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {generationStats.totalGenerated > 0 
                  ? Math.round((generationStats.totalGenerated / (generationStats.totalGenerated + generationStats.totalFailed)) * 100)
                  : 0
                }%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </section>
      )}

      {/* Log */}
      {showLog && (
        <section className="semantic-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
            <button
              onClick={() => setLogMessages([])}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Clear Log
            </button>
          </div>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logMessages.length === 0 ? (
              <div className="text-gray-500">No activity yet...</div>
            ) : (
              logMessages.map((message, index) => (
                <div key={index} className="mb-1">
                  {message}
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}