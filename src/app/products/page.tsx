'use client';

import { useState, useEffect } from 'react';
import { BigCommerceProductReal } from '@/lib/bigcommerce-client';

interface Category {
  id: number;
  parent_id: number;
  name: string;
  description: string;
  is_visible: boolean;
  sort_order: number;
  children?: Category[];
}

interface ProductsResponse {
  data: BigCommerceProductReal[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
      links: {
        previous?: string;
        current: string;
        next?: string;
      };
    };
  };
  categoryTree?: Category[];
  error?: string;
}

interface CategoriesResponse {
  data: Category[];
  meta: {
    total_categories: number;
  };
  error?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<BigCommerceProductReal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [includeSubcategories, setIncludeSubcategories] = useState(true);
  const [pageSize, setPageSize] = useState(50);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, currentPage, searchKeyword, includeSubcategories, pageSize]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/bigcommerce/category-tree');
      const data: CategoriesResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load categories');
      }
      
      setCategories(data.data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        includeSubcategories: includeSubcategories.toString(),
      });

      if (selectedCategory) {
        params.append('categoryId', selectedCategory.toString());
      }

      if (searchKeyword.trim()) {
        params.append('keyword', searchKeyword.trim());
      }

      params.append('isVisible', 'true'); // Only show visible products

      const response = await fetch(`/api/bigcommerce/products?${params.toString()}`);
      const data: ProductsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load products');
      }

      setProducts(data.data);
      setTotalPages(data.meta.pagination.total_pages);
      setTotalProducts(data.meta.pagination.total);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryTree = (cats: Category[], level: number = 0) => {
    return cats.map(category => (
      <div key={category.id}>
        <option 
          value={category.id}
          style={{ paddingLeft: `${level * 20}px` }}
        >
          {'  '.repeat(level)}→ {category.name}
        </option>
        {category.children && category.children.length > 0 && 
          renderCategoryTree(category.children, level + 1)
        }
      </div>
    ));
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryName = (categoryId: number): string => {
    const findCategory = (cats: Category[]): string | null => {
      for (const cat of cats) {
        if (cat.id === categoryId) return cat.name;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(categories) || `Category ${categoryId}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">BigCommerce Products</h1>
        <div className="text-sm text-gray-600">
          {totalProducts > 0 && `${totalProducts} products total`}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? parseInt(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {renderCategoryTree(categories)}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1);
                  loadProducts();
                }
              }}
              placeholder="Search by name, SKU, description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Page Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Products per page
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeSubcategories}
              onChange={(e) => {
                setIncludeSubcategories(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Include subcategories</span>
          </label>

          <button
            onClick={() => {
              setCurrentPage(1);
              loadProducts();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Search
          </button>

          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchKeyword('');
              setCurrentPage(1);
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-red-800 font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800 font-medium">Loading products from BigCommerce...</span>
          </div>
        </div>
      )}

      {/* Products Table */}
      {!loading && products.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Products {selectedCategory && `in ${getCategoryName(selectedCategory)}`}
              {searchKeyword && ` matching "${searchKeyword}"`}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {products.length} of {totalProducts} products (Page {currentPage} of {totalPages})
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modified
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.primary_image?.url_thumbnail && (
                          <img
                            src={product.primary_image.url_thumbnail}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.name}>
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.sale_price > 0 && product.sale_price < product.price && (
                          <div className="text-red-600">
                            Sale: {formatPrice(product.sale_price)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.inventory_level || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {product.categories.map(catId => getCategoryName(catId)).join(', ') || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_visible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(product.date_modified)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      if (totalPages <= 10 || pageNum <= 5 || pageNum > totalPages - 5 || Math.abs(pageNum - currentPage) <= 2) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                              pageNum === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === 6 && currentPage > 8) {
                        return <span key={pageNum} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Products */}
      {!loading && products.length === 0 && !error && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-2-2m-4 4l-2-2m7 10l-2 2m-4-4l-2 2"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">
            {selectedCategory || searchKeyword 
              ? 'Try adjusting your filters or search terms.'
              : 'No products are currently available in the BigCommerce catalog.'
            }
          </p>
        </div>
      )}
    </div>
  );
}