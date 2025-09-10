/**
 * Direct BigCommerce API Integration
 * Fetches products directly from BigCommerce and saves to JSON files
 */

import { FileStoredProduct } from './file-product-storage';

export interface BigCommerceConfig {
  storeUrl: string;
  accessToken: string;
  clientId?: string;
}

export interface BigCommerceProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  categories: number[];
  description: string;
  brand_id?: number;
  images: Array<{
    url_standard: string;
    description: string;
  }>;
  is_visible: boolean;
  date_created: string;
  date_modified: string;
  custom_url?: {
    url: string;
  };
  custom_fields?: Array<{
    name: string;
    value: string;
  }>;
}

export interface BigCommerceCategory {
  id: number;
  name: string;
  parent_id: number;
}

export interface BigCommerceBrand {
  id: number;
  name: string;
}

export class BigCommerceDirect {
  private config: BigCommerceConfig;
  private brandCache = new Map<number, string>();
  private categoryCache = new Map<number, string>();

  constructor(config: BigCommerceConfig) {
    this.config = config;
  }

  /**
   * Test BigCommerce API connection
   */
  async testConnection(): Promise<{ connected: boolean; error?: string; storeInfo?: any }> {
    try {
      // Test with a simple products request
      const response = await fetch(`${this.config.storeUrl}catalog/products?limit=10`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return { connected: true, storeInfo: { status: 'connected' } };

    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch all products from BigCommerce
   */
  async getAllProducts(): Promise<FileStoredProduct[]> {
    try {
      console.log('🔄 Fetching all products from BigCommerce...');

      // Load supporting data first
      await this.loadBrands();
      await this.loadCategories();

      const allProducts: FileStoredProduct[] = [];
      let page = 1;
      const limit = 250; // BigCommerce max per page

      while (true) {
        console.log(`📦 Fetching page ${page}...`);
        
        const response = await fetch(
          `${this.config.storeUrl}catalog/products?limit=${limit}&page=${page}&include=images,variants,custom_fields`,
          {
            headers: this.getHeaders()
          }
        );

        if (!response.ok) {
          throw new Error(`BigCommerce API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const products = data.data || [];

        if (products.length === 0) {
          break; // No more products
        }

        // Convert BigCommerce format to our format
        const convertedProducts = products.map((product: BigCommerceProduct) => 
          this.convertProduct(product)
        );

        allProducts.push(...convertedProducts);

        console.log(`✅ Page ${page}: ${products.length} products (Total: ${allProducts.length})`);

        // Check if there are more pages
        if (products.length < limit) {
          break;
        }

        page++;
      }

      console.log(`🎉 Successfully fetched ${allProducts.length} products from BigCommerce`);
      return allProducts;

    } catch (error) {
      console.error('❌ Failed to fetch products from BigCommerce:', error);
      throw error;
    }
  }

  /**
   * Get fish products only from BigCommerce
   */
  async getFishProducts(): Promise<FileStoredProduct[]> {
    const allProducts = await this.getAllProducts();
    
    return allProducts.filter(product => {
      const name = product.name.toLowerCase();
      const categories = product.categories.map(cat => cat.toLowerCase());
      
      // Check for fish-related categories
      const fishCategories = [
        'fish', 'cichlid', 'tetra', 'livestock', 'freshwater',
        'tropical', 'coldwater', 'marine'
      ];
      
      const hasFishCategory = categories.some(cat =>
        fishCategories.some(fishCat => cat.includes(fishCat))
      );

      // Check for scientific name in product name
      const hasScientificName = name.includes('(') && name.includes(')');

      // Check for fish terms in name
      const fishTerms = [
        'fish', 'cichlid', 'tetra', 'betta', 'guppy', 'molly', 'platy',
        'angelfish', 'discus', 'oscar', 'barb', 'danio', 'corydoras',
        'pleco', 'catfish', 'gourami', 'rasbora', 'loach', 'shark',
        'goldfish', 'koi', 'axolotl'
      ];
      
      const hasFishTerm = fishTerms.some(term => name.includes(term));

      return (hasFishCategory || hasScientificName) && hasFishTerm;
    });
  }

  /**
   * Load brands and cache them
   */
  private async loadBrands(): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.storeUrl}catalog/brands?limit=250`,
        { headers: this.getHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        const brands = data.data || [];
        
        brands.forEach((brand: BigCommerceBrand) => {
          this.brandCache.set(brand.id, brand.name);
        });
        
        console.log(`✅ Loaded ${brands.length} brands`);
      }
    } catch (error) {
      console.warn('Failed to load brands:', error);
    }
  }

  /**
   * Load categories and cache them
   */
  private async loadCategories(): Promise<void> {
    try {
      let page = 1;
      const categories: BigCommerceCategory[] = [];

      while (true) {
        const response = await fetch(
          `${this.config.storeUrl}catalog/categories?limit=250&page=${page}`,
          { headers: this.getHeaders() }
        );

        if (!response.ok) break;

        const data = await response.json();
        const pageCategories = data.data || [];
        
        if (pageCategories.length === 0) break;
        
        categories.push(...pageCategories);
        page++;
      }

      categories.forEach((category: BigCommerceCategory) => {
        this.categoryCache.set(category.id, category.name);
      });

      console.log(`✅ Loaded ${categories.length} categories`);
    } catch (error) {
      console.warn('Failed to load categories:', error);
    }
  }

  /**
   * Convert BigCommerce product format to our format
   */
  private convertProduct(bcProduct: BigCommerceProduct): FileStoredProduct {
    return {
      entityId: bcProduct.id,
      name: bcProduct.name,
      sku: bcProduct.sku || null,
      price: bcProduct.price || 0,
      categories: bcProduct.categories.map(catId => 
        this.categoryCache.get(catId) || `Category ${catId}`
      ),
      description: bcProduct.description || null,
      brand: bcProduct.brand_id ? {
        name: this.brandCache.get(bcProduct.brand_id) || 'Unknown Brand'
      } : undefined,
      defaultImage: bcProduct.images.length > 0 ? {
        url: bcProduct.images[0].url_standard,
        altText: bcProduct.images[0].description || bcProduct.name
      } : undefined,
      images: bcProduct.images.map(img => ({
        url: img.url_standard,
        altText: img.description || bcProduct.name
      })),
      isVisible: bcProduct.is_visible,
      dateCreated: bcProduct.date_created,
      dateModified: bcProduct.date_modified,
      path: bcProduct.custom_url?.url,
      customFields: bcProduct.custom_fields
    };
  }

  /**
   * Get API headers
   */
  private getHeaders(): Record<string, string> {
    return {
      'X-Auth-Token': this.config.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
}

/**
 * Create BigCommerce instance from environment variables
 */
export function createBigCommerceClient(): BigCommerceDirect | null {
  const storeUrl = process.env.BIGCOMMERCE_API_URL || process.env.BIGCOMMERCE_STORE_URL;
  const accessToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;

  if (!storeUrl || !accessToken) {
    console.log('BigCommerce credentials not configured');
    return null;
  }

  return new BigCommerceDirect({
    storeUrl,
    accessToken,
    clientId: process.env.BIGCOMMERCE_CLIENT_ID
  });
}