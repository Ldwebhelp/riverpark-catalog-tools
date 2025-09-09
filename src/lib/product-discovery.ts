/**
 * BigCommerce Product Discovery System
 * Discovers and filters fish/aquarium products for AI species generation
 */

export interface ProductInfo {
  productId: string;
  name: string;
  sku?: string;
  categories?: string[];
  customFields?: Array<{ name: string; value: string }>;
  images?: string[];
  description?: string;
  price?: number;
  inventory?: number;
  isVisible?: boolean;
  dateCreated?: string;
  dateModified?: string;
}

export interface ProductDiscoveryOptions {
  categoryFilters?: string[];
  keywordFilters?: string[];
  skipInactive?: boolean;
  limit?: number;
  offset?: number;
}

export interface DiscoveryResult {
  products: ProductInfo[];
  total: number;
  hasMore: boolean;
  categories: string[];
  source: 'bigcommerce' | 'mock';
}

export class ProductDiscovery {
  private bigcommerceConfig: {
    storeUrl?: string;
    accessToken?: string;
    clientId?: string;
  };

  constructor(config: {
    storeUrl?: string;
    accessToken?: string;
    clientId?: string;
  } = {}) {
    this.bigcommerceConfig = {
      storeUrl: config.storeUrl || process.env.BIGCOMMERCE_STORE_URL,
      accessToken: config.accessToken || process.env.BIGCOMMERCE_ACCESS_TOKEN,
      clientId: config.clientId || process.env.BIGCOMMERCE_CLIENT_ID,
    };
  }

  /**
   * Discover fish and aquarium products from BigCommerce
   */
  async discoverProducts(options: ProductDiscoveryOptions = {}): Promise<DiscoveryResult> {
    const { categoryFilters, keywordFilters, skipInactive = true, limit = 50, offset = 0 } = options;

    if (!this.isBigCommerceConfigured()) {
      throw new Error('BigCommerce API not configured. Please provide BIGCOMMERCE_STORE_URL and BIGCOMMERCE_ACCESS_TOKEN environment variables.');
    }

    return await this.discoverFromBigCommerce(options);
  }

