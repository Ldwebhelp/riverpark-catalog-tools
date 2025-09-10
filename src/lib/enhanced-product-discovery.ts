/**
 * Enhanced BigCommerce Product Discovery System
 * Removes all limits and provides comprehensive product access
 */

export interface EnhancedProduct {
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
  categories?: string[];
  sku?: string;
  description?: string;
  customFields?: Array<{ name: string; value: string }>;
  inventory?: {
    isInStock: boolean;
    hasVariantInventory: boolean;
  };
  variants?: Array<{
    entityId: number;
    sku: string;
    price: number;
  }>;
  seo?: {
    pageTitle: string;
    metaDescription: string;
  };
  availability?: string;
  condition?: string;
  dateCreated?: string;
  dateModified?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  type?: string;
  weight?: number;
  height?: number;
  width?: number;
  depth?: number;
}

export interface ProductSearchOptions {
  searchTerm?: string;
  categories?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  brands?: string[];
  availability?: 'available' | 'preorder' | 'disabled';
  sortBy?: 'name' | 'price' | 'dateCreated' | 'dateModified' | 'featured';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProductDiscoveryResult {
  products: EnhancedProduct[];
  totalCount: number;
  hasMore: boolean;
  categories: string[];
  brands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  lastSyncTime: string;
  source: 'riverpark-fresh' | 'bigcommerce-api' | 'cache';
}

export class EnhancedProductDiscovery {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly RIVERPARK_BASE_URL = 'https://riverpark-catalyst-fresh.vercel.app';
  private useDatabase = false; // Can be enabled for production caching

  /**
   * Enable database caching for production use
   */
  enableDatabase(): void {
    this.useDatabase = true;
  }

  /**
   * Disable database caching (use memory cache only)
   */
  disableDatabase(): void {
    this.useDatabase = false;
  }

  /**
   * Check if database caching is enabled
   */
  isDatabaseEnabled(): boolean {
    return this.useDatabase;
  }

  /**
   * Discover all fish products with no limits
   */
  async discoverAllFishProducts(options: ProductSearchOptions = {}): Promise<ProductDiscoveryResult> {
    try {
      // Use multiple search strategies to get comprehensive results
      const fishSearchTerms = [
        'cichlid', 'tetra', 'angelfish', 'betta', 'corydoras', 'guppy', 
        'molly', 'platy', 'barb', 'danio', 'discus', 'oscar', 'catfish', 
        'pleco', 'gourami', 'rasbora', 'loach', 'shark', 'goldfish',
        'koi', 'axolotl', 'frog', 'newt'
      ];

      const allProducts: EnhancedProduct[] = [];
      const categories = new Set<string>();
      const brands = new Set<string>();
      let minPrice = Infinity;
      let maxPrice = 0;

      // Search for each fish type to ensure comprehensive coverage
      for (const searchTerm of fishSearchTerms) {
        const products = await this.searchProducts(searchTerm, 100);
        
        for (const product of products) {
          // Check if product is already in results (avoid duplicates)
          if (!allProducts.find(p => p.entityId === product.entityId)) {
            // Filter to only include actual fish (not equipment/food)
            if (this.isFishProduct(product)) {
              allProducts.push(product);
              
              // Collect metadata
              product.categories?.forEach(cat => categories.add(cat));
              if (product.brand?.name) brands.add(product.brand.name);
              
              const price = product.prices.price.value;
              if (price < minPrice) minPrice = price;
              if (price > maxPrice) maxPrice = price;
            }
          }
        }
      }

      // Apply additional filtering if specified
      let filteredProducts = allProducts;

      if (options.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(term) ||
          product.sku?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)
        );
      }

      if (options.categories?.length) {
        filteredProducts = filteredProducts.filter(product =>
          product.categories?.some(cat => 
            options.categories!.some(filterCat => cat.includes(filterCat))
          )
        );
      }

      if (options.brands?.length) {
        filteredProducts = filteredProducts.filter(product =>
          product.brand?.name && options.brands!.includes(product.brand.name)
        );
      }

      if (options.priceRange) {
        filteredProducts = filteredProducts.filter(product => {
          const price = product.prices.price.value;
          return price >= options.priceRange!.min && price <= options.priceRange!.max;
        });
      }

