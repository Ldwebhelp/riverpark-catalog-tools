'use client';

import { useState, useEffect } from 'react';
import WebAppLayout from '@/components/WebAppLayout';
import { EnhancedProduct } from '@/lib/enhanced-product-discovery';

interface ProductFilters {
  searchTerm: string;
  categories: string[];
  brands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: 'name' | 'price' | 'dateCreated' | 'dateModified';
  sortOrder: 'asc' | 'desc';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    searchTerm: '',
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 1000 },
    sortBy: 'name',
    sortOrder: 'asc'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { enhancedProductDiscovery } = await import('@/lib/enhanced-product-discovery');
      const result = await enhancedProductDiscovery.discoverAllFishProducts({ limit: 2000 });
      
      setProducts(result.products);
      setAvailableCategories(result.categories);
      setAvailableBrands(result.brands);
      
      // Set initial price range from actual data
      setFilters(prev => ({
        ...prev,
        priceRange: {
          min: result.priceRange.min,
          max: result.priceRange.max
        }
      }));

    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.brand?.name.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product =>
        product.categories?.some(cat =>
          filters.categories.some(filterCat => 
            cat.toLowerCase().includes(filterCat.toLowerCase())
          )
        )
      );
    }

    // Brand filter
    if (filters.brands.length > 0) {
      filtered = filtered.filter(product =>
        product.brand?.name && filters.brands.includes(product.brand.name)
      );
    }

    // Price range filter
    filtered = filtered.filter(product => {
      const price = product.prices.price.value;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    // Sorting
    filtered.sort((a, b) => {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      
      switch (filters.sortBy) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'price':
          return order * (a.prices.price.value - b.prices.price.value);
        case 'dateCreated':
          return order * (new Date(a.dateCreated || '').getTime() - new Date(b.dateCreated || '').getTime());
        case 'dateModified':
          return order * (new Date(a.dateModified || '').getTime() - new Date(b.dateModified || '').getTime());
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 },
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  if (loading) {
    return (
      <WebAppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-3 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </WebAppLayout>
    );
  }

  return (
    <WebAppLayout>
      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive database of {products.length.toLocaleString()} aquarium products
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Showing {filteredProducts.length.toLocaleString()} products
              </div>
              <button
                onClick={loadProducts}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Reset All
                </button>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                  placeholder="Search by name, SKU, or description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories ({availableCategories.length})
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableCategories.slice(0, 10).map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...filters.categories, category]
                            : filters.categories.filter(c => c !== category);
                          handleFilterChange({ categories: newCategories });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 truncate">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brands ({availableBrands.length})
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableBrands.slice(0, 10).map(brand => (
                    <label key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.brands.includes(brand)}
                        onChange={(e) => {
                          const newBrands = e.target.checked
                            ? [...filters.brands, brand]
                            : filters.brands.filter(b => b !== brand);
                          handleFilterChange({ brands: newBrands });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600 truncate">
                        {brand}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (£{filters.priceRange.min} - £{filters.priceRange.max})
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.priceRange.max}
                    onChange={(e) => handleFilterChange({ 
                      priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={filters.priceRange.min}
                      onChange={(e) => handleFilterChange({ 
                        priceRange: { ...filters.priceRange, min: Number(e.target.value) }
                      })}
                      placeholder="Min"
                      className="w-1/2 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <input
                      type="number"
                      value={filters.priceRange.max}
                      onChange={(e) => handleFilterChange({ 
                        priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                      })}
                      placeholder="Max"
                      className="w-1/2 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange({ 
                      sortBy: sortBy as ProductFilters['sortBy'],
                      sortOrder: sortOrder as ProductFilters['sortOrder']
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low-High)</option>
                  <option value="price-desc">Price (High-Low)</option>
                  <option value="dateCreated-desc">Newest First</option>
                  <option value="dateCreated-asc">Oldest First</option>
                </select>
              </div>

            </div>
          </div>

          {/* Products List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              
              {/* Products Grid */}
              <div className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">Try adjusting your filters to see more results</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.entityId}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900 line-clamp-2">
                              {product.name}
                            </h3>
                            {product.inventory?.isInStock ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                In Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            {product.sku && (
                              <span>SKU: {product.sku}</span>
                            )}
                            {product.brand?.name && (
                              <span>Brand: {product.brand.name}</span>
                            )}
                            <span>ID: {product.entityId}</span>
                          </div>

                          {product.categories && product.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {product.categories.slice(0, 3).map(category => (
                                <span
                                  key={category}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {category}
                                </span>
                              ))}
                              {product.categories.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{product.categories.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {product.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-gray-900">
                            £{product.prices.price.value.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {product.prices.price.currencyCode}
                          </div>
                          {product.dateModified && (
                            <div className="text-xs text-gray-500 mt-1">
                              Updated: {new Date(product.dateModified).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedProduct.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Product ID:</span>
                      <span className="ml-2 text-gray-600">{selectedProduct.entityId}</span>
                    </div>
                    {selectedProduct.sku && (
                      <div>
                        <span className="font-medium text-gray-700">SKU:</span>
                        <span className="ml-2 text-gray-600">{selectedProduct.sku}</span>
                      </div>
                    )}
                    {selectedProduct.brand?.name && (
                      <div>
                        <span className="font-medium text-gray-700">Brand:</span>
                        <span className="ml-2 text-gray-600">{selectedProduct.brand.name}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>
                      <span className="ml-2 text-gray-600">
                        £{selectedProduct.prices.price.value.toFixed(2)} {selectedProduct.prices.price.currencyCode}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedProduct.description}</p>
                  </div>
                )}

                {selectedProduct.categories && selectedProduct.categories.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.categories.map(category => (
                        <span
                          key={category}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Inventory Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">In Stock:</span>
                      <span className={`ml-2 ${selectedProduct.inventory?.isInStock ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedProduct.inventory?.isInStock ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Visible:</span>
                      <span className={`ml-2 ${selectedProduct.isVisible ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedProduct.isVisible ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Timestamps</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedProduct.dateCreated && (
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(selectedProduct.dateCreated).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedProduct.dateModified && (
                      <div>
                        <span className="font-medium text-gray-700">Modified:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(selectedProduct.dateModified).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </WebAppLayout>
  );
}