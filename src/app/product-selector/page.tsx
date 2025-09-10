'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WebAppLayout from '@/components/WebAppLayout';
import { EnhancedProduct } from '@/lib/enhanced-product-discovery';

interface ProductSelectorFilters {
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

function ProductSelectorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/care-guides';
  const purpose = searchParams.get('purpose') || 'content creation';
  
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<EnhancedProduct[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<ProductSelectorFilters>({
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

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.entityId.toString().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.brand?.name.toLowerCase().includes(term)
      );
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(product =>
        product.categories?.some(cat =>
          filters.categories.some(filterCat => 
            cat.toLowerCase().includes(filterCat.toLowerCase())
          )
        )
      );
    }

    if (filters.brands.length > 0) {
      filtered = filtered.filter(product =>
        product.brand?.name && filters.brands.includes(product.brand.name)
      );
    }

    filtered = filtered.filter(product => {
      const price = product.prices.price.value;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

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

  const handleFilterChange = (newFilters: Partial<ProductSelectorFilters>) => {
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

  const handleProductSelect = (product: EnhancedProduct) => {
    if (selectedProducts.find(p => p.entityId === product.entityId)) {
      setSelectedProducts(selectedProducts.filter(p => p.entityId !== product.entityId));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts([...filteredProducts]);
    }
  };

  const handleContinueWithSelected = () => {
    if (selectedProducts.length > 0) {
      // Store selected products in sessionStorage for the next page to use
      sessionStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
      router.push(returnTo);
    }
  };

  const isProductSelected = (product: EnhancedProduct) => {
    return selectedProducts.some(p => p.entityId === product.entityId);
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
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
        
        {/* Page Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Select products for {purpose} • {selectedProducts.length} selected • {filteredProducts.length.toLocaleString()} of {products.length.toLocaleString()} products shown
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <span>View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  List
                </button>
              </div>
              <button
                onClick={handleSelectAll}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleContinueWithSelected}
                disabled={selectedProducts.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <span>Continue with {selectedProducts.length} Selected</span>
                <span>→</span>
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
                  placeholder="Search by name, Product ID, SKU..."
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
                      sortBy: sortBy as ProductSelectorFilters['sortBy'],
                      sortOrder: sortOrder as ProductSelectorFilters['sortOrder']
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

              {/* Selected Products Summary */}
              {selectedProducts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Products ({selectedProducts.length})
                  </label>
                  <div className="bg-blue-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {selectedProducts.slice(0, 5).map(product => (
                      <div key={product.entityId} className="text-xs text-blue-800 truncate">
                        {product.name}
                      </div>
                    ))}
                    {selectedProducts.length > 5 && (
                      <div className="text-xs text-blue-600 mt-1">
                        +{selectedProducts.length - 5} more selected
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Products Display */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600">Try adjusting your filters to see more results</p>
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {filteredProducts.map(product => (
                    <div
                      key={product.entityId}
                      onClick={() => handleProductSelect(product)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        isProductSelected(product)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                            {product.name}
                          </h3>
                          <div className="text-xs text-gray-600 mb-2">
                            ID: {product.entityId}
                            {product.sku && ` • SKU: ${product.sku}`}
                          </div>
                        </div>
                        <div className="ml-2">
                          <input
                            type="checkbox"
                            checked={isProductSelected(product)}
                            onChange={() => handleProductSelect(product)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="text-lg font-bold text-gray-900 mb-2">
                        £{product.prices.price.value.toFixed(2)}
                      </div>
                      
                      {product.categories && product.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.categories.slice(0, 2).map(category => (
                            <span
                              key={category}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {category}
                            </span>
                          ))}
                          {product.categories.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{product.categories.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{product.inventory?.isInStock ? 'In Stock' : 'Out of Stock'}</span>
                        {product.brand?.name && <span>{product.brand.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="divide-y divide-gray-200">
                  {filteredProducts.map(product => (
                    <div
                      key={product.entityId}
                      onClick={() => handleProductSelect(product)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        isProductSelected(product) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <input
                            type="checkbox"
                            checked={isProductSelected(product)}
                            onChange={() => handleProductSelect(product)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {product.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>ID: {product.entityId}</span>
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.brand?.name && <span>Brand: {product.brand.name}</span>}
                              <span className={product.inventory?.isInStock ? 'text-green-600' : 'text-red-600'}>
                                {product.inventory?.isInStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            £{product.prices.price.value.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {product.prices.price.currencyCode}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </WebAppLayout>
  );
}

export default function ProductSelectorPage() {
  return (
    <Suspense fallback={
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
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </WebAppLayout>
    }>
      <ProductSelectorContent />
    </Suspense>
  );
}