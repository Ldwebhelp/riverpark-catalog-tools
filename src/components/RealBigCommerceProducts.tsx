'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RealProduct {
  entityId: number;
  name: string;
  sku: string | null;
  price: number;
  categories: string[];
  description: string | null;
  brand?: { name: string };
  defaultImage?: {
    url: string;
    altText: string;
  };
  isVisible: boolean;
  dateCreated: string;
  dateModified: string;
}

interface ProductListProps {
  onProductSelect: (product: RealProduct) => void;
  selectedProductId?: number;
  productsWithContent?: Set<number>;
}

interface Category {
  name: string;
  count: number;
}

export default function RealBigCommerceProducts({ 
  onProductSelect, 
  selectedProductId,
  productsWithContent 
}: ProductListProps) {
  const [products, setProducts] = useState<RealProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loadingCategories, setLoadingCategories] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      console.log('🔄 Loading categories...');
      
      const response = await fetch('/api/bigcommerce/categories');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setCategories(data.data);
      console.log(`✅ Loaded ${data.data.length} categories`);

    } catch (err) {
      console.error('❌ Error loading categories:', err);
      // Don't show error for categories, just log it
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      console.log(`🔄 Loading products${selectedCategory ? ` for category: ${selectedCategory}` : ''}...`);
      
      const response = await fetch(`/api/bigcommerce/real-products?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.data);
      console.log(`✅ Loaded ${data.data.length} products`);

    } catch (err) {
      console.error('❌ Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleProductClick = (product: RealProduct) => {
    onProductSelect(product);
  };

  if (loading && products.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading real BigCommerce products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-900 mb-4">{error}</p>
          <button
            onClick={() => loadProducts()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            BigCommerce Products
          </h2>
        </div>
        
        {/* Categories Dropdown */}
        <div className="mb-3">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={loadingCategories}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            {products.length} products loaded{selectedCategory ? ` in "${selectedCategory}"` : ''} • Click to select
          </p>
          {productsWithContent && productsWithContent.size > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-800 font-medium">
                {productsWithContent.size} with AI content
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {products.map((product) => (
            <div
              key={product.entityId}
              onClick={() => handleProductClick(product)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                selectedProductId === product.entityId
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Product Image */}
                {product.defaultImage ? (
                  <img
                    src={product.defaultImage.url}
                    alt={product.defaultImage.altText}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {product.name}
                    </h3>
                    {productsWithContent?.has(product.entityId) && (
                      <div className="flex-shrink-0">
                        <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          AI
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    ID: {product.entityId} • SKU: {product.sku || 'No SKU'}
                  </p>
                  <p className="text-sm font-medium text-green-700 mt-1">
                    £{product.price.toFixed(2)}
                  </p>
                  {product.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.categories.slice(0, 3).map((category, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                        >
                          {category}
                        </span>
                      ))}
                      {product.categories.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{product.categories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedProductId === product.entityId && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}