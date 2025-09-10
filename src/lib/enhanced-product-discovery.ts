/**
 * Enhanced BigCommerce Product Discovery System - Database-Driven
 * Uses Vercel Database for production-ready performance
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
  source: 'database' | 'cache';
}

export class EnhancedProductDiscovery {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Discover all fish products with no limits - Database-driven
   */
  async discoverAllFishProducts(options: ProductSearchOptions = {}): Promise<ProductDiscoveryResult> {
    try {
      // Import database dynamically
      const { VercelDatabase } = await import('./vercel-database');
      
      // Get all cached products from database
      const allProducts = await VercelDatabase.getCachedProducts();
      
      // Filter to fish products only
      const fishProducts = allProducts.filter(product => {
        const name = product.name.toLowerCase();
        
        // Must have scientific name in parentheses
        const hasScientificName = name.includes('(') && name.includes(')');
        if (!hasScientificName) return false;
        
        // Exclude obvious non-fish products
        const excludeTerms = [
          'tank', 'aquarium', 'filter', 'heater', 'pump', 'food', 'flake',
          'pellet', 'substrate', 'gravel', 'sand', 'decoration', 'ornament',
          'plant', 'test', 'kit', 'conditioner', 'treatment', 'medication',
          'light', 'bulb', 'tube', 'stand', 'cabinet', 'hood', 'cover'
        ];
        
        const isExcluded = excludeTerms.some(term => name.includes(term));
        if (isExcluded) return false;
        
        // Include fish-related terms
        const fishTerms = [
          'fish', 'cichlid', 'tetra', 'betta', 'guppy', 'molly', 'platy',
          'angelfish', 'discus', 'oscar', 'barb', 'danio', 'corydoras',
          'pleco', 'catfish', 'gourami', 'rasbora', 'loach', 'shark',
          'goldfish', 'koi', 'axolotl', 'frog', 'newt'
        ];
        
        return fishTerms.some(term => name.includes(term));
      });
      
      // Convert to EnhancedProduct format
      const enhancedProducts: EnhancedProduct[] = fishProducts.map(product => ({
        entityId: product.entity_id,
        name: product.name,
        path: `/products/${product.entity_id}`,
        brand: product.brand_name ? { name: product.brand_name } : undefined,
        prices: {
          price: { value: product.price, currencyCode: 'GBP' },
          salePrice: null
        },
        defaultImage: undefined,
        categories: product.categories,
        sku: product.sku || undefined,
        description: product.description || undefined,
        inventory: {
          isInStock: product.is_visible,
          hasVariantInventory: false
        },
        dateCreated: product.date_created,
        dateModified: product.date_modified,
        isVisible: product.is_visible
      }));

      // Collect metadata for filtering
      const categories = new Set<string>();
      const brands = new Set<string>();
      let minPrice = Infinity;
      let maxPrice = 0;

      enhancedProducts.forEach(product => {
        product.categories?.forEach(cat => categories.add(cat));
        if (product.brand?.name) brands.add(product.brand.name);
        
        const price = product.prices.price.value;
        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;
      });

      // Apply user filtering
      let filteredProducts = enhancedProducts;

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
            options.categories!.some(filterCat => cat.toLowerCase().includes(filterCat.toLowerCase()))
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
        source: 'database'
      };

    } catch (error) {
      console.error('Error loading products from database:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get product by ID from database
   */
  async getProductById(productId: number): Promise<EnhancedProduct | null> {
    try {
      const { VercelDatabase } = await import('./vercel-database');
      const allProducts = await VercelDatabase.getCachedProducts();
      
      const product = allProducts.find(p => p.entity_id === productId);
      if (!product) return null;

      return {
        entityId: product.entity_id,
        name: product.name,
        path: `/products/${product.entity_id}`,
        brand: product.brand_name ? { name: product.brand_name } : undefined,
        prices: {
          price: { value: product.price, currencyCode: 'GBP' },
          salePrice: null
        },
        categories: product.categories,
        sku: product.sku || undefined,
        description: product.description || undefined,
        inventory: {
          isInStock: product.is_visible,
          hasVariantInventory: false
        },
        dateCreated: product.date_created,
        dateModified: product.date_modified,
        isVisible: product.is_visible
      };

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
   * Test connection to database
   */
  async testConnection(): Promise<{ connected: boolean; error?: string; storeInfo?: any }> {
    try {
      const { VercelDatabase } = await import('./vercel-database');
      const products = await VercelDatabase.getCachedProducts();
      
      return {
        connected: true,
        storeInfo: {
          name: 'Vercel Database',
          status: 'connected',
          productCount: products.length
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