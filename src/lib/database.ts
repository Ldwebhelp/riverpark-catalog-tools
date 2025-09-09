// Simple database layer for development - can be extended for production
import { SpeciesData, GuideData, SessionData, DownloadHistory } from '@/types/catalog';

export interface SpeciesFileInfo {
  id: string;
  productId: string;
  commonName: string;
  scientificName?: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  fileSize: number;
}

export interface BigCommerceProduct {
  id: number;
  name: string;
  type: string;
  sku: string;
  description: string;
  price: number;
  sale_price: number;
  inventory_level: number;
  is_visible: boolean;
  categories: number[];
  brand_id: number | null;
  images: Array<{
    url: string;
    altText: string;
  }>;
  primary_image?: {
    url: string;
    altText: string;
  };
  date_modified: string;
  date_created: string;
}

export interface BigCommerceCategory {
  id: number;
  parent_id: number;
  name: string;
  description: string;
  is_visible: boolean;
  sort_order: number;
  children?: BigCommerceCategory[];
}

export class CatalogDatabase {
  // Session Management
  static async saveSession(sessionData: Omit<SessionData, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const record: SessionData = {
      id,
      ...sessionData,
      timestamp: new Date().toISOString()
    };

    // Development: Store in localStorage for now
    if (typeof window !== 'undefined') {
      localStorage.setItem(`session:${id}`, JSON.stringify(record));
    }
    
    // Production: This would connect to your database
    // await kv.set(`session:${id}`, record);
    // await kv.expire(`session:${id}`, 60 * 60 * 24 * 7); // 7 days
    
    console.log('Session saved:', record);
    return id;
  }

  static async getSession(sessionId: string): Promise<SessionData | null> {
    // Development: Get from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`session:${sessionId}`);
      return stored ? JSON.parse(stored) : null;
    }
    
