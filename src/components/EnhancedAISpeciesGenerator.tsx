'use client';

import { useState, useEffect } from 'react';
import { enhancedProductDiscovery, type EnhancedProduct } from '@/lib/enhanced-product-discovery';
import { notificationsSystem } from '@/lib/notifications-system';
import NotificationsPanel from './NotificationsPanel';

// Use EnhancedProduct type from the discovery service
type Product = EnhancedProduct;

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
  careEcosystem?: any;
  smartBundles?: any[];
  generatedAt?: string;
  aiProvider?: string;
}

interface ProductStatus {
  status: 'no-file' | 'created' | 'requires-update' | 'errored';
  lastGenerated?: string;
  error?: string;
  filePath?: string;
}

interface ConnectionStatus {
  aiService: { connected: boolean; error?: string };
  riverpark: { connected: boolean; error?: string; storeInfo?: any };
}

export default function EnhancedAISpeciesGenerator() {
  // State management
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generatedData, setGeneratedData] = useState<SpeciesData | null>(null);
  const [productStatuses, setProductStatuses] = useState<Map<number, ProductStatus>>(new Map());
  
  // UI State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [generating, setGenerating] = useState<number | null>(null);
  
  // Connection and sync
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  // Available categories for filtering
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load all products using enhanced discovery service
  const loadProducts = async () => {
    setLoadingProducts(true);
    
    try {
      // Use enhanced product discovery to get comprehensive fish product list
      const result = await enhancedProductDiscovery.discoverAllFishProducts({
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      setAllProducts(result.products);
      setAvailableCategories(result.categories);
      
      // Initialize product statuses
      await loadProductStatuses(result.products);
      
      setLastSync(result.lastSyncTime);
      
      console.log(`✅ Loaded ${result.products.length} fish products from ${result.source}`);
      
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load status for each product
  const loadProductStatuses = async (products: Product[]) => {
    const statusMap = new Map<number, ProductStatus>();
    
    // Use file-based storage for status tracking (cost-free)
    try {
      const { FileProductStorage } = await import('@/lib/file-product-storage');
      
      // Load all statuses from localStorage
      const allStatuses = FileProductStorage.getAllProductStatuses();
      
      // Map each product to its status
      products.forEach(product => {
        const statusKey = product.entityId.toString();
        const status = allStatuses.get(statusKey);
        
        if (status) {
          statusMap.set(product.entityId, {
            status: status.status,
            lastGenerated: status.lastGenerated,
            filePath: status.filePath,
            error: status.error
          });
        } else {
          // Default status for new products
          statusMap.set(product.entityId, { status: 'no-file' });
        }
      });
      
    } catch (error) {
      console.error('Failed to load product statuses:', error);
      // Fallback: set all products to no-file status
      products.forEach(product => {
        statusMap.set(product.entityId, { status: 'no-file' });
      });
    }
    
    setProductStatuses(statusMap);
  };

  // Test connections to services
  const testConnections = async () => {
    setLoading(true);
    
    try {
      // Test connection using enhanced discovery service
      const connectionTest = await enhancedProductDiscovery.testConnection();
      
      const status: ConnectionStatus = {
        aiService: { 
          connected: connectionTest.connected,
          error: connectionTest.error
        },
        riverpark: { 
          connected: connectionTest.connected,
          error: connectionTest.error,
          storeInfo: connectionTest.storeInfo
        }
      };

      setConnectionStatus(status);
      
      if (connectionTest.connected) {
        console.log('✅ Connected to Riverpark Catalyst Fresh API');
      } else {
        console.error('❌ Connection failed:', connectionTest.error);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setConnectionStatus({
        aiService: { connected: false, error: errorMsg },
        riverpark: { connected: false, error: errorMsg }
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate AI species data for a single product
  const generateSpeciesData = async (product: Product) => {
    setGenerating(product.entityId);
    
    try {
      notificationsSystem.addNotification({
        type: 'info',
        title: 'Generation Started',
        message: `Starting AI species data generation for ${product.name}`,
        source: 'catalog-tools',
        productId: product.entityId.toString(),
        priority: 'low'
      });

      const response = await fetch('https://riverpark-catalyst-fresh.vercel.app/api/ai/generate-species/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.entityId,
          name: product.name,
          provider: 'openai'
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setGeneratedData(data);
      setSelectedProduct(product);
      
      // Update status in both state and localStorage
      const newStatus: ProductStatus = {
        status: 'created',
        lastGenerated: new Date().toISOString(),
        filePath: `species-${product.entityId}.json`
      };
      
      setProductStatuses(prev => new Map(prev.set(product.entityId, newStatus)));
      
      // Save to localStorage using file storage
      try {
        const { FileProductStorage } = await import('@/lib/file-product-storage');
        FileProductStorage.setProductStatus(product.entityId.toString(), newStatus);
      } catch (error) {
        console.error('Failed to save product status:', error);
      }
      
      // Track success in notifications
      notificationsSystem.trackSpeciesGeneration(product.entityId.toString(), true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update status to errored in both state and localStorage
      const errorStatus: ProductStatus = {
        status: 'errored',
        error: errorMessage
      };
      
      setProductStatuses(prev => new Map(prev.set(product.entityId, errorStatus)));
      
      // Save to localStorage using file storage
      try {
        const { FileProductStorage } = await import('@/lib/file-product-storage');
        FileProductStorage.setProductStatus(product.entityId.toString(), errorStatus);
      } catch (error) {
        console.error('Failed to save error status:', error);
      }
      
      // Track error in notifications
      notificationsSystem.trackSpeciesGeneration(product.entityId.toString(), false, errorMessage);
      
    } finally {
      setGenerating(null);
    }
  };

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = allProducts;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(product =>
        product.categories?.some(cat => cat.includes(categoryFilter))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => {
        const status = productStatuses.get(product.entityId);
        return status?.status === statusFilter;
      });
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [allProducts, searchTerm, categoryFilter, statusFilter, productStatuses]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Get status badge component
  const getStatusBadge = (product: Product) => {
    const status = productStatuses.get(product.entityId);
    if (!status) return null;
    
    const badges = {
      'created': { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢', label: 'JSON Created' },
      'no-file': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⚪', label: 'No File' },
      'requires-update': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡', label: 'Requires Update' },
      'errored': { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴', label: 'Errored' }
    };
    
    const badge = badges[status.status];
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  // Initialize notifications listener
  useEffect(() => {
    const unsubscribe = notificationsSystem.subscribe((notifications) => {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    });

    // Initialize unread count
    setUnreadCount(notificationsSystem.getUnreadNotifications().length);

    return unsubscribe;
  }, []);

  // Initialize on component mount
  useEffect(() => {
    testConnections();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚀 Enhanced AI Species Generator</h1>
            <p className="text-gray-600">Revolutionary AI-powered species data generation with real BigCommerce integration</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
            >
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={testConnections}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
            >
              {loading ? 'Testing...' : 'Test Connections'}
            </button>
            <button
              onClick={loadProducts}
              disabled={loadingProducts}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
            >
              {loadingProducts ? 'Syncing...' : 'Sync Products'}
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {connectionStatus && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-3 rounded-lg border-2 ${
              connectionStatus.riverpark.connected 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Riverpark Fresh AI</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  connectionStatus.riverpark.connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus.riverpark.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg border-2 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-medium">Real BigCommerce Data</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {allProducts.length} Products Loaded
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
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
            {availableCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="created">JSON Created</option>
            <option value="no-file">No File</option>
            <option value="requires-update">Requires Update</option>
            <option value="errored">Errored</option>
          </select>
          {lastSync && (
            <div className="text-sm text-gray-500">
              Last sync: {new Date(lastSync).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Product Table */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Products ({filteredProducts.length})
              </h2>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <tr 
                    key={product.entityId}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedProduct?.entityId === product.entityId ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">ID: {product.entityId}</div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(product)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      £{product.prices.price.value.toFixed(2)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateSpeciesData(product);
                        }}
                        disabled={generating === product.entityId}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        {generating === product.entityId ? 'Generating...' : 'Generate AI'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-1 rounded text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 px-3 py-1 rounded text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - AI Content Viewer */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">AI Content Viewer</h2>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            {generatedData && selectedProduct ? (
              <div className="space-y-6">
                {/* Species Header */}
                <div className="border-b pb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{generatedData.commonName}</h3>
                  <p className="text-lg text-gray-600 italic">{generatedData.scientificName}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-sm text-gray-500">Product ID: {generatedData.productId}</span>
                    {generatedData.aiProvider && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🤖 OpenAI Generated
                      </span>
                    )}
                  </div>
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
                      {Object.entries(generatedData.species).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 capitalize">{key}</div>
                          <div className="text-sm text-gray-900">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* JSON Preview */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">JSON Output</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-64 font-mono">
                    {JSON.stringify(generatedData, null, 2)}
                  </pre>
                </div>

                {/* Download Button */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-green-800">File Status</h4>
                      <p className="text-sm text-green-700">
                        Species data saved automatically to riverpark-catalyst-fresh
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(generatedData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${generatedData.productId}-species.json`;
                        a.click();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                    >
                      Download JSON
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedProduct && !generatedData ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-500 mb-4">Click &quot;Generate AI&quot; to create species data</p>
                <button
                  onClick={() => generateSpeciesData(selectedProduct)}
                  disabled={generating === selectedProduct.entityId}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
                >
                  {generating === selectedProduct.entityId ? 'Generating...' : 'Generate AI Species Data'}
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">Select a product to view AI-generated content</p>
                <p className="text-gray-400 text-sm mt-2">Choose from {filteredProducts.length} available fish products</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}