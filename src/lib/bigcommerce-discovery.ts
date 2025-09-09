import { BigCommerceProduct } from '@/types/catalog';

/**
 * BigCommerce Product Discovery Service
 * Discovers and categorizes products for AI recommendations
 */
export class BigCommerceDiscovery {
  private static productDatabase: BigCommerceProduct[] = [];
  private static lastSync: Date | null = null;

  /**
   * Mock BigCommerce API call - replace with actual API integration
   */
  private static async fetchBigCommerceProducts(): Promise<BigCommerceProduct[]> {
    // In production, this would be a real BigCommerce API call
    // For now, return comprehensive mock data representing typical aquarium products
    return [
      // Filtration
      {
        id: 1001,
        name: "Fluval 407 External Filter",
        type: "physical",
        price: 179.99,
        categories: ["Filtration", "Equipment"],
        brand: "Fluval",
        custom_fields: [
          { name: "tank_size", value: "150-500L" },
          { name: "flow_rate", value: "1450L/h" }
        ]
      },
      {
        id: 1002,
        name: "Eheim Classic 250 External Filter",
        type: "physical", 
        price: 89.99,
        categories: ["Filtration", "Equipment"],
        brand: "Eheim",
        custom_fields: [
          { name: "tank_size", value: "80-250L" },
          { name: "flow_rate", value: "440L/h" }
        ]
      },
      
      // Substrates
      {
        id: 2001,
        name: "CaribSea African Cichlid Sand",
        type: "physical",
        price: 24.99,
        categories: ["Substrates", "African Cichlids"],
        brand: "CaribSea",
        custom_fields: [
          { name: "ph_buffer", value: "8.0-8.5" },
          { name: "suitable_for", value: "African Cichlids" }
        ]
      },
      {
        id: 2002,
        name: "Fluval Plant and Shrimp Stratum",
        type: "physical",
        price: 19.99,
        categories: ["Substrates", "Plants"],
        brand: "Fluval",
        custom_fields: [
          { name: "ph_effect", value: "lowers pH" },
          { name: "suitable_for", value: "Plants,Shrimp" }
        ]
      },

      // Food and Nutrition
      {
        id: 3001,
        name: "Hikari Cichlid Gold Medium Pellets",
        type: "physical",
        price: 12.99,
        categories: ["Food", "Cichlids"],
        brand: "Hikari",
        custom_fields: [
          { name: "fish_type", value: "Cichlids" },
          { name: "pellet_size", value: "Medium" }
        ]
      },
      {
        id: 3002,
        name: "New Life Spectrum Cichlid Food",
        type: "physical",
        price: 15.99,
        categories: ["Food", "Cichlids"],
        brand: "New Life Spectrum",
        custom_fields: [
          { name: "fish_type", value: "Cichlids" },
          { name: "nutrition_type", value: "Complete" }
        ]
      },

      // Water Treatment
      {
        id: 4001,
        name: "Seachem Prime Water Conditioner",
        type: "physical",
        price: 8.99,
        categories: ["Water Treatment", "Chemicals"],
        brand: "Seachem",
        custom_fields: [
          { name: "function", value: "Dechlorinator,Detoxifier" },
          { name: "suitable_for", value: "All freshwater" }
        ]
      },
      {
        id: 4002,
        name: "API Proper pH 8.2 Buffer",
        type: "physical",
        price: 6.99,
        categories: ["Water Treatment", "pH Control"],
        brand: "API",
        custom_fields: [
          { name: "target_ph", value: "8.2" },
          { name: "suitable_for", value: "African Cichlids,Marine" }
        ]
      },

      // Decoration
      {
        id: 5001,
        name: "Texas Holey Rock (per kg)",
        type: "physical",
        price: 4.99,
        categories: ["Decoration", "Rocks"],
        custom_fields: [
          { name: "ph_effect", value: "raises pH" },
          { name: "suitable_for", value: "African Cichlids" }
        ]
      },
      {
        id: 5002,
        name: "Mopani Driftwood Medium",
        type: "physical",
        price: 18.99,
        categories: ["Decoration", "Driftwood"],
        custom_fields: [
          { name: "ph_effect", value: "lowers pH slightly" },
          { name: "suitable_for", value: "Community,Plants" }
        ]
      },

      // Testing
      {
        id: 6001,
        name: "API Freshwater Master Test Kit",
        type: "physical",
        price: 24.99,
        categories: ["Testing", "Water Testing"],
        brand: "API",
        custom_fields: [
          { name: "tests_for", value: "pH,Ammonia,Nitrite,Nitrate" },
          { name: "test_count", value: "800+" }
        ]
      },

      // Heating
      {
        id: 7001,
        name: "Fluval E300 Electronic Heater",
        type: "physical",
        price: 49.99,
        categories: ["Heating", "Equipment"],
        brand: "Fluval",
        custom_fields: [
          { name: "wattage", value: "300W" },
          { name: "tank_size", value: "250-400L" }
        ]
      }
    ];
  }