    // Production: Get from database
    // return await kv.get(`session:${sessionId}`);
    return null;
  }

  // Species Data Management
  static async saveSpeciesData(data: unknown[], stats: Record<string, number>): Promise<string> {
    const sessionData: Omit<SessionData, 'id'> = {
      data,
      stats,
      type: 'species',
      timestamp: new Date().toISOString()
    };
    
    return await this.saveSession(sessionData);
  }

  static async saveSpecies(species: SpeciesData): Promise<string> {
    const now = new Date().toISOString();
    const speciesRecord = {
      ...species,
      createdAt: species.createdAt || now,
      updatedAt: now
    };

    // Development: Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`species:${species.productId}`, JSON.stringify(speciesRecord));
    }
    
    // Production: Store in database
    // await kv.set(`species:${species.productId}`, speciesRecord);
    // await kv.zadd('species_index', { score: Date.now(), member: species.productId });
    
    console.log('Species saved:', speciesRecord);
    return species.productId;
  }

  static async getSpecies(productId: string): Promise<SpeciesData | null> {
    // Development: Get from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`species:${productId}`);
      return stored ? JSON.parse(stored) : null;
    }
    
    // Production: Get from database
    // return await kv.get(`species:${productId}`);
    return null;
  }

  static async getAllSpecies(limit: number = 100): Promise<SpeciesData[]> {
    // Development: Get from localStorage
    if (typeof window !== 'undefined') {
      const species: SpeciesData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('species:')) {
          const data = localStorage.getItem(key);
          if (data) {
            species.push(JSON.parse(data));
          }
        }
      }
      return species.slice(0, limit);
    }
    
    // Production: Get from database
    // const productIds = await kv.zrange('species_index', 0, limit - 1, { rev: true });
    // if (!productIds.length) return [];
    // const speciesKeys = productIds.map(id => `species:${id}`);
    // const species = await kv.mget(...speciesKeys);
    // return species.filter(Boolean) as SpeciesData[];
    
    return [];
  }

  // Guide Management
  static async saveGuide(guide: GuideData): Promise<string> {
    const now = new Date().toISOString();
    const guideRecord = {
      ...guide,
      createdAt: guide.createdAt || now
    };

    // Development: Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`guide:${guide.slug}`, JSON.stringify(guideRecord));
    }
    
    // Production: Store in database
    // await kv.set(`guide:${guide.slug}`, guideRecord);
    // await kv.zadd('guides_index', { score: Date.now(), member: guide.slug });
    
    console.log('Guide saved:', guideRecord);
    return guide.id;
  }

  static async getGuide(slug: string): Promise<GuideData | null> {
    // Development: Get from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`guide:${slug}`);
      return stored ? JSON.parse(stored) : null;
    }
    
    // Production: Get from database
    // return await kv.get(`guide:${slug}`);
    return null;
  }

  // Download History Tracking
  static async trackDownload(download: DownloadHistory): Promise<void> {
    const key = `download:${download.sessionId}:${download.fileName}`;
    
    // Development: Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(download));
    }
    
    // Production: Store in database
    // await kv.set(key, download);
    // await kv.expire(key, 60 * 60 * 24 * 30); // 30 days
    
    console.log('Download tracked:', download);
  }

  static async getDownloadHistory(sessionId: string): Promise<DownloadHistory[]> {
    // Development: Get from localStorage
    if (typeof window !== 'undefined') {
      const downloads: DownloadHistory[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`download:${sessionId}:`)) {
          const data = localStorage.getItem(key);
          if (data) {
            downloads.push(JSON.parse(data));
          }
        }
      }
      return downloads;
    }
    
    // Production: Get from database
    // const pattern = `download:${sessionId}:*`;
    // const keys = await kv.keys(pattern);
    // if (!keys.length) return [];
    // const downloads = await kv.mget(...keys);
    // return downloads.filter(Boolean) as DownloadHistory[];
    
    return [];
  }

  // Analytics and Stats
  static async incrementCounter(counterName: string): Promise<number> {
    // Development: Simple counter in localStorage
    if (typeof window !== 'undefined') {
      const key = `counter:${counterName}`;
      const current = parseInt(localStorage.getItem(key) || '0');
      const newValue = current + 1;
      localStorage.setItem(key, newValue.toString());
      return newValue;
    }
    
    // Production: Increment in database
    // return await kv.incr(`counter:${counterName}`);
    return 1;
  }

  static async getStats(): Promise<Record<string, number>> {
    // Development: Get from localStorage
    if (typeof window !== 'undefined') {
      const stats: Record<string, number> = {
        totalSessions: 0,
        totalSpeciesGenerated: 0,
        totalGuidesGenerated: 0,
        totalDownloads: 0
      };
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('counter:')) {
          const counterName = key.replace('counter:', '');
          const value = parseInt(localStorage.getItem(key) || '0');
          stats[counterName] = value;
        }
      }
      
      return stats;
    }
    
    // Production: Get from database
    // const keys = await kv.keys('counter:*');
    // if (!keys.length) return {};
    // const values = await kv.mget(...keys);
    // const stats: Record<string, number> = {};
    // keys.forEach((key, index) => {
    //   const counterName = key.replace('counter:', '');
    //   stats[counterName] = values[index] as number || 0;
    // });
    // return stats;
    
    return {
      totalSessions: 0,
      totalSpeciesGenerated: 0,
      totalGuidesGenerated: 0,
      totalDownloads: 0
    };
  }

  // Enhanced File Management Methods
  static async getAllSpeciesFiles(): Promise<SpeciesFileInfo[]> {
    if (typeof window !== 'undefined') {
      const files: SpeciesFileInfo[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('species:')) {
          const data = localStorage.getItem(key);
          if (data) {
            const species: SpeciesData = JSON.parse(data);
            const fileName = `${species.productId}-species.json`;
            const jsonString = JSON.stringify(species, null, 2);
            files.push({
              id: species.id,
              productId: species.productId,
              commonName: species.commonName || 'Unknown Species',
              scientificName: species.scientificName,
              fileName,
              createdAt: species.createdAt,
              updatedAt: species.updatedAt,
              fileSize: new Blob([jsonString]).size
            });
          }
        }
      }
      return files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  }

  static async deleteSpeciesFiles(productIds: string[]): Promise<void> {
    if (typeof window !== 'undefined') {
      productIds.forEach(productId => {
        localStorage.removeItem(`species:${productId}`);
      });
    }
  }

  static async updateSpecies(species: SpeciesData): Promise<void> {
    const updatedSpecies = {
      ...species,
      updatedAt: new Date().toISOString()
    };
    await this.saveSpecies(updatedSpecies);
  }

  static async copyFilesToDestination(productIds: string[], destinationPath: string): Promise<{success: boolean, copiedFiles: string[], errors: string[]}> {
    // This will be implemented with Node.js fs operations in production
    // For now, return mock success for UI development
    console.log(`Would copy files for products ${productIds.join(', ')} to ${destinationPath}`);
    
    const copiedFiles: string[] = [];
    const errors: string[] = [];
    
    if (typeof window !== 'undefined') {
      for (const productId of productIds) {
        const speciesData = localStorage.getItem(`species:${productId}`);
        if (speciesData) {
          copiedFiles.push(`${productId}-species.json`);
        } else {
          errors.push(`Species data not found for product ID: ${productId}`);
        }
      }
    }
    
    return {
      success: errors.length === 0,
      copiedFiles,
      errors
    };
  }

  // BigCommerce JSON Data Management
  static async getBigCommerceProducts(): Promise<BigCommerceProduct[]> {
    // Real BigCommerce product data - replace this with actual JSON data from BigCommerce
    const realProducts: BigCommerceProduct[] = [
      {
        id: 113,
        name: "Electric Yellow Cichlid (Labidochromis caeruleus)",
        type: "physical",
        sku: "EYC-001",
        description: "Beautiful bright yellow African cichlid perfect for Malawi biotope aquariums. Hardy and peaceful species suitable for beginners.",
        price: 15.99,
        sale_price: 12.99,
        inventory_level: 25,
        is_visible: true,
        categories: [23, 24, 25],
        brand_id: null,
        images: [
          {
            url: "https://example.com/electric-yellow-1.jpg",
            altText: "Electric Yellow Cichlid swimming in aquarium"
          }
        ],
        primary_image: {
          url: "https://example.com/electric-yellow-main.jpg",
          altText: "Electric Yellow Cichlid profile view"
        },
        date_modified: "2024-01-15T10:30:00Z",
        date_created: "2023-12-01T09:00:00Z"
      },
      {
        id: 114,
        name: "Fluval 407 External Canister Filter",
        type: "physical",
        sku: "FLV-407",
        description: "High-performance external canister filter for aquariums up to 500L. Multi-stage filtration with biological, mechanical, and chemical media.",
        price: 179.99,
        sale_price: 159.99,
        inventory_level: 12,
        is_visible: true,
        categories: [30, 31],
        brand_id: 5,
        images: [
          {
            url: "https://example.com/fluval-407-1.jpg",
            altText: "Fluval 407 External Filter"
          }
        ],
        primary_image: {
          url: "https://example.com/fluval-407-main.jpg",
          altText: "Fluval 407 Filter with media"
        },
        date_modified: "2024-01-10T14:20:00Z",
        date_created: "2023-11-15T11:30:00Z"
      },
      {
        id: 115,
        name: "Cichlid Lake Salt 1kg",
        type: "physical",
        sku: "CLS-1KG",
        description: "Specialized mineral salt blend for African cichlid aquariums. Replicates natural lake water conditions for optimal fish health.",
        price: 12.99,
        sale_price: 9.99,
        inventory_level: 45,
        is_visible: true,
        categories: [32, 33],
        brand_id: 3,
        images: [
          {
            url: "https://example.com/cichlid-salt-1.jpg",
            altText: "Cichlid Lake Salt container"
          }
        ],
        primary_image: {
          url: "https://example.com/cichlid-salt-main.jpg",
          altText: "Cichlid Lake Salt 1kg package"
        },
        date_modified: "2024-01-05T16:45:00Z",
        date_created: "2023-10-20T13:15:00Z"
      },
      {
        id: 116,
        name: "Aqua One Maxi 101 Internal Filter",
        type: "physical",
        sku: "AO-M101",
        description: "Compact internal filter suitable for tanks up to 100L. Easy maintenance with quick-release media cartridge system.",
        price: 34.99,
        sale_price: 29.99,
        inventory_level: 18,
        is_visible: true,
        categories: [30, 34],
        brand_id: 7,
        images: [
          {
            url: "https://example.com/aqua-one-maxi-1.jpg",
            altText: "Aqua One Maxi 101 Filter"
          }
        ],
        primary_image: {
          url: "https://example.com/aqua-one-maxi-main.jpg",
          altText: "Aqua One Maxi 101 in aquarium"
        },
        date_modified: "2024-01-12T11:15:00Z",
        date_created: "2023-11-28T10:45:00Z"
      },
      {
        id: 117,
        name: "Interpet Heater Guard",
        type: "physical",
        sku: "IPT-HG",
        description: "Protective guard for aquarium heaters. Prevents fish damage while allowing optimal water circulation around heating element.",
        price: 8.99,
        sale_price: 7.49,
        inventory_level: 32,
        is_visible: true,
        categories: [35, 36],
        brand_id: 4,
        images: [
          {
            url: "https://example.com/heater-guard-1.jpg",
            altText: "Interpet Heater Guard"
          }
        ],
        primary_image: {
          url: "https://example.com/heater-guard-main.jpg",
          altText: "Heater Guard protecting aquarium heater"
        },
        date_modified: "2024-01-08T09:30:00Z",
        date_created: "2023-12-05T14:20:00Z"
      }
    ];
    
    return realProducts;
  }

  static async getBigCommerceCategories(): Promise<BigCommerceCategory[]> {
    // Real BigCommerce category data - replace this with actual JSON data from BigCommerce
    const realCategories: BigCommerceCategory[] = [
      {
        id: 20,
        parent_id: 0,
        name: "Livestock",
        description: "Live fish and aquatic animals for your aquarium",
        is_visible: true,
        sort_order: 1,
        children: [
          {
            id: 23,
            parent_id: 20,
            name: "African Cichlids",
            description: "Colorful cichlids from African lakes",
            is_visible: true,
            sort_order: 1
          },
          {
            id: 24,
            parent_id: 20,
            name: "Community Fish",
            description: "Peaceful fish suitable for community aquariums",
            is_visible: true,
            sort_order: 2
          },
          {
            id: 25,
            parent_id: 20,
            name: "Tropical Fish",
            description: "Warm water tropical fish species",
            is_visible: true,
            sort_order: 3
          }
        ]
      },
      {
        id: 30,
        parent_id: 0,
        name: "Filtration",
        description: "Filters and filtration equipment for aquariums",
        is_visible: true,
        sort_order: 2,
        children: [
          {
            id: 31,
            parent_id: 30,
            name: "External Filters",
            description: "Canister and external filtration systems",
            is_visible: true,
            sort_order: 1
          },
          {
            id: 34,
            parent_id: 30,
            name: "Internal Filters",
            description: "Submersible internal filter systems",
            is_visible: true,
            sort_order: 2
          }
        ]
      },
      {
        id: 32,
        parent_id: 0,
        name: "Water Treatment",
        description: "Products for water conditioning and treatment",
        is_visible: true,
        sort_order: 3,
        children: [
          {
            id: 33,
            parent_id: 32,
            name: "Aquarium Salts",
            description: "Specialized salts for different aquarium types",
            is_visible: true,
            sort_order: 1
          }
        ]
      },
      {
        id: 35,
        parent_id: 0,
        name: "Heating & Lighting",
        description: "Temperature control and lighting equipment",
        is_visible: true,
        sort_order: 4,
        children: [
          {
            id: 36,
            parent_id: 35,
            name: "Heater Accessories",
            description: "Guards, controllers and heater accessories",
            is_visible: true,
            sort_order: 1
          }
        ]
      }
    ];
    
    return realCategories;
  }

  static async saveBigCommerceProducts(products: BigCommerceProduct[]): Promise<void> {
    // Store BigCommerce products in localStorage for development
    if (typeof window !== 'undefined') {
      localStorage.setItem('bigcommerce:products', JSON.stringify(products));
    }
    console.log('BigCommerce products saved:', products.length, 'products');
  }

  static async saveBigCommerceCategories(categories: BigCommerceCategory[]): Promise<void> {
    // Store BigCommerce categories in localStorage for development
    if (typeof window !== 'undefined') {
      localStorage.setItem('bigcommerce:categories', JSON.stringify(categories));
    }
    console.log('BigCommerce categories saved:', categories.length, 'categories');
  }
}

// Export alias for compatibility
export const Database = CatalogDatabase;