  /**
   * Discover products from BigCommerce API
   */
  private async discoverFromBigCommerce(options: ProductDiscoveryOptions): Promise<DiscoveryResult> {
    const { categoryFilters, keywordFilters, skipInactive, limit, offset } = options;
    
    if (!this.bigcommerceConfig.storeUrl || !this.bigcommerceConfig.accessToken) {
      throw new Error('BigCommerce configuration incomplete');
    }

    const params = new URLSearchParams();
    
    // Add filters
    if (limit) params.append('limit', String(limit));
    if (offset && limit) params.append('page', String(Math.floor(offset / limit) + 1));
    if (skipInactive) params.append('is_visible', 'true');
    
    // Add category filters
    if (categoryFilters && categoryFilters.length > 0) {
      params.append('categories:in', categoryFilters.join(','));
    }
    
    // Add keyword search
    if (keywordFilters && keywordFilters.length > 0) {
      const searchTerm = keywordFilters.join(' ');
      params.append('keyword', searchTerm);
    }

    const url = `${this.bigcommerceConfig.storeUrl}/v3/catalog/products?${params}`;
    
    console.log(`🔍 Discovering products from BigCommerce: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': this.bigcommerceConfig.accessToken!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`BigCommerce API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    const products: ProductInfo[] = data.data.map((product: any) => ({
      productId: String(product.id),
      name: product.name,
      sku: product.sku,
      categories: product.categories,
      customFields: product.custom_fields,
      images: product.images?.map((img: any) => img.url_standard),
      description: product.description,
      price: product.price,
      inventory: product.inventory_level,
      isVisible: product.is_visible,
      dateCreated: product.date_created,
      dateModified: product.date_modified,
    }));

    // Get unique categories
    const allCategories = products.flatMap(p => p.categories || []);
    const uniqueCategories = [...new Set(allCategories)];

    return {
      products,
      total: data.meta.pagination.total,
      hasMore: data.meta.pagination.total > (offset || 0) + products.length,
      categories: uniqueCategories,
      source: 'bigcommerce'
    };
  }

  /**
   * Discover products from mock data (for testing)
   */
  private async discoverFromMock(options: ProductDiscoveryOptions): Promise<DiscoveryResult> {
    const { limit = 50, offset = 0 } = options;

    // Mock aquarium product data
    const mockProducts: ProductInfo[] = [
      {
        productId: '113',
        name: 'Electric Yellow Cichlid (Labidochromis caeruleus) 5cm',
        sku: 'FISH-EYC-5CM',
        categories: ['Freshwater Livestock', 'Lake Malawi Cichlids', 'African Cichlids'],
        price: 12.99,
        inventory: 15,
        isVisible: true,
      },
      {
        productId: '114',
        name: 'Neon Tetra (Paracheirodon innesi) 2cm',
        sku: 'FISH-NT-2CM',
        categories: ['Freshwater Livestock', 'Tetras', 'Community Fish'],
        price: 2.99,
        inventory: 50,
        isVisible: true,
      },
      {
        productId: '115',
        name: 'Betta Fish Male (Betta splendens) Assorted',
        sku: 'FISH-BM-ASS',
        categories: ['Freshwater Livestock', 'Bettas (Siamese Fighting Fish)', 'Labyrinth Fish'],
        price: 8.99,
        inventory: 12,
        isVisible: true,
      },
      {
        productId: '116',
        name: 'Bronze Corydoras (Corydoras paleatus) 4cm',
        sku: 'FISH-BC-4CM',
        categories: ['Freshwater Livestock', 'Corydoras', 'Catfish'],
        price: 6.99,
        inventory: 8,
        isVisible: true,
      },
      {
        productId: '117',
        name: 'Angelfish (Pterophyllum scalare) Medium',
        sku: 'FISH-AF-MED',
        categories: ['Freshwater Livestock', 'Angelfish', 'Central & South American Cichlids'],
        price: 15.99,
        inventory: 6,
        isVisible: true,
      },
      {
        productId: '118',
        name: 'Guppy Male (Poecilia reticulata) Assorted',
        sku: 'FISH-GM-ASS',
        categories: ['Freshwater Livestock', 'Livebearers', 'Community Fish'],
        price: 3.99,
        inventory: 25,
        isVisible: true,
      },
      {
        productId: '119',
        name: 'Platy Mixed (Xiphophorus maculatus) 3cm',
        sku: 'FISH-PM-3CM',
        categories: ['Freshwater Livestock', 'Livebearers', 'Community Fish'],
        price: 4.49,
        inventory: 20,
        isVisible: true,
      },
      {
        productId: '120',
        name: 'Black Molly (Poecilia sphenops) 4cm',
        sku: 'FISH-BM-4CM',
        categories: ['Freshwater Livestock', 'Livebearers', 'Community Fish'],
        price: 5.99,
        inventory: 15,
        isVisible: true,
      },
      {
        productId: '121',
        name: 'Cardinal Tetra (Paracheirodon axelrodi) 2.5cm',
        sku: 'FISH-CT-2.5CM',
        categories: ['Freshwater Livestock', 'Tetras', 'Community Fish'],
        price: 4.99,
        inventory: 30,
        isVisible: true,
      },
      {
        productId: '122',
        name: 'Zebra Danio (Danio rerio) 3cm',
        sku: 'FISH-ZD-3CM',
        categories: ['Freshwater Livestock', 'Danio, Minnow and Rasbora', 'Community Fish'],
        price: 2.49,
        inventory: 40,
        isVisible: true,
      },
      // Add some non-fish products to test filtering
      {
        productId: '200',
        name: 'Aquarium Heater 100W',
        sku: 'EQUIP-HEAT-100W',
        categories: ['Equipment', 'Heating', 'Aquarium Hardware'],
        price: 29.99,
        inventory: 10,
        isVisible: true,
      },
      {
        productId: '201',
        name: 'Fish Flakes Tropical 100g',
        sku: 'FOOD-FLAKE-100G',
        categories: ['Food', 'Tropical Fish Food', 'Dry Food'],
        price: 8.99,
        inventory: 25,
        isVisible: true,
      },
    ];

    // Apply filters
    let filteredProducts = mockProducts;

    // Filter by categories
    if (options.categoryFilters && options.categoryFilters.length > 0) {
      filteredProducts = filteredProducts.filter(product => 
        product.categories?.some(cat => 
          options.categoryFilters!.some(filter => 
            cat.toLowerCase().includes(filter.toLowerCase())
          )
        )
      );
    }

    // Filter by keywords
    if (options.keywordFilters && options.keywordFilters.length > 0) {
      filteredProducts = filteredProducts.filter(product => 
        options.keywordFilters!.some(keyword => 
          product.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    // Filter inactive products
    if (options.skipInactive) {
      filteredProducts = filteredProducts.filter(product => product.isVisible);
    }

    // Apply pagination
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Get unique categories
    const allCategories = filteredProducts.flatMap(p => p.categories || []);
    const uniqueCategories = [...new Set(allCategories)];

    return {
      products: paginatedProducts,
      total: filteredProducts.length,
      hasMore: filteredProducts.length > offset + limit,
      categories: uniqueCategories,
      source: 'mock'
    };
  }

  /**
   * Discover only fish products (filter out equipment, food, etc.)
   */
  async discoverFishProducts(options: ProductDiscoveryOptions = {}): Promise<DiscoveryResult> {
    const fishCategoryFilters = [
      'Freshwater Livestock',
      'Fish',
      'Cichlids',
      'Tetras',
      'Livebearers',
      'Corydoras',
      'Bettas',
      'Angelfish',
      'Danio',
      'Rasbora',
      'Barbs',
      'Gourami',
      'Catfish',
      'Plecos',
      'Loaches'
    ];

    const fishKeywords = [
      'fish',
      'cichlid',
      'tetra',
      'betta',
      'guppy',
      'molly',
      'platy',
      'angelfish',
      'corydoras',
      'danio',
      'barb',
      'gourami'
    ];

    return await this.discoverProducts({
      ...options,
      categoryFilters: [...(options.categoryFilters || []), ...fishCategoryFilters],
      keywordFilters: [...(options.keywordFilters || []), ...fishKeywords],
    });
  }

  /**
   * Get product categories for filtering
   */
  async getProductCategories(): Promise<string[]> {
    try {
      const result = await this.discoverProducts({ limit: 1000 });
      return result.categories.sort();
    } catch (error) {
      console.error('❌ Failed to get product categories:', error);
      return [];
    }
  }

  /**
   * Check if BigCommerce is properly configured
   */
  private isBigCommerceConfigured(): boolean {
    return !!(this.bigcommerceConfig.storeUrl && this.bigcommerceConfig.accessToken);
  }

  /**
   * Test BigCommerce connection
   */
  async testConnection(): Promise<{ connected: boolean; error?: string; storeInfo?: any }> {
    if (!this.isBigCommerceConfigured()) {
      return { 
        connected: false, 
        error: 'BigCommerce credentials not configured' 
      };
    }

    try {
      const response = await fetch(`${this.bigcommerceConfig.storeUrl}/v2/store`, {
        headers: {
          'X-Auth-Token': this.bigcommerceConfig.accessToken!,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return { 
          connected: false, 
          error: `Connection failed: ${response.status} ${response.statusText}` 
        };
      }

      const storeInfo = await response.json();
      return { 
        connected: true, 
        storeInfo 
      };

    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }
}

/**
 * Default product discovery instance
 */
export const productDiscovery = new ProductDiscovery();

/**
 * Quick function to get fish products ready for AI generation
 */
export async function getFishForAIGeneration(options: {
  limit?: number;
  skipExisting?: boolean;
} = {}): Promise<ProductInfo[]> {
  const result = await productDiscovery.discoverFishProducts({
    limit: options.limit || 100,
    skipInactive: true,
  });

  return result.products.filter(product => {
    // Additional filtering for fish that are good candidates for AI generation
    const name = product.name.toLowerCase();
    
    // Skip if it's obviously not a fish
    if (name.includes('food') || name.includes('equipment') || 
        name.includes('tank') || name.includes('filter')) {
      return false;
    }

    // Skip if no proper species name
    if (!name.includes('(') || !name.includes(')')) {
      return false; // Most fish have scientific names in parentheses
    }

    return true;
  });
}