  /**
   * Sync products from BigCommerce (or load from cache)
   */
  static async syncProducts(): Promise<void> {
    // Check if we need to sync (avoid excessive API calls)
    if (this.lastSync && Date.now() - this.lastSync.getTime() < 3600000) { // 1 hour cache
      return;
    }

    try {
      this.productDatabase = await this.fetchBigCommerceProducts();
      this.lastSync = new Date();
      console.log(`Synced ${this.productDatabase.length} products from BigCommerce`);
    } catch (error) {
      console.error('Failed to sync BigCommerce products:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  static getProductsByCategory(category: string): BigCommerceProduct[] {
    return this.productDatabase.filter(product =>
      product.categories.some(cat => 
        cat.toLowerCase().includes(category.toLowerCase())
      )
    );
  }

  /**
   * Search products by keywords
   */
  static searchProducts(keywords: string[]): BigCommerceProduct[] {
    const results = new Set<BigCommerceProduct>();

    keywords.forEach(keyword => {
      const matches = this.productDatabase.filter(product => {
        const searchText = `${product.name} ${product.description || ''} ${product.categories.join(' ')} ${product.brand || ''}`.toLowerCase();
        return searchText.includes(keyword.toLowerCase());
      });
      matches.forEach(match => results.add(match));
    });

    return Array.from(results);
  }

  /**
   * Get products suitable for specific fish types
   */
  static getProductsForFishType(fishType: string): BigCommerceProduct[] {
    const keywords = this.getFishTypeKeywords(fishType);
    return this.searchProducts(keywords);
  }

  /**
   * Get fish type specific keywords
   */
  private static getFishTypeKeywords(fishType: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'cichlid': ['cichlid', 'african', 'malawi', 'tanganyika', 'ph 8', 'alkaline', 'holey rock'],
      'tetra': ['tetra', 'community', 'soft water', 'plants', 'peaceful', 'schooling'],
      'betta': ['betta', 'siamese fighting', 'small tank', 'gentle filter', 'caves'],
      'goldfish': ['goldfish', 'coldwater', 'large tank', 'strong filtration', 'pond'],
      'guppy': ['guppy', 'livebearer', 'community', 'plants', 'small food'],
      'pleco': ['pleco', 'catfish', 'driftwood', 'algae', 'caves', 'large tank'],
      'angelfish': ['angelfish', 'tall tank', 'plants', 'peaceful', 'soft water'],
      'discus': ['discus', 'soft water', 'warm', 'plants', 'peaceful', 'premium food'],
    };

    const lowerFishType = fishType.toLowerCase();
    
    // Find matching keywords
    for (const [type, keywords] of Object.entries(keywordMap)) {
      if (lowerFishType.includes(type)) {
        return keywords;
      }
    }

    // Default to community fish keywords
    return ['community', 'freshwater', 'tropical'];
  }

  /**
   * Get all products (for initialization)
   */
  static getAllProducts(): BigCommerceProduct[] {
    return [...this.productDatabase];
  }

  /**
   * Filter products by price range
   */
  static filterByPriceRange(products: BigCommerceProduct[], minPrice: number, maxPrice: number): BigCommerceProduct[] {
    return products.filter(product => product.price >= minPrice && product.price <= maxPrice);
  }

  /**
   * Get product recommendations based on tank size
   */
  static getProductsByTankSize(tankSizeL: number): BigCommerceProduct[] {
    return this.productDatabase.filter(product => {
      const tankSizeField = product.custom_fields?.find(field => field.name === 'tank_size');
      if (!tankSizeField) return true; // Include if no size restriction
      
      const sizeRange = tankSizeField.value;
      if (sizeRange.includes('-')) {
        const [min, max] = sizeRange.split('-').map(s => parseInt(s.replace('L', '')));
        return tankSizeL >= min && tankSizeL <= max;
      }
      
      return true;
    });
  }
}