      // Apply sorting
      if (options.sortBy) {
        filteredProducts.sort((a, b) => {
          const order = options.sortOrder === 'desc' ? -1 : 1;
          
          switch (options.sortBy) {
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
      }

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);

      return {
        products: paginatedProducts,
        totalCount: filteredProducts.length,
        hasMore: offset + limit < filteredProducts.length,
        categories: Array.from(categories).sort(),
        brands: Array.from(brands).sort(),
        priceRange: {
          min: minPrice === Infinity ? 0 : minPrice,
          max: maxPrice
        },
        lastSyncTime: new Date().toISOString(),
        source: 'riverpark-fresh'
      };

    } catch (error) {
      console.error('Error discovering fish products:', error);
      throw new Error(`Failed to discover products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for products using riverpark-catalyst-fresh API
   */
  private async searchProducts(searchTerm: string, limit = 50): Promise<EnhancedProduct[]> {
    const cacheKey = `search_${searchTerm}_${limit}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.RIVERPARK_BASE_URL}/api/search/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const products = data.products || [];

      // Cache the results
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      return products;

    } catch (error) {
      console.error(`Error searching for "${searchTerm}":`, error);
      return [];
    }
  }

  /**
   * Determine if a product is actually a fish (not equipment, food, etc.)
   */
  private isFishProduct(product: EnhancedProduct): boolean {
    const name = product.name.toLowerCase();
    const description = (product.description || '').toLowerCase();

    // Must have scientific name in parentheses
    const hasScientificName = name.includes('(') && name.includes(')');
    if (!hasScientificName) return false;

    // Exclude obvious non-fish products
    const excludeTerms = [
      'tank', 'aquarium', 'filter', 'heater', 'pump', 'food', 'flake',
      'pellet', 'substrate', 'gravel', 'sand', 'decoration', 'ornament',
      'plant', 'test', 'kit', 'conditioner', 'treatment', 'medication',
      'light', 'bulb', 'tube', 'stand', 'cabinet', 'hood', 'cover',
      'thermometer', 'net', 'siphon', 'cleaner', 'algae', 'bacterial'
    ];

    const isExcluded = excludeTerms.some(term => 
      name.includes(term) || description.includes(term)
    );

    if (isExcluded) return false;

    // Must include fish-related terms or scientific indicators
    const fishTerms = [
      'fish', 'cichlid', 'tetra', 'betta', 'guppy', 'molly', 'platy',
      'angelfish', 'discus', 'oscar', 'barb', 'danio', 'corydoras',
      'pleco', 'catfish', 'gourami', 'rasbora', 'loach', 'shark',
      'goldfish', 'koi', 'axolotl', 'frog', 'newt'
    ];

    const hasFishTerm = fishTerms.some(term => 
      name.includes(term) || description.includes(term)
    );

    return hasFishTerm;
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: number): Promise<EnhancedProduct | null> {
    try {
      // Try to find in cached search results first
      for (const [key, cached] of this.cache.entries()) {
        if (key.startsWith('search_') && Date.now() - cached.timestamp < this.CACHE_DURATION) {
          const product = cached.data.find((p: EnhancedProduct) => p.entityId === productId);
          if (product) return product;
        }
      }

      // If not found in cache, search by ID
      const response = await fetch(`${this.RIVERPARK_BASE_URL}/api/products/${productId}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Product API error: ${response.status} ${response.statusText}`);
      }

      const product = await response.json();
      return product;

    } catch (error) {
      console.error(`Error getting product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive product categories
   */
  async getProductCategories(): Promise<string[]> {
    try {
      const result = await this.discoverAllFishProducts({ limit: 1000 });
      return result.categories;
    } catch (error) {
      console.error('Error getting product categories:', error);
      return [];
    }
  }

  /**
   * Get available brands
   */
  async getProductBrands(): Promise<string[]> {
    try {
      const result = await this.discoverAllFishProducts({ limit: 1000 });
      return result.brands;
    } catch (error) {
      console.error('Error getting product brands:', error);
      return [];
    }
  }

  /**
   * Test connection to riverpark-catalyst-fresh
   */
  async testConnection(): Promise<{ connected: boolean; error?: string; storeInfo?: any }> {
    try {
      const response = await fetch(`${this.RIVERPARK_BASE_URL}/api/health/`);
      
      if (!response.ok) {
        return {
          connected: false,
          error: `Connection failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        connected: true,
        storeInfo: {
          name: 'Riverpark Catalyst Fresh',
          status: data.status || 'healthy',
          features: data.features || {}
        }
      };

    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Force refresh all data
   */
  async refreshAllData(): Promise<ProductDiscoveryResult> {
    this.clearCache();
    return this.discoverAllFishProducts();
  }
}

// Default instance
export const enhancedProductDiscovery = new EnhancedProductDiscovery();