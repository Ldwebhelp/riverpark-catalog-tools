/**
 * Cost-Free File-Based Product Storage System
 * No database costs - uses static JSON files + localStorage
 */

export interface FileStoredProduct {
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
  images?: Array<{
    url: string;
    altText: string;
  }>;
  isVisible: boolean;
  dateCreated: string;
  dateModified: string;
  path?: string;
  customFields?: Array<{ name: string; value: string }>;
}

export interface ProductSyncResult {
  success: boolean;
  productCount: number;
  syncTime: string;
  source: 'bigcommerce' | 'file';
  error?: string;
}

export interface ProductStatus {
  status: 'no-file' | 'created' | 'requires-update' | 'errored';
  lastGenerated?: string;
  error?: string;
  filePath?: string;
}

export class FileProductStorage {
  private static readonly DATA_BASE_URL = '/data';
  private static readonly PRODUCTS_FILE = 'products.json';
  private static readonly SYNC_META_FILE = 'sync-metadata.json';
  private static readonly CATEGORIES_FILE = 'categories.json';

  /**
   * Load products from static JSON file
   */
  static async getProducts(): Promise<FileStoredProduct[]> {
    try {
      console.log('📁 Loading products from static files...');
      const response = await fetch(`${this.DATA_BASE_URL}/${this.PRODUCTS_FILE}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('📄 No products file found - returning empty array');
          return [];
        }
        throw new Error(`Failed to load products: ${response.status}`);
      }
      
      const products = await response.json();
      console.log(`✅ Loaded ${products.length} products from file`);
      return products;
      
    } catch (error) {
      console.error('❌ Failed to load products from file:', error);
      return [];
    }
  }

  /**
   * Get fish products only (filtered from all products)
   */
  static async getFishProducts(): Promise<FileStoredProduct[]> {
    const allProducts = await this.getProducts();
    
    return allProducts.filter(product => {
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
  }

  /**
   * Get categories from static file
   */
  static async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.DATA_BASE_URL}/${this.CATEGORIES_FILE}`);
      if (!response.ok) return [];
      
      const categories = await response.json();
      return categories;
      
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  }

  /**
   * Get sync metadata
   */
  static async getSyncMetadata(): Promise<{
    lastSync: string | null;
    productCount: number;
    source: string;
    nextSyncDue: string | null;
  }> {
    try {
      const response = await fetch(`${this.DATA_BASE_URL}/${this.SYNC_META_FILE}`);
      if (!response.ok) {
        return { lastSync: null, productCount: 0, source: 'none', nextSyncDue: null };
      }
      
      return await response.json();
      
    } catch (error) {
      return { lastSync: null, productCount: 0, source: 'none', nextSyncDue: null };
    }
  }

  /**
   * Sync products from BigCommerce to static files
   * This runs on the server-side via API endpoint
   */
  static async syncFromBigCommerce(): Promise<ProductSyncResult> {
    try {
      console.log('🔄 Starting BigCommerce sync...');
      
      const response = await fetch('/api/sync/bigcommerce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ BigCommerce sync completed:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ BigCommerce sync failed:', error);
      return {
        success: false,
        productCount: 0,
        syncTime: new Date().toISOString(),
        source: 'bigcommerce',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search products locally
   */
  static async searchProducts(searchTerm: string, limit = 50): Promise<FileStoredProduct[]> {
    const products = await this.getFishProducts();
    
    if (!searchTerm) {
      return products.slice(0, limit);
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.categories.some(cat => cat.toLowerCase().includes(term))
    );
    
    return filtered.slice(0, limit);
  }

  /**
   * Filter products by categories
   */
  static async filterByCategories(categoryFilters: string[]): Promise<FileStoredProduct[]> {
    const products = await this.getFishProducts();
    
    if (!categoryFilters.length) {
      return products;
    }
    
    return products.filter(product =>
      product.categories.some(cat =>
        categoryFilters.some(filter =>
          cat.toLowerCase().includes(filter.toLowerCase())
        )
      )
    );
  }

  /**
   * Get product by ID
   */
  static async getProductById(entityId: number): Promise<FileStoredProduct | null> {
    const products = await this.getProducts();
    return products.find(p => p.entityId === entityId) || null;
  }

  // === STATUS TRACKING (localStorage - Free) ===

  /**
   * Get product status from localStorage
   */
  static getProductStatus(productId: string): ProductStatus {
    try {
      const stored = localStorage.getItem(`product_status_${productId}`);
      if (!stored) {
        return { status: 'no-file' };
      }
      
      return JSON.parse(stored);
    } catch (error) {
      return { status: 'no-file' };
    }
  }

  /**
   * Set product status in localStorage
   */
  static setProductStatus(productId: string, status: ProductStatus): void {
    try {
      localStorage.setItem(`product_status_${productId}`, JSON.stringify({
        ...status,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save product status:', error);
    }
  }

  /**
   * Get all product statuses
   */
  static getAllProductStatuses(): Map<string, ProductStatus> {
    const statuses = new Map<string, ProductStatus>();
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('product_status_')) {
          const productId = key.replace('product_status_', '');
          const status = this.getProductStatus(productId);
          statuses.set(productId, status);
        }
      }
    } catch (error) {
      console.error('Failed to get product statuses:', error);
    }
    
    return statuses;
  }

  /**
   * Clear all product statuses
   */
  static clearAllStatuses(): void {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('product_status_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear product statuses:', error);
    }
  }

  // === ANALYTICS (localStorage - Free) ===

  /**
   * Get simple analytics from localStorage
   */
  static getAnalytics(): {
    totalProducts: number;
    generatedSpecies: number;
    erroredSpecies: number;
    successRate: number;
  } {
    const statuses = this.getAllProductStatuses();
    const statusArray = Array.from(statuses.values());
    
    const generatedSpecies = statusArray.filter(s => s.status === 'created').length;
    const erroredSpecies = statusArray.filter(s => s.status === 'errored').length;
    const totalAttempts = generatedSpecies + erroredSpecies;
    const successRate = totalAttempts > 0 ? Math.round((generatedSpecies / totalAttempts) * 100) : 0;
    
    return {
      totalProducts: statuses.size,
      generatedSpecies,
      erroredSpecies,
      successRate
    };
  }

  /**
   * Test connection (always returns true for files)
   */
  static async testConnection(): Promise<{ connected: boolean; source: string; productCount: number }> {
    const products = await this.getProducts();
    return {
      connected: true,
      source: 'file-system',
      productCount: products.length
    };
  }
}