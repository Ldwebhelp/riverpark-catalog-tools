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
  } | null;
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
            "id": 113,
            "name": "Electric Yellow Cichlid (Labidochromis caeruleus) 5cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Electric Yellow Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Labidochromis caeruleus</li> <li><strong>Common name</strong>: Electric Yellow Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 cm (4 inches)</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Electric Yellow Cichlids need a tank with plenty of rocks and caves to mimic their natural habitat of rocky shorelines. Ensure the tank has a sandy substrate.</li> <li>They are territorial, so provide enough hiding places and visual barriers to reduce aggression.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Electric Yellow Cichlids thrive in hard, alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Maintain the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Efficient filtration is necessary to maintain water quality in their relatively small tanks.</li> <li>Ensure good water flow, but avoid strong currents as they are not natural swimmers.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Electric Yellow Cichlids are omnivores with a preference for vegetable matter. Offer them a varied diet including high-quality pellets, flakes, and occasional live or frozen foods like brine shrimp and bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be kept with other African cichlids of similar size and temperament, preferably those from Lake Malawi.</li> <li>Avoid keeping them with overly aggressive or much larger tank mates.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Electric Yellow Cichlids are relatively peaceful but can be territorial, especially during breeding.</li> <li>They are best kept in a species-only tank or with other Lake Malawi cichlids in a well-aquascaped tank with ample hiding spots.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 6,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T16:20:04+00:00",
            "date_created": "2023-10-26T07:33:08+00:00"
      },
      {
            "id": 114,
            "name": "White Spotted Cichlid (Tropheus duboisi) 3cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping White Spotted Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Tropheus duboisi</li> <li><strong>Common name</strong>: White Spotted Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika in East Africa</li> <li><strong>Adult length</strong>: 10 to 12 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>White Spotted Cichlids prefer a rocky setup with caves and crevices to mimic their natural habitat in Lake Tanganyika.</li> <li>Provide a substrate of fine sand and arrange rocks to create hiding spots and territories. Ensure the tank has ample swimming space.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH of 7.8 to 9.0 and a water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Ensure good water quality with regular water changes and proper filtration.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to maintain water quality, and provide moderate water flow to mimic the natural conditions of Lake Tanganyika.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>White Spotted Cichlids are herbivores, and their diet should consist mainly of high-quality vegetable-based flakes or pellets.</li> <li>Supplement their diet with occasional protein-rich foods like spirulina, brine shrimp, and small invertebrates.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Keep White Spotted Cichlids with other Tanganyikan cichlids that share similar water parameter requirements and aggression levels.</li> <li>Avoid keeping them with aggressive or overly territorial species that may lead to conflicts.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>White Spotted Cichlids are known for their territorial behavior, so provide plenty of hiding spots and territories to reduce aggression.</li> <li>They may form social hierarchies, so monitor their interactions and be prepared to separate individuals if aggression becomes excessive.</li> </ul> </li> </ol>",
            "price": 8.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:27+00:00",
            "date_created": "2023-10-26T07:33:12+00:00"
      },
      {
            "id": 115,
            "name": "Red Empress Cichlid (Protomelas taeniolatus)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Red Empress Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Protomelas taeniolatus</li> <li><strong>Common name</strong>: Red Empress Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 15 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Empress Cichlids prefer a spacious tank with rocky caves and open swimming areas. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide ample hiding places using rocks and aquarium-safe structures to mimic their natural habitat. Sand substrate is preferred to accommodate their digging behavior.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Empress Cichlids thrive in slightly alkaline water conditions with a pH range of 7.8 to 8.6.</li> <li>Keep the water temperature between 24 to 28ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (75 to 82ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate to strong water flow is suitable for these fish, so choose a filter that provides efficient mechanical and biological filtration.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Empress Cichlids are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality cichlid pellets or flakes as a staple.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, krill, and vegetable matter such as spirulina flakes to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Empress Cichlids can be kept with other similar-sized, non-aggressive cichlids. Avoid housing them with smaller, timid fish that may be bullied.</li> <li>They are compatible with other Malawi cichlids and peaceful species such as Synodontis catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Empress Cichlids are active swimmers and territorial, especially during breeding. Provide enough space and hiding spots to reduce aggression.</li> <li>Avoid keeping them with overly aggressive or fin-nipping fish species that may cause stress or injury.</li> </ul> </li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T16:14:35+00:00",
            "date_created": "2023-10-26T07:33:15+00:00"
      },
      {
            "id": 116,
            "name": "Zebra Obliquidens Cichlid (Astatotilapia latifasciata)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Zebra Obliquidens Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Astatotilapia latifasciata</li> <li><strong>Common name</strong>: Zebra Obliquidens Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Eastern Africa, specifically Lake Victoria and surrounding areas</li> <li><strong>Adult length</strong>: 10 to 12 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Zebra Obliquidens Cichlids prefer a tank with plenty of rocks and caves to mimic their natural habitat. Provide a sandy substrate and open swimming areas.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F) with a pH of 7.5 to 8.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A powerful filtration system is recommended to maintain water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Zebra Obliquidens Cichlids are omnivores. Offer them a varied diet including high-quality pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are best kept with other peaceful cichlids from Lake Victoria, as well as other similarly sized African cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Zebra Obliquidens Cichlids are territorial during breeding but otherwise relatively peaceful. Provide plenty of hiding spots to reduce aggression.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  56,
                  121
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:27+00:00",
            "date_created": "2023-10-26T07:33:18+00:00"
      },
      {
            "id": 117,
            "name": "Eureka Red Peacock Cichlid (Aulonocara jacobfreibergi) 5cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Eureka Red Peacock Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara jacobfreibergi</li> <li><strong>Common name</strong>: Eureka Red Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 10-15 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Eureka Red Peacock Cichlids prefer a spacious tank with plenty of swimming space and hiding spots. A minimum tank size of 200L is recommended.</li> <li>Provide rocky caves and crevices to mimic their natural habitat in Lake Malawi. Sand substrate is preferred as these fish like to sift through the sand.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Eureka Red Peacock Cichlids thrive in alkaline water conditions with a pH range of 7.8 to 8.6.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate to strong water flow is suitable for these fish, so choose a filter that provides adequate circulation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Eureka Red Peacock Cichlids are omnivores with a preference for protein-rich foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, bloodworms, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Eureka Red Peacock Cichlids are generally peaceful but can be territorial, especially males. They should be kept with other similar-sized cichlids and peaceful fish.</li> <li>Avoid housing them with overly aggressive or much larger fish that might intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Eureka Red Peacock Cichlids are active swimmers and display territorial behavior, especially males during breeding. They feel more secure with plenty of hiding spots and space to establish territories.</li> <li>Avoid keeping them with aggressive or highly territorial fish species that may provoke conflicts.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-26T18:17:23+00:00",
            "date_created": "2023-10-26T07:33:24+00:00"
      },
      {
            "id": 118,
            "name": "Blue Dolphin Cichlid (Cyrtocara moorii) 5cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Blue Dolphin Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Cyrtocara moorii</li> <li><strong>Common name</strong>: Blue Dolphin Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: Up to 25 cm (10 inches)</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a tank with a minimum size of 200 litres (53 gallons) for a single Blue Dolphin Cichlid.</li> <li>Decorate the tank with rocks, caves, and other hiding spots to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH level between 7.8 and 8.6.</li> <li>Keep the water temperature between 23&deg;C to 28&deg;C (73&deg;F to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to maintain water quality, and ensure good water flow throughout the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blue Dolphin Cichlids are omnivorous and will accept a variety of foods including pellets, flakes, and live or frozen foods like brine shrimp and bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are generally peaceful but can be territorial, so choose tank mates carefully. Avoid other aggressive or territorial species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blue Dolphin Cichlids are generally peaceful but can become aggressive during breeding periods or when defending territory. Provide plenty of hiding spots to reduce aggression.</li> <li>Compatible tank mates include other Lake Malawi cichlids with similar size and temperament.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-21T18:11:25+00:00",
            "date_created": "2023-10-26T07:33:26+00:00"
      },
      {
            "id": 119,
            "name": "Checkered Julie Cichlid (Julidochromis marlieri)",
            "type": "physical",
            "sku": "6",
            "description": "<h3>Our Guide To Keeping Checkered Julie Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Julidochromis marlieri</li> <li><strong>Common name</strong>: Checkered Julie Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika in East Africa</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Checkered Julie Cichlids prefer rocky aquarium setups mimicking their natural habitat in Lake Tanganyika. Provide caves and crevices for hiding and territory establishment.</li> <li>Use sand as the substrate to resemble the lake's sandy bottom. Rocks and driftwood can also be added for decoration and to create territorial boundaries.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Checkered Julie Cichlids thrive in alkaline water conditions with a pH range of 7.8 to 9.0.</li> <li>Maintain the water temperature between 24 to 26&deg;C (75 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Efficient filtration is crucial for maintaining water quality in the aquarium. Consider using a canister filter or a sump system to handle the biological load.</li> <li>Ensure gentle to moderate water flow in the tank, as strong currents can stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Checkered Julie Cichlids are omnivores and will accept a variety of foods including high-quality cichlid pellets, flakes, and granules.</li> <li>Offer occasional treats of live or frozen foods like bloodworms, brine shrimp, and small crustaceans to provide essential nutrients and enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Checkered Julie Cichlids are territorial and can be aggressive towards conspecifics and similar-looking species. Keep them in pairs or small groups in larger tanks to distribute aggression.</li> <li>Compatible tank mates include other Tanganyikan cichlids with a similar temperament such as Neolamprologus and Altolamprologus species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Checkered Julie Cichlids are territorial and may exhibit aggression towards tank mates, especially during breeding or territory establishment.</li> <li>Provide ample hiding places and territories to reduce aggression and allow each fish to establish its space within the aquarium.</li> </ul> </li> </ol>",
            "price": 5.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:27+00:00",
            "date_created": "2023-10-26T07:33:30+00:00"
      },
      {
            "id": 120,
            "name": "Cobalt Blue Zebra Cichlid (Maylandia callainos) 4-5cm",
            "type": "physical",
            "sku": "7",
            "description": "<h3>Our Guide To Keeping Cobalt Blue Zebra</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Metriaclima callainos</li> <li><strong>Common name</strong>: Cobalt Blue Zebra</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 10 cm (4 inches)</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Cobalt Blue Zebras thrive in a rocky habitat mimicking Lake Malawi. Provide caves, rock structures, and ample hiding spots.</li> <li>A minimum tank size of 75 gallons (283 litres) is recommended for a small group.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Keep the pH level around 7.5 to 8.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Ensure efficient filtration to maintain water quality.</li> <li>Provide moderate water flow, mimicking the natural conditions of Lake Malawi.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Cobalt Blue Zebras are omnivores. Offer them a varied diet including high-quality cichlid pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be aggressive towards other fish species, especially conspecifics. Keep them with other Lake Malawi cichlids of similar size and temperament.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Cobalt Blue Zebras are territorial and can be aggressive, especially during breeding times. Provide ample hiding places and territories to reduce aggression.</li> <li>They display fascinating behavior and are best kept in a species-specific tank or with other Lake Malawi cichlids.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 2,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:33:33+00:00"
      },
      {
            "id": 121,
            "name": "Venustus Cichlid (Nimbochromis venustus) 5cm",
            "type": "physical",
            "sku": "8",
            "description": "<h3>Our Guide To Keeping Venustus Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Nimbochromis venustus</li> <li><strong>Common name</strong>: Venustus Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in East Africa</li> <li><strong>Adult length</strong>: Up to 25 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a tank with a minimum size of 200L for a single Venustus Cichlid.</li> <li>Include plenty of rocks arranged to form caves and hiding spots, mimicking their natural habitat.</li> <li>Substrate should be sand or fine gravel to allow for natural behaviors like sifting.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH of 7.5 to 8.5.</li> <li>Water temperature should be kept between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Provide good water quality with regular water changes.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system as Venustus Cichlids are messy eaters and produce a lot of waste.</li> <li>Ensure adequate water flow, but avoid strong currents that may stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Feed a varied diet including high-quality cichlid pellets or flakes as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and small feeder fish.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Venustus Cichlids are semi-aggressive and territorial, so choose tank mates carefully.</li> <li>Compatible tank mates include other larger African cichlids with similar temperaments and size requirements.</li> <li>Avoid keeping with smaller or more peaceful fish that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Venustus Cichlids are territorial and may exhibit aggression, especially during breeding times or when establishing territories.</li> <li>Provide plenty of hiding spots and visual barriers to reduce aggression and territorial disputes.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 5,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:33:39+00:00"
      },
      {
            "id": 122,
            "name": "Red Zebra Cichlid (Maylandia estherae) 5cm",
            "type": "physical",
            "sku": "9",
            "description": "<h3>Our Guide To Keeping Red Zebra Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Maylandia estherae</li> <li><strong>Common name</strong>: Red Zebra Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Zebra Cichlids thrive in a tank with rocky structures and caves to mimic their natural habitat. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide a sandy substrate and use rocks to create hiding spots and territories within the tank.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Zebra Cichlids prefer alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filter to maintain good water quality and provide strong water flow, simulating the conditions of their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Zebra Cichlids are omnivores and can be fed a combination of high-quality cichlid pellets, flakes, and live or frozen foods like brine shrimp and bloodworms.</li> <li>Include vegetable matter in their diet, such as spirulina-based foods, to promote overall health and vibrant coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Zebra Cichlids can be territorial, especially during breeding, so it's advisable to keep them with other Lake Malawi cichlids of similar size and temperament.</li> <li>Avoid mixing them with overly aggressive or significantly larger species that may lead to aggression and stress.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Zebra Cichlids exhibit social behavior and form hierarchies within the group. Provide plenty of hiding spots to reduce aggression and allow individuals to establish territories.</li> <li>Monitor the tank for any signs of aggression and be prepared to separate individuals if necessary.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-21T17:50:15+00:00",
            "date_created": "2023-10-26T07:33:42+00:00"
      },
      {
            "id": 123,
            "name": "Demanson's Cichlid (Chindongo demasoni)",
            "type": "physical",
            "sku": "10",
            "description": "<h3>Our Guide To Keeping Demanson's Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Chindongo demasoni</li> <li><strong>Common name</strong>: Demanson's Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: Approximately 8 cm (3 inches)</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Demanson's Cichlids prefer a rocky aquarium setup mimicking their natural habitat in Lake Malawi. Use plenty of caves, rocks, and hiding spots to create territories.</li> <li>Provide a tank size of at least 75 gallons for a small group.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH level between 7.5 to 8.5.</li> <li>Water temperature should be kept between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Strong filtration is necessary to maintain water quality in their rocky environment. Ensure adequate water flow without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Demanson's Cichlids are omnivores. Offer them a varied diet including high-quality cichlid pellets, flakes, and live or frozen foods such as brine shrimp, bloodworms, and daphnia.</li> <li>Supplement their diet with vegetables like spirulina flakes or blanched vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be kept with other Lake Malawi cichlids of similar size and temperament. Avoid housing them with aggressive or overly territorial species.</li> <li>Consider tank mates like Yellow Labs, Acei Cichlids, or other peaceful Malawi cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Demanson's Cichlids are territorial, especially males. Provide plenty of hiding spots and territories to reduce aggression.</li> <li>They exhibit fascinating behaviors and are best kept in a species-only tank or with other Lake Malawi cichlids in a large, well-decorated tank.</li> </ul> </li> </ol>",
            "price": 6.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:33:45+00:00"
      },
      {
            "id": 124,
            "name": "Fairy Cichlid (Neolamprologus brichardi) 4-5cm",
            "type": "physical",
            "sku": "11",
            "description": "<h3>Our Guide To Keeping Fairy Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Neolamprologus brichardi</li> <li><strong>Common name</strong>: Fairy Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika, Africa</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Fairy Cichlids thrive in tanks with plenty of rocks and caves to mimic their natural habitat in Lake Tanganyika.</li> <li>Provide sandy substrate and create multiple hiding spots using rocks and caves. They are territorial and appreciate having their own space.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Fairy Cichlids prefer water with a pH range of 7.8 to 9.0 and a water hardness of 10-20 dH.</li> <li>Maintain the water temperature between 24 to 27&deg;C (75 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system is recommended to maintain water quality in their rocky habitat.</li> <li>Ensure good water circulation to prevent stagnant areas, but avoid strong currents that may stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Fairy Cichlids are omnivores and require a varied diet.</li> <li>Offer them high-quality cichlid pellets or flakes as a staple, supplemented with occasional live or frozen foods like brine shrimp, bloodworms, and small crustaceans.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Fairy Cichlids are territorial and should be kept with other Tanganyikan cichlids in a species-specific tank.</li> <li>Compatible tank mates include other Neolamprologus species and other cichlids from Lake Tanganyika.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Fairy Cichlids are highly territorial and will establish territories within the tank.</li> <li>They exhibit interesting behaviors such as mouthbrooding, where the female carries and protects the eggs and fry in her mouth.</li> </ul> </li> </ol>",
            "price": 5.5,
            "sale_price": 0,
            "inventory_level": 3,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-05T15:37:14+00:00",
            "date_created": "2023-10-26T07:33:47+00:00"
      },
      {
            "id": 125,
            "name": "Bumblebee Mouthbrooder Cichlid (Pseudotropheus crabro) 4-5cm",
            "type": "physical",
            "sku": "12",
            "description": "<h3>Our Guide To Keeping Bumblebee Mouthbrooder Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudotropheus crabro</li> <li><strong>Common name</strong>: Bumblebee Mouthbrooder Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Bumblebee Mouthbrooder Cichlids appreciate a rocky aquarium setup resembling their natural habitat in Lake Malawi.</li> <li>Provide a sandy substrate and include plenty of caves, rocks, and hiding spots to create territories for each fish.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Bumblebee Mouthbrooder Cichlids thrive in hard, alkaline water conditions typical of Lake Malawi.</li> <li>Keep the pH between 7.5 to 8.5 and the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Efficient filtration is essential to maintain water quality in a cichlid tank. Use a powerful filter to handle their waste and maintain good oxygenation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Bumblebee Mouthbrooder Cichlids are primarily herbivores, so their diet should include high-quality vegetable-based foods.</li> <li>Offer them a variety of spirulina-based flakes, pellets, and algae wafers supplemented with occasional protein-rich treats like brine shrimp or bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Bumblebee Mouthbrooder Cichlids are aggressive and territorial, especially towards other mbuna cichlids. Keep them with other robust African cichlid species in a large tank to distribute aggression.</li> <li>Avoid mixing them with peaceful or timid fish that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Bumblebee Mouthbrooder Cichlids are territorial and can be aggressive, especially during breeding or when establishing dominance.</li> <li>Provide plenty of hiding spots and visual barriers to reduce aggression and create territories within the tank.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-31T18:27:04+00:00",
            "date_created": "2023-10-26T07:33:52+00:00"
      },
      {
            "id": 126,
            "name": "Kenyi Cichlid (Maylandia lombardoi)",
            "type": "physical",
            "sku": "13",
            "description": "<h3>Our Guide To Keeping Kenyi Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Maylandia lombardoi</li> <li><strong>Common name</strong>: Kenyi Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 10-12 cm (4-5 inches)</li> <li><strong>Lifespan</strong>: 8-10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Kenyi Cichlids require a tank with plenty of hiding spots and caves to establish territories.</li> <li>Decorate the tank with rocks and driftwood to create hiding places and territorial boundaries.</li> <li>Provide a sandy substrate to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water parameters stable with a pH of 7.5-8.5 and a water temperature between 24-28&deg;C (75-82&deg;F).</li> <li>Regular water changes are essential to maintain water quality.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to keep the water clean and well-oxygenated.</li> <li>Kenyi Cichlids prefer moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Kenyi Cichlids are omnivores and should be fed a varied diet.</li> <li>Offer them high-quality cichlid pellets or flakes as a staple diet.</li> <li>Supplement their diet with live or frozen foods such as bloodworms, brine shrimp, and spirulina flakes.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Kenyi Cichlids are aggressive and territorial, especially towards other cichlids.</li> <li>They are best kept in a species-only tank or with other Lake Malawi cichlids of similar size and temperament.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Kenyi Cichlids are territorial and can be aggressive, especially during breeding.</li> <li>They should not be kept with peaceful or timid fish species.</li> <li>Provide plenty of hiding spots and visual barriers to reduce aggression in the tank.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:33:55+00:00"
      },
      {
            "id": 127,
            "name": "Livingston's Cichlid (Nimbochromis livingstonii)",
            "type": "physical",
            "sku": "14",
            "description": "<h3>Our Guide To Keeping Livingston&rsquo;s Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Nimbochromis livingstonii</li> <li><strong>Common name</strong>: Livingston&rsquo;s Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: Up to 25 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Livingston&rsquo;s Cichlids prefer a tank with plenty of swimming space and hiding spots. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide rocks and caves for hiding as well as open areas for swimming.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Livingston&rsquo;s Cichlids thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Livingston&rsquo;s Cichlids are carnivores and will accept a variety of foods. Offer them high-quality pellets or flakes as a staple, supplemented with live or frozen foods like bloodworms, brine shrimp, and krill.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Livingston&rsquo;s Cichlids are semi-aggressive and should be kept with similarly sized fish from Lake Malawi, such as other Mbuna cichlids.</li> <li>Avoid keeping them with smaller or more passive fish species that may be bullied.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Livingston&rsquo;s Cichlids are territorial and can be aggressive towards other fish, especially during breeding.</li> <li>Provide plenty of hiding places and break lines of sight within the tank to reduce aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 18,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-08T21:59:41+00:00",
            "date_created": "2023-10-26T07:33:58+00:00"
      },
      {
            "id": 128,
            "name": "Blue Peacock Cichlid (Aulonocara nyassae) 4-5cm",
            "type": "physical",
            "sku": "15",
            "description": "<h3>Our Guide To Keeping Blue Peacock Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara nyassae</li> <li><strong>Common name</strong>: Blue Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 12 to 15 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Blue Peacock Cichlids prefer a tank with plenty of hiding spots and caves. A minimum tank size of 75 gallons is recommended for a small group of these fish.</li> <li>Provide a sandy substrate and decorate the tank with rocks and caves to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Blue Peacock Cichlids thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A powerful filtration system is necessary to maintain water quality in a tank with Blue Peacock Cichlids. Ensure good water circulation without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blue Peacock Cichlids are omnivores and require a varied diet. Offer them high-quality cichlid pellets or flakes as a staple food.</li> <li>Supplement their diet with occasional feedings of live or frozen foods like bloodworms, brine shrimp, and small insects to provide essential nutrients and promote natural behaviors.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Blue Peacock Cichlids can be territorial, especially during breeding. They are best kept with other Lake Malawi cichlids in a species-specific or mixed cichlid tank.</li> <li>Choose tank mates of similar size and temperament to reduce aggression and minimize conflicts.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blue Peacock Cichlids are generally peaceful but can become aggressive, especially towards conspecifics or other males during breeding.</li> <li>Provide ample hiding places and territories to reduce aggression and allow them to establish their territories.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-21T15:38:29+00:00",
            "date_created": "2023-10-26T07:34:01+00:00"
      },
      {
            "id": 129,
            "name": "Electric Blue Hap Cichlid (Sciaenochromis fryeri)",
            "type": "physical",
            "sku": "16",
            "description": "<h3>Our Guide To Keeping Electric Blue Hap Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Sciaenochromis fryeri</li> <li><strong>Common name</strong>: Electric Blue Hap</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 15-20 cm (6-8 inches)</li> <li><strong>Lifespan</strong>: 8-10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Electric Blue Haps require a tank with plenty of swimming space and hiding spots. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide rock structures and caves for them to establish territories and breed.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Electric Blue Haps prefer water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A powerful filtration system is necessary to maintain water quality, as these fish are messy eaters and produce a lot of waste.</li> <li>Provide moderate water flow in the tank to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Electric Blue Haps are carnivorous and should be fed a diet high in protein.</li> <li>Offer them a variety of foods including high-quality pellets, flakes, and live or frozen foods such as bloodworms, brine shrimp, and krill.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Electric Blue Haps can be aggressive towards smaller or similarly colored fish, so choose tank mates carefully.</li> <li>Compatible tank mates include larger, robust cichlids from Lake Malawi such as other Haplochromis species and Aulonocara species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Electric Blue Haps are territorial and may exhibit aggression towards tank mates, especially during breeding.</li> <li>Provide plenty of hiding spots and visual barriers to reduce aggression and territorial disputes.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T17:19:15+00:00",
            "date_created": "2023-10-26T07:34:06+00:00"
      },
      {
            "id": 130,
            "name": "African Butterfly Cichlid (Anomalochromis thomasi)",
            "type": "physical",
            "sku": "17",
            "description": "<h3>Our Guide To Keeping African Butterfly Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Anomalochromis thomasi</li> <li><strong>Common name</strong>: African Butterfly Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: West Africa, specifically Nigeria and Cameroon</li> <li><strong>Adult length</strong>: 6-8 cm (2.5-3 inches)</li> <li><strong>Lifespan</strong>: 5-8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>African Butterfly Cichlids prefer densely planted aquariums with plenty of hiding spots such as caves, rocks, and driftwood.</li> <li>Provide a sandy substrate to mimic their natural habitat and accommodate their digging behavior.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for African Butterfly Cichlids, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>They are omnivores and will accept a variety of foods including high-quality flake or pellet food, as well as live or frozen foods like bloodworms, brine shrimp, and small insects.</li> <li>Offer a varied diet to ensure proper nutrition and health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>African Butterfly Cichlids are peaceful and can be kept with other peaceful community fish of similar size. However, avoid housing them with aggressive or territorial fish that may bully them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are relatively peaceful cichlids but can show territorial behavior, especially during breeding.</li> <li>They can be kept in a community tank with other peaceful fish species, but monitor their behavior and provide adequate space and hiding spots.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  56
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:09+00:00"
      },
      {
            "id": 131,
            "name": "Electric Blue Johanni Cichlid (Melanochromis johanni)",
            "type": "physical",
            "sku": "18",
            "description": "<h3>Our Guide To Keeping Electric Blue Johanni Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanochromis johanni</li> <li><strong>Common name</strong>: Electric Blue Johanni Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 10 cm (4 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Electric Blue Johanni Cichlids thrive in aquariums with plenty of hiding places and rock formations mimicking their natural habitat.</li> <li>Provide a tank size of at least 75 gallons for a small group.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water parameters with a pH of 7.5 to 8.5 and a temperature range of 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to keep the water clean and well-oxygenated.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Feed Electric Blue Johanni Cichlids a varied diet including high-quality cichlid pellets, flakes, and occasional treats of live or frozen foods like brine shrimp and bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Compatible tank mates include other peaceful cichlid species from Lake Malawi, such as other Melanochromis and Pseudotropheus species.</li> <li>Avoid keeping with aggressive or larger cichlids that may bully or outcompete them for resources.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Electric Blue Johanni Cichlids are territorial and can be aggressive, especially during breeding times.</li> <li>Provide plenty of hiding places and territories to reduce aggression within the aquarium.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:11+00:00"
      },
      {
            "id": 132,
            "name": "Taiwan Reef Cichlid (Protomelas sp. Steveni Taiwan)",
            "type": "physical",
            "sku": "19",
            "description": "<h3>Our Guide To Keeping Taiwan Reef Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Protomelas sp. Steveni Taiwan</li> <li><strong>Common name</strong>: Taiwan Reef Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 12-15 cm</li> <li><strong>Lifespan</strong>: 5-8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Taiwan Reef Cichlids prefer a tank with plenty of open swimming space and rocky structures for hiding and territorial behavior.</li> <li>Provide a sandy substrate and decorations like rocks and caves to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water parameters with a pH of 7.8-8.6 and a water temperature between 23-27&deg;C (73-81&deg;F).</li> <li>Keep the water well-aerated and perform regular water changes to maintain water quality.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to maintain water quality, as Taiwan Reef Cichlids are messy eaters and produce a significant amount of waste.</li> <li>Ensure good water flow to mimic their natural habitat conditions.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Feed Taiwan Reef Cichlids a varied diet including high-quality cichlid pellets, flakes, and frozen or live foods such as bloodworms, brine shrimp, and small crustaceans.</li> <li>Supplement their diet with vegetable matter like spirulina flakes or blanched vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Compatible tank mates include other Lake Malawi cichlids of similar size and temperament.</li> <li>Avoid keeping them with smaller or more passive fish species that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Taiwan Reef Cichlids are territorial and can be aggressive, especially during breeding periods.</li> <li>Provide plenty of hiding spots and visual barriers in the tank to reduce aggression and establish territories.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:14+00:00"
      },
      {
            "id": 133,
            "name": "Elongate Mbuna Cichlid (Pseudotropheus elongatus)",
            "type": "physical",
            "sku": "20",
            "description": "<h3>Our Guide To Keeping Elongate Mbuna Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudotropheus elongatus</li> <li><strong>Common name</strong>: Elongate Mbuna</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 12 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Elongate Mbunas prefer rocky habitats with plenty of hiding places and caves.</li> <li>Provide a tank with plenty of hiding spots and rock formations to mimic their natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water parameters with a pH of 7.5 to 8.5 and a temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> <li>Water hardness should be moderately hard to hard, around 10 to 20 dGH.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide efficient filtration to maintain water quality and oxygenation, as well as gentle to moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Elongate Mbunas are herbivores and feed primarily on algae and biofilm. Include a diet high in vegetable matter such as spirulina-based flakes or pellets.</li> <li>Supplement their diet with occasional feedings of live or frozen foods like brine shrimp or bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Elongate Mbunas are territorial and aggressive, especially towards conspecifics and similar-looking species. Keep them with other Lake Malawi cichlids that can withstand their aggression.</li> <li>Avoid keeping them with smaller or more passive fish that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Elongate Mbunas are highly territorial and can be aggressive towards other fish, especially during breeding times.</li> <li>Provide plenty of hiding places and territories to reduce aggression within the tank.</li> </ul> </li> </ol>",
            "price": 5.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:20+00:00"
      },
      {
            "id": 134,
            "name": "Maingano Cichlid (Melanochromis cyaneorhabdos)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Maingano Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanochromis cyaneorhabdos</li> <li><strong>Common name</strong>: Maingano Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 cm (4 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Maingano Cichlids prefer a tank with plenty of rocks and caves to mimic their natural habitat. Provide a minimum tank size of 200L.</li> <li>Include sand or fine gravel substrate to allow them to sift through for food and create territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water parameters stable with a pH of 7.5 to 8.5 and a water hardness of 10 to 18 dGH.</li> <li>Maintain the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Ensure efficient filtration to maintain water quality, and provide moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Maingano Cichlids are omnivores and should be fed a varied diet including high-quality cichlid pellets or flakes supplemented with occasional live or frozen foods like brine shrimp, bloodworms, and spirulina.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be kept with other Lake Malawi cichlids of similar size and temperament, but avoid keeping them with overly aggressive species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Maingano Cichlids are territorial and can be aggressive, especially during breeding. Provide plenty of hiding spots and territories to reduce aggression.</li> <li>They are best kept in a species-only tank or with other Lake Malawi cichlids in a large tank with ample space and hiding spots.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:23+00:00"
      },
      {
            "id": 135,
            "name": "Red Fin Kadango Cichlid (Copadichromis borleyi) 5cm",
            "type": "physical",
            "sku": "22",
            "description": "<h3>Our Guide To Keeping Red Fin Kadango Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Copadichromis borleyi</li> <li><strong>Common name</strong>: Red Fin Kadango Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 6 to 8 inches</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Fin Kadango Cichlids thrive in a spacious tank with a minimum size of 75 gallons for a single fish or pair.</li> <li>Provide hiding spots with rocks and caves to create territories, mimicking their natural habitat in Lake Malawi.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH range of 7.5 to 8.5, and water hardness between 10 to 20 dGH.</li> <li>Keep the water temperature between 78 to 82&deg;F (25 to 28&deg;C).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a strong filtration system to maintain water quality, and ensure good water flow throughout the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Fin Kadango Cichlids are omnivores and can be fed high-quality cichlid pellets, flakes, and supplemented with live or frozen foods like brine shrimp, bloodworms, and spirulina-based foods.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be kept with other Lake Malawi cichlids of similar size and temperament. Avoid housing them with overly aggressive or territorial species.</li> <li>Provide enough space and hiding spots to reduce aggression and territorial disputes among tank mates.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Fin Kadango Cichlids are generally peaceful but can exhibit aggression, especially during breeding. Monitor their behavior and provide adequate hiding spots for females if breeding occurs.</li> <li>They may display territorial behavior, so ensure there are enough hiding places and territories for each fish in the tank.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 2,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:34:26+00:00"
      },
      {
            "id": 136,
            "name": "Frontosa Cichlid (Cyphotilapia frontosa) 5cm",
            "type": "physical",
            "sku": "23",
            "description": "<h3>Our Guide To Keeping Frontosa Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Cyphotilapia frontosa</li> <li><strong>Common name</strong>: Frontosa Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Eastern Africa, specifically Lake Tanganyika</li> <li><strong>Adult length</strong>: Up to 35 cm</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Frontosa Cichlids require a spacious tank with plenty of hiding places and open swimming space. A tank size of at least 250L is recommended for a small group.</li> <li>Provide rocks and caves for them to establish territories and seek refuge.</li> <li>Substrate should be fine sand to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Frontosa Cichlids prefer alkaline water conditions with a pH range of 7.8 to 9.0.</li> <li>Keep the water temperature between 23 to 26&deg;C (73 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide efficient filtration to maintain water quality, but avoid strong water flow as Frontosa Cichlids are not strong swimmers and may struggle in high flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Frontosa Cichlids are carnivores and require a protein-rich diet. Offer them high-quality cichlid pellets or flakes as a staple.</li> <li>Supplement their diet with occasional live or frozen foods like bloodworms, brine shrimp, and small crustaceans.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Frontosa Cichlids are relatively peaceful but can be territorial, especially during breeding. They can be kept with other large, peaceful fish from Lake Tanganyika such as other cichlids like Tropheus or Julidochromis species.</li> <li>Avoid keeping them with smaller, more aggressive fish that may harass or outcompete them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Frontosa Cichlids are generally peaceful but can become territorial, especially when breeding.</li> <li>They exhibit a unique behavior of forming social hierarchies within their group.</li> </ul> </li> </ol>",
            "price": 15,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-09T11:47:09+00:00",
            "date_created": "2023-10-26T07:34:29+00:00"
      },
      {
            "id": 137,
            "name": "African Jewelfish Cichlid (Hemichromis bimaculatus)",
            "type": "physical",
            "sku": "24",
            "description": "<h3>Our Guide To Keeping African Jewelfish Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hemichromis bimaculatus</li> <li><strong>Common name</strong>: African Jewelfish</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: West Africa, from Guinea to the Sanaga River in Cameroon</li> <li><strong>Adult length</strong>: Up to 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>African Jewelfish prefer a spacious tank with plenty of swimming space. A minimum tank size of 100L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Water Sprite.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>African Jewelfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>African Jewelfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>African Jewelfish are territorial and may be aggressive towards other fish, especially during breeding. Keep them with other robust and similarly sized cichlids in a larger tank to reduce aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>African Jewelfish are territorial and may exhibit aggressive behavior, especially when breeding. It's important to provide plenty of hiding spots and territories within the tank to reduce aggression.</li> <li>Avoid keeping them with small or peaceful fish species that may become targets of aggression.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  56
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:34+00:00"
      },
      {
            "id": 138,
            "name": "Albino Kribensis Dwarf Cichlid (Pelvicachromis pulcher)",
            "type": "physical",
            "sku": "65",
            "description": "<h3>Our Guide To Keeping Albino Kribensis Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pelvicachromis pulcher</li> <li><strong>Common name</strong>: Albino Kribensis Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: West Africa, specifically Nigeria and Cameroon</li> <li><strong>Adult length</strong>: Males reach up to 10 cm (4 inches), females slightly smaller</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Albino Kribensis Dwarf Cichlids appreciate a tank with plenty of hiding places created by rocks, driftwood, and live plants. A tank size of at least 75 litres (20 gallons) is suitable for a pair.</li> <li>Provide sandy substrate and caves or coconut shells for breeding, as they are cave spawners.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>They prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 26&deg;C (75 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable, but ensure that the filter outlet is not too strong to avoid stressing the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Albino Kribensis Dwarf Cichlids are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are generally peaceful but can be territorial, especially during breeding. Compatible tank mates include other peaceful community fish of similar size and temperament such as tetras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Albino Kribensis Dwarf Cichlids are known for their interesting behavior, including their habit of digging and rearranging the substrate. They are also attentive parents and will fiercely protect their fry.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them, especially during breeding.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:37+00:00"
      },
      {
            "id": 139,
            "name": "Orange Blotch Peacock Cichlid (Aulonocara sp.) 5cm",
            "type": "physical",
            "sku": "27",
            "description": "<h3>Our Guide To Keeping Orange Blotch Peacock Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara sp.</li> <li><strong>Common name</strong>: Orange Blotch Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: Up to 15 cm</li> <li><strong>Lifespan</strong>: 6 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Orange Blotch Peacock Cichlids prefer a tank with plenty of hiding places and open swimming areas.</li> <li>Provide rocks, caves, and driftwood to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> <li>Maintain a pH level between 7.5 to 8.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish.</li> <li>Use a canister filter or powerhead to ensure proper filtration and circulation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Orange Blotch Peacock Cichlids are omnivores and should be fed a varied diet.</li> <li>Offer high-quality cichlid pellets or flakes as a staple diet.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and chopped vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Compatible with other peaceful cichlids from Lake Malawi, as well as other African cichlids of similar size and temperament.</li> <li>Avoid keeping them with overly aggressive or territorial fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Orange Blotch Peacock Cichlids are generally peaceful but can be territorial, especially during breeding.</li> <li>They do best in a species-specific tank or with other Lake Malawi cichlids.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-28T19:14:32+00:00",
            "date_created": "2023-10-26T07:34:40+00:00"
      },
      {
            "id": 140,
            "name": "Black Calvus Cichlid (Altolamprologus calvus)",
            "type": "physical",
            "sku": "28",
            "description": "<h3>Our Guide To Keeping Black Calvus Cichlid</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Altolamprologus calvus</li> <li><strong>Common name</strong>: Black Calvus Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika in East Africa</li> <li><strong>Adult length</strong>: Up to 6 inches</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Calvus Cichlids prefer a rocky aquarium setup mimicking their natural habitat. Provide caves and crevices for them to establish territories.</li> <li>Decorate the tank with smooth rocks and create multiple hiding spots to reduce aggression among individuals.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain alkaline water conditions with a pH range of 7.8 to 9.0.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide efficient filtration to maintain water quality, and a moderate water flow is suitable for these cichlids.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Black Calvus Cichlids are carnivorous. Offer them a varied diet of high-quality cichlid pellets, flakes, and include live or frozen foods like bloodworms, brine shrimp, and small crustaceans.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be kept with other Tanganyikan cichlids of similar size and temperament. Avoid aggressive tank mates that may harass them.</li> <li>Consider species like Julidochromis, Neolamprologus, and other peaceful cichlids from Lake Tanganyika.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Calvus Cichlids are known for their secretive and territorial nature. Provide plenty of hiding spots and territories to reduce aggression.</li> <li>Observe and ensure that tank mates are not overly aggressive or territorial, as this can lead to conflicts.</li> </ul> </li> </ol>",
            "price": 12,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-06T18:51:38+00:00",
            "date_created": "2023-10-26T07:34:43+00:00"
      },
      {
            "id": 141,
            "name": "Malawi Eyebiter Cichlid (Dimidiochromis compressiceps)",
            "type": "physical",
            "sku": "29",
            "description": "<h3>Our Guide To Keeping Malawi Eyebiter Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Dimidiochromis compressiceps</li> <li><strong>Common name</strong>: Malawi Eyebiter Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 25 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Malawi Eyebiters require a large tank with a minimum size of 250L to accommodate their size and territorial nature.</li> <li>Provide plenty of hiding spots using rocks and caves to create territories and reduce aggression. An open swimming area is also essential.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Malawi Eyebiters thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a robust filtration system to maintain excellent water quality and provide moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Malawi Eyebiters are carnivorous and should be fed a diet rich in protein. Offer high-quality cichlid pellets as a staple.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, krill, and small fish to mimic their natural diet and provide essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Malawi Eyebiters can be aggressive and territorial, so choose tank mates carefully. Suitable companions include other robust cichlids of similar size.</li> <li>Avoid keeping them with smaller, more peaceful fish that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Malawi Eyebiters are known for their predatory nature and unique hunting behavior. They are best kept with other large, similarly aggressive fish.</li> <li>Provide plenty of space and hiding spots to reduce territorial disputes and aggression among tank mates.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:48+00:00"
      },
      {
            "id": 142,
            "name": "Multifasciatus Cichlid (Neolamprologus multifasciatus) 2-3cm",
            "type": "physical",
            "sku": "30",
            "description": "<h3>Our Guide To Keeping Multifasciatus Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Neolamprologus multifasciatus</li> <li><strong>Common name</strong>: Multifasciatus Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika in East Africa</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Neolamprologus multifasciatus prefer a tank with multiple hiding spots like caves, shells, or rocky structures.</li> <li>Provide fine sand substrate to mimic their natural habitat as they like to dig and burrow.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH range of 7.8 to 9.0 and a water temperature between 24 to 26&deg;C (75 to 79&deg;F).</li> <li>Keep the water quality high with regular water changes and efficient filtration.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system is recommended to maintain water quality, but ensure the flow isn't too strong to stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Neolamprologus multifasciatus are omnivores and should be fed a varied diet including high-quality flakes, pellets, and occasional live or frozen foods like brine shrimp and bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are best kept in a species-only tank or with other Tanganyikan cichlids of similar size and temperament.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Neolamprologus multifasciatus are highly social and should be kept in groups of at least six individuals.</li> <li>They are territorial, especially when breeding, so provide plenty of hiding places to reduce aggression.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 3,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T09:49:08+00:00",
            "date_created": "2023-10-26T07:34:51+00:00"
      },
      {
            "id": 143,
            "name": "Yellow Peacock Cichlid (Aulonocara baenschi) 4-5cm",
            "type": "physical",
            "sku": "31",
            "description": "<h3>Our Guide To Keeping Yellow Peacock Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara baenschi</li> <li><strong>Common name</strong>: Yellow Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Yellow Peacock Cichlids prefer a tank with plenty of hiding places and open swimming areas. A minimum tank size of 100L is recommended for a small group of these fish.</li> <li>Provide rocky caves and structures for them to establish territories and breed.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Yellow Peacock Cichlids thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Adequate filtration is important to maintain water quality. They prefer moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Yellow Peacock Cichlids are omnivores. Offer them a varied diet consisting of high-quality cichlid pellets, flakes, and occasional live or frozen foods like brine shrimp and bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are generally peaceful but can be territorial during breeding. Compatible tank mates include other African cichlids from Lake Malawi and peaceful bottom dwellers.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Yellow Peacock Cichlids are active and social fish. They exhibit interesting behaviors and will display vibrant colors, especially during breeding.</li> <li>Provide plenty of hiding spots and territories to reduce aggression among tank mates.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:28+00:00",
            "date_created": "2023-10-26T07:34:54+00:00"
      },
      {
            "id": 144,
            "name": "Rusty Cichlid (Lodotropheus sprengerae) 3-4cm",
            "type": "physical",
            "sku": "32",
            "description": "<h3>Our Guide To Keeping Rusty Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Lodotropheus sprengerae</li> <li><strong>Common name</strong>: Rusty Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 cm (4 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rusty Cichlids prefer a rocky aquarium setup mimicking their natural habitat in Lake Malawi. Provide plenty of caves and rock formations for them to establish territories and seek shelter.</li> <li>A minimum tank size of 75 gallons is recommended for a small group of Rusty Cichlids.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Rusty Cichlids thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system is essential to maintain water quality in the aquarium, as Rusty Cichlids are sensitive to deteriorating water conditions.</li> <li>Ensure good water flow and oxygenation in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rusty Cichlids are omnivores with a preference for vegetable matter. Offer them a varied diet consisting of high-quality cichlid pellets, flakes, and supplemented with vegetable matter like spirulina flakes or blanched vegetables.</li> <li>Occasionally provide live or frozen foods such as bloodworms, brine shrimp, or daphnia as treats.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Rusty Cichlids can be aggressive towards conspecifics (other Rusty Cichlids) and similar-looking species. It's best to keep them in a species-only tank or with other Lake Malawi cichlids that have distinct coloration.</li> <li>Compatible tank mates include Mbuna cichlids from Lake Malawi that occupy different territories and have contrasting colors.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rusty Cichlids are territorial and can be aggressive, especially during breeding times or when establishing territories.</li> <li>Provide plenty of hiding spots and territories to minimize aggression within the tank.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 7,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:34:56+00:00"
      },
      {
            "id": 145,
            "name": "Hap Nyererei Cichlid (Pundamilia nyererei)",
            "type": "physical",
            "sku": "33",
            "description": "<h3>Our Guide To Keeping Hap Nyererei Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pundamilia nyererei</li> <li><strong>Common name</strong>: Hap Nyererei Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Victoria, East Africa</li> <li><strong>Adult length</strong>: 10 - 12 cm (4 - 5 inches)</li> <li><strong>Lifespan</strong>: 5 - 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Hap Nyererei Cichlids require a spacious tank with a minimum size of 200L.</li> <li>Decorate the tank with rocks, caves, and driftwood to create territories and hiding spots.</li> <li>Use sand or fine gravel as substrate to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water parameters with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to maintain water quality as Hap Nyererei Cichlids are sensitive to water conditions.</li> <li>Provide moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality pellets, flakes, and live or frozen foods like brine shrimp, bloodworms, and small insects.</li> <li>Supplement their diet with vegetable matter like spirulina flakes or blanched vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Choose tank mates of similar size and temperament.</li> <li>Avoid keeping them with overly aggressive or territorial fish species.</li> <li>Compatible tank mates include other Lake Victoria cichlids, Synodontis catfish, and peaceful African tetras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Hap Nyererei Cichlids are territorial and can be aggressive, especially during breeding.</li> <li>They exhibit interesting behaviors such as mouthbrooding, where the female holds fertilized eggs or fry in her mouth for protection.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  56
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T17:19:15+00:00",
            "date_created": "2023-10-26T07:35:02+00:00"
      },
      {
            "id": 146,
            "name": "Strawberry Peacock Cichlid (Aulonocara sp.) 5cm",
            "type": "physical",
            "sku": "34",
            "description": "<h3>Our Guide To Keeping Strawberry Peacock Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara sp.</li> <li><strong>Common name</strong>: Strawberry Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: Up to 15 cm</li> <li><strong>Lifespan</strong>: 6 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Strawberry Peacock Cichlids prefer a tank with plenty of hiding places and open swimming areas.</li> <li>Provide rocks, caves, and driftwood to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> <li>Maintain a pH level between 7.5 to 8.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish.</li> <li>Use a canister filter or powerhead to ensure proper filtration and circulation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Strawberry Peacock Cichlids are omnivores and should be fed a varied diet.</li> <li>Offer high-quality cichlid pellets or flakes as a staple diet.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and chopped vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Compatible with other peaceful cichlids from Lake Malawi, as well as other African cichlids of similar size and temperament.</li> <li>Avoid keeping them with overly aggressive or territorial fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Strawberry Peacock Cichlids are generally peaceful but can be territorial, especially during breeding.</li> <li>They do best in a species-specific tank or with other Lake Malawi cichlids.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-26T18:17:23+00:00",
            "date_created": "2023-10-26T07:35:04+00:00"
      },
      {
            "id": 147,
            "name": "Albino Zebra Cichlid (Maylandia sp.) 5cm",
            "type": "physical",
            "sku": "35",
            "description": "<h3>Our Guide To Keeping Albino Zebra Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Maylandia sp.</li> <li><strong>Common name</strong>: Albino Zebra Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Albino Zebra Cichlids prefer a rocky tank setup mimicking their natural habitat. Provide plenty of caves, crevices, and rocky structures for them to claim territories.</li> <li>Decorate the tank with rocks and arrange them to create multiple hiding spots and territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Albino Zebra Cichlids thrive in hard and alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Ensure efficient filtration as Albino Zebra Cichlids are sensitive to poor water quality. A canister filter or a powerful hang-on-back filter is recommended for their tank.</li> <li>Maintain good water flow but avoid strong currents as these fish prefer moderate water movement.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Albino Zebra Cichlids are omnivores with a preference for vegetable matter. Offer them a balanced diet consisting of high-quality cichlid pellets or flakes supplemented with vegetable-based foods like spirulina.</li> <li>Occasionally include protein-rich foods like bloodworms, brine shrimp, and small insects to mimic their natural diet and enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Albino Zebra Cichlids are semi-aggressive and territorial, especially during breeding. They should be kept with other Lake Malawi cichlids of similar size and temperament.</li> <li>Avoid keeping them with overly aggressive or much larger fish that may bully or stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Albino Zebra Cichlids are territorial and can be aggressive towards conspecifics and other tank mates, especially during breeding.</li> <li>Provide plenty of hiding spots and visual barriers to reduce aggression and allow weaker or subordinate fish to escape aggression.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:29+00:00",
            "date_created": "2023-10-26T07:35:07+00:00"
      },
      {
            "id": 148,
            "name": "Yellow Tail Acei Cichlid (Pseudotropheus sp) 3-4cm",
            "type": "physical",
            "sku": "36",
            "description": "<h3>Our Guide To Keeping Yellow Tail Acei Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudotropheus sp. Acei</li> <li><strong>Common name</strong>: Yellow Tail Acei</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 12 cm (4.7 inches)</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Yellow Tail Acei prefer rocky habitats, so provide a tank with plenty of rocks and caves to mimic their natural environment.</li> <li>Ensure the tank has open swimming spaces as well.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Yellow Tail Acei thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for Yellow Tail Acei.</li> <li>Choose a filter that provides gentle to moderate flow and ensure good filtration as they are sensitive to water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Yellow Tail Acei are omnivores and will accept a variety of foods.</li> <li>Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with occasional treats of live or frozen foods like bloodworms, brine shrimp, and spirulina to enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Yellow Tail Acei are relatively peaceful cichlids but can be territorial, especially during breeding.</li> <li>They are best kept with other peaceful Lake Malawi cichlids of similar size and temperament.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Yellow Tail Acei are active swimmers and may exhibit some aggression, especially during breeding.</li> <li>Avoid keeping them with aggressive or significantly smaller tank mates that may become targets of aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 7,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T12:25:19+00:00",
            "date_created": "2023-10-26T07:35:10+00:00"
      },
      {
            "id": 149,
            "name": "Red Top Ice Blue Zebra Cichlid (Maylandia greshakei)",
            "type": "physical",
            "sku": "37",
            "description": "<h3>Our Guide To Keeping Red Top Ice Blue Zebra Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Maylandia greshakei</li> <li><strong>Common name</strong>: Red Top Ice Blue Zebra Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 to 12 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Top Ice Blue Zebra Cichlids prefer a spacious tank with plenty of swimming space. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide ample hiding places and areas with rocks or caves to mimic their natural habitat. They appreciate a sandy substrate and rocky formations.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Top Ice Blue Zebra Cichlids thrive in alkaline water conditions with a pH range of 7.8 to 8.6.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Top Ice Blue Zebra Cichlids are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality cichlid pellets or flakes as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and spirulina to enhance their coloration and overall health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Top Ice Blue Zebra Cichlids are territorial and can be aggressive towards conspecifics and other tank mates, especially during breeding. Keep them with other Lake Malawi cichlids of similar size and temperament.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Top Ice Blue Zebra Cichlids are active and territorial fish, displaying aggressive behavior, especially when breeding or establishing territories.</li> <li>Avoid keeping them with shy or peaceful fish species that may be intimidated or harassed by their aggressive behavior.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:29+00:00",
            "date_created": "2023-10-26T07:35:17+00:00"
      },
      {
            "id": 150,
            "name": "Orange Blotched Zebra Cichlid (Metriaclima estherae)",
            "type": "physical",
            "sku": "42",
            "description": "<h3>Our Guide To Keeping Orange Blotched Zebra Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Metriaclima estherae</li> <li><strong>Common name</strong>: Orange Blotched Zebra Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 - 12 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Orange Blotched Zebra Cichlids prefer a spacious tank with plenty of rocks and caves to create territories.</li> <li>Provide a substrate with crushed coral or aragonite to maintain water hardness and pH suitable for cichlids.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Orange Blotched Zebra Cichlids thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Adequate filtration is essential for maintaining water quality, and a moderate water flow is suitable for these cichlids.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Orange Blotched Zebra Cichlids are omnivores. Provide a balanced diet of high-quality cichlid pellets or flakes.</li> <li>Include occasional feedings of live or frozen foods like brine shrimp, bloodworms, and spirulina to enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>These cichlids can be territorial, so it's best to keep them with other Lake Malawi cichlids in a large enough tank to establish territories.</li> <li>Avoid keeping them with overly aggressive or significantly smaller fish that may be bullied.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Orange Blotched Zebra Cichlids exhibit typical cichlid behavior, establishing territories and forming social hierarchies within the tank.</li> <li>Provide ample hiding spots and structures to alleviate aggression and territorial disputes.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 19,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-04T18:23:41+00:00",
            "date_created": "2023-10-26T07:35:20+00:00"
      },
      {
            "id": 151,
            "name": "Lemon Cichlid (Neolamprologus leleupi) 4-5cm",
            "type": "physical",
            "sku": "39",
            "description": "<h3>Our Guide To Keeping Lemon Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Neolamprologus leleupi</li> <li><strong>Common name</strong>: Lemon Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika, Africa</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Lemon Cichlids prefer a rocky aquarium setup mimicking their natural habitat. Use rocks and caves to create hiding spots and territories.</li> <li>Provide sandy substrate to allow them to sift through and dig.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water parameters with a pH range of 7.8 to 9.0 and a temperature between 24 to 27&deg;C (75 to 80&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A powerful filtration system is recommended to handle their waste and maintain water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Lemon Cichlids are territorial and best kept with other Lake Tanganyika cichlid species. Avoid keeping them with smaller or more peaceful fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are aggressive towards their own species and other similar-looking fish, so provide adequate space and territories.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:29+00:00",
            "date_created": "2023-10-26T07:35:23+00:00"
      },
      {
            "id": 152,
            "name": "Albino Peacock Cichlid (Aulonocara nyassae) 5cm",
            "type": "physical",
            "sku": "40",
            "description": "<h3>Our Guide To Keeping Albino Peacock Cichlid</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara sp.</li> <li><strong>Common name</strong>: Albino Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in East Africa</li> <li><strong>Adult length</strong>: 10-15 cm</li> <li><strong>Lifespan</strong>: 6-10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a tank with a minimum size of 200 litres for a small group of Albino Peacock Cichlids.</li> <li>Decorate the tank with rocks and caves to mimic their natural habitat and establish territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH of 7.5-8.5.</li> <li>Keep the water temperature between 24-28ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¾ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¾ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â¦ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¦ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¾ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â¦ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â¦ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (75-82ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¾ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¾ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â¦ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¦ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¾ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â¦ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â¦ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide efficient filtration to maintain water quality, and ensure a moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Albino Peacock Cichlids are omnivores, offer them a varied diet including high-quality cichlid pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> <li>Supplement their diet with vegetables like spirulina flakes or blanched vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Keep Albino Peacock Cichlids with other peaceful cichlids of similar size and temperament.</li> <li>Avoid aggressive or territorial fish species that may cause conflicts.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Albino Peacock Cichlids are generally peaceful but may show aggression during breeding or territorial disputes.</li> <li>Provide adequate hiding spots and territories to reduce aggression among tank mates.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T17:19:15+00:00",
            "date_created": "2023-10-26T07:35:26+00:00"
      },
      {
            "id": 153,
            "name": "Flavescent Peacock Cichlid (Aulonocara stuartgranti)",
            "type": "physical",
            "sku": "55",
            "description": "<h3>Our Guide To Keeping Flavescent Peacock Cichlid</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara sp.</li> <li><strong>Common name</strong>: Flavescent Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in East Africa</li> <li><strong>Adult length</strong>: 10-15 cm</li> <li><strong>Lifespan</strong>: 6-10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a tank with a minimum size of 200 litres for a small group of Albino Peacock Cichlids.</li> <li>Decorate the tank with rocks and caves to mimic their natural habitat and establish territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH of 7.5-8.5.</li> <li>Keep the water temperature between 24-28ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¾ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¾ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â¦ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¦ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¾ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â¦ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â¦ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (75-82ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¾ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¾ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â¦ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¦ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¾ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â¦ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ¢Ã¢Â€ÂžÃ‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã‚Â¦ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide efficient filtration to maintain water quality, and ensure a moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Flavescent Peacock Cichlids are omnivores, offer them a varied diet including high-quality cichlid pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> <li>Supplement their diet with vegetables like spirulina flakes or blanched vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Keep Flavescent Peacock Cichlids with other peaceful cichlids of similar size and temperament.</li> <li>Avoid aggressive or territorial fish species that may cause conflicts.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Flavescent Peacock Cichlids are generally peaceful but may show aggression during breeding or territorial disputes.</li> <li>Provide adequate hiding spots and territories to reduce aggression among tank mates.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:29+00:00",
            "date_created": "2023-10-26T07:35:31+00:00"
      },
      {
            "id": 154,
            "name": "Blockhead Cichlid (Steatocranus casuarius)",
            "type": "physical",
            "sku": "46",
            "description": "<h3>Our Guide To Keeping Blockhead Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Steatocranus casuarius</li> <li><strong>Common name</strong>: Blockhead Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: West Africa, Congo River Basin</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Blockhead Cichlids prefer a tank with plenty of hiding places such as caves and rocks. Provide a sandy substrate to mimic their natural habitat.</li> <li>They appreciate the addition of driftwood and roots for cover and territorial boundaries.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Blockhead Cichlids thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for Blockhead Cichlids, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blockhead Cichlids are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality cichlid pellets or flakes.</li> <li>Include live or frozen foods like bloodworms, brine shrimp, and daphnia as occasional treats to provide essential nutrients and enrichment.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Blockhead Cichlids are territorial and can be aggressive towards other fish, especially during breeding. Keep them with similarly sized and temperamented fish such as other West African cichlids.</li> <li>Avoid keeping them with smaller or passive tank mates that may be intimidated or harassed.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blockhead Cichlids are known for their unique head shape and territorial behavior. They may display aggression, especially during breeding, so provide ample hiding places to reduce stress.</li> <li>They can be kept in pairs or small groups in larger tanks with sufficient territory for each fish.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  56
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-12T16:47:30+00:00",
            "date_created": "2023-10-26T07:35:34+00:00"
      },
      {
            "id": 155,
            "name": "Gold Head Compressed Cichlid (Altolamprologus compressiceps) 3-4cm",
            "type": "physical",
            "sku": "47",
            "description": "<h3>Our Guide To Keeping Gold Head Compressed Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Altolamprologus compressiceps</li> <li><strong>Common name</strong>: Gold Head Compressed Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika in East Africa</li> <li><strong>Adult length</strong>: 10 to 15 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Gold Head Compressed Cichlids prefer rocky aquascapes mimicking their natural habitat in Lake Tanganyika.</li> <li>Provide caves and crevices formed by rocks for hiding and breeding.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Gold Head Compressed Cichlids thrive in alkaline water conditions with a pH range of 7.8 to 9.0.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Adequate filtration is necessary to maintain water quality, and moderate water flow is preferred.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Gold Head Compressed Cichlids are carnivorous and should be fed a diet rich in protein. Offer them high-quality pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Gold Head Compressed Cichlids are territorial and best kept with other Tanganyikan cichlids in a species-specific or biotope setup.</li> <li>Avoid keeping them with overly aggressive or territorial fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Gold Head Compressed Cichlids are relatively peaceful but can be aggressive during breeding or when defending territories.</li> <li>They display fascinating behaviors such as mouthbrooding and intricate social hierarchies.</li> </ul> </li> </ol>",
            "price": 11,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-06T18:58:36+00:00",
            "date_created": "2023-10-26T07:35:36+00:00"
      },
      {
            "id": 156,
            "name": "Saulosi Cichlid (Pseudotrophues saulosi) 3-4cm",
            "type": "physical",
            "sku": "48",
            "description": "<h3>Our Guide To Keeping Saulosi Malawi Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudotropheus saulosi</li> <li><strong>Common name</strong>: Saulosi</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 7.5 cm (3 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Saulosi prefer rocky environments with caves and crevices for hiding and breeding.</li> <li>Provide a sandy substrate to mimic their natural habitat.</li> <li>Decorate the tank with rocks and artificial caves to create territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> <li>Keep pH levels between 7.5 to 8.5.</li> <li>Water hardness should be between 10 to 20 dGH.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to maintain water quality.</li> <li>Provide moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer high-quality flake or pellet food supplemented with spirulina-based foods.</li> <li>Occasionally feed them with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Saulosi are semi-aggressive and territorial, so choose tank mates carefully.</li> <li>They can be kept with other Lake Malawi cichlids of similar size and temperament such as Pseudotropheus acei, Labidochromis caeruleus, and Melanochromis auratus.</li> <li>Avoid keeping them with larger or more aggressive cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Saulosi are active and social fish, often displaying interesting behaviors within their territories.</li> <li>They can be aggressive towards conspecifics, especially during breeding times, so it's essential to provide enough hiding spots and territories.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-10T19:28:45+00:00",
            "date_created": "2023-10-26T07:35:39+00:00"
      },
      {
            "id": 157,
            "name": "White Tail Acei Cichlid (Pseudotropheus sp. Acei)",
            "type": "physical",
            "sku": "50",
            "description": "<h3>Our Guide To Keeping White Tail Acei Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudotropheus sp. Acei</li> <li><strong>Common name</strong>: White Tail Acei</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 12 cm (4.7 inches)</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>White Tail Acei prefer rocky habitats, so provide a tank with plenty of rocks and caves to mimic their natural environment.</li> <li>Ensure the tank has open swimming spaces as well.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>White Tail Acei thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for Yellow Tail Acei.</li> <li>Choose a filter that provides gentle to moderate flow and ensure good filtration as they are sensitive to water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>White Tail Acei are omnivores and will accept a variety of foods.</li> <li>Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with occasional treats of live or frozen foods like bloodworms, brine shrimp, and spirulina to enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>White Tail Acei are relatively peaceful cichlids but can be territorial, especially during breeding.</li> <li>They are best kept with other peaceful Lake Malawi cichlids of similar size and temperament.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>White Tail Acei are active swimmers and may exhibit some aggression, especially during breeding.</li> <li>Avoid keeping them with aggressive or significantly smaller tank mates that may become targets of aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-13T14:26:56+00:00",
            "date_created": "2023-10-26T07:35:45+00:00"
      },
      {
            "id": 158,
            "name": "Shell-Dwelling Tanganyika Cichlid (Neolamprologus caudopunctatus)",
            "type": "physical",
            "sku": "51",
            "description": "<h3>Our Guide To Keeping Shell-Dwelling Tanganyika Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Neolamprologus multifasciatus</li> <li><strong>Common name</strong>: Shell-Dwelling Tanganyika Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika in Africa</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Shell-Dwelling Tanganyika Cichlids prefer a tank with sandy substrate and plenty of empty shells for them to claim as territory and breeding sites.</li> <li>Provide multiple shells per fish to allow them to establish their own territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Shell-Dwelling Tanganyika Cichlids thrive in alkaline water conditions with a pH range of 7.8 to 9.0.</li> <li>Keep the water temperature between 24 to 27&deg;C (75 to 80&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate filtration system is recommended to maintain water quality without creating too much water flow, as these fish inhabit shallow, calm waters in their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Shell-Dwelling Tanganyika Cichlids are primarily micro-predators, feeding on small invertebrates and zooplankton.</li> <li>Offer them a diet consisting of small, high-quality pellets or flakes supplemented with live or frozen foods like brine shrimp and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Due to their territorial nature, it's best to keep Shell-Dwelling Tanganyika Cichlids in a species-only tank or with other small, peaceful Tanganyika cichlids.</li> <li>Avoid keeping them with larger or more aggressive fish that may intimidate or outcompete them for resources.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Shell-Dwelling Tanganyika Cichlids are highly territorial and will fiercely defend their chosen shells.</li> <li>They form social hierarchies within their colonies, with dominant individuals claiming the best shells and breeding sites.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:29+00:00",
            "date_created": "2023-10-26T07:35:47+00:00"
      },
      {
            "id": 159,
            "name": "Five-Bar Cichlid (Neolamprologus tretocephalus)",
            "type": "physical",
            "sku": "52",
            "description": "<h3>Our Guide To Keeping Five-Bar Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Neolamprologus tretocephalus</li> <li><strong>Common name</strong>: Five-Bar Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Tanganyika in East Africa</li> <li><strong>Adult length</strong>: 12-15 cm</li> <li><strong>Lifespan</strong>: 5-8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Five-Bar Cichlids prefer a rocky setup with caves and crevices to explore and establish territories.</li> <li>Provide a sandy substrate and ample hiding spots to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Five-Bar Cichlids thrive in hard, alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system is recommended to maintain water quality, but ensure it doesn't create too much water flow as these fish prefer calmer waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Five-Bar Cichlids are omnivores and will accept a variety of foods including high-quality cichlid pellets, flakes, and frozen or live foods like bloodworms, brine shrimp, and small crustaceans.</li> <li>Offer a varied diet to ensure they receive all essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Five-Bar Cichlids can be aggressive, especially during breeding, so choose tank mates carefully.</li> <li>They are best kept with other Lake Tanganyika cichlids of similar size and temperament.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Five-Bar Cichlids are territorial and may display aggression towards other fish, especially during breeding.</li> <li>Provide ample hiding spots and territories to reduce aggression within the tank.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  53
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:29+00:00",
            "date_created": "2023-10-26T07:35:50+00:00"
      },
      {
            "id": 160,
            "name": "Cobue Dogtooth Cichlid (Cynotilapia afra \"Cobue\") 4-5cm",
            "type": "physical",
            "sku": "53",
            "description": "<h3>Our Guide To Keeping Cobue Dogtooth Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Cynotilapia afra \"Cobue\"</li> <li><strong>Common name</strong>: Cobue Dogtooth Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 10 - 12 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Cobue Dogtooth Cichlids prefer a rocky setup with caves and crevices to mimic their natural habitat.</li> <li>Provide sandy substrate and use rocks to create hiding spots and territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water parameters with a pH range of 7.5 to 8.5 and a water temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Ensure good filtration to maintain water quality, as these fish can be sensitive to poor water conditions.</li> <li>Aim for moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Cobue Dogtooth Cichlids are omnivores and will accept a variety of foods including high-quality cichlid pellets, flakes, and live or frozen foods like bloodworms, brine shrimp, and mysis shrimp.</li> <li>Offer a varied diet to ensure optimal health and coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Cobue Dogtooth Cichlids can be kept with other Lake Malawi cichlids of similar size and temperament.</li> <li>Avoid housing them with overly aggressive or territorial species to prevent conflicts.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>These cichlids are generally peaceful but can show aggression towards conspecifics or similar-looking species, especially during breeding.</li> <li>Provide plenty of hiding places and visual barriers to reduce aggression and establish territories.</li> </ul> </li> </ol>",
            "price": 7.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:29+00:00",
            "date_created": "2023-10-26T07:35:53+00:00"
      },
      {
            "id": 161,
            "name": "Sulphur-head Peacock Cichlid (Aulonocara maylandi) 5cm",
            "type": "physical",
            "sku": "54",
            "description": "<h3>Our Guide To Keeping Sulphur-head Peacock Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara maylandi</li> <li><strong>Common name</strong>: Sulphur-head Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 12-14 cm (4.7-5.5 inches)</li> <li><strong>Lifespan</strong>: 5-8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide plenty of hiding spots using rocks and caves, and use sand or fine gravel substrate to mimic their natural habitat.</li> <li>Decorate the tank with rocks, driftwood, and live plants (though they may uproot plants), creating territories and breaking lines of sight to reduce aggression.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 23-27&deg;C (73-81&deg;F) and the pH around 7.5-8.5.</li> <li>Regular water changes are essential to maintain water quality.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a good filtration system as these fish are sensitive to poor water quality.</li> <li>Ensure gentle to moderate water flow to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Feed them a variety of high-quality pellets, flakes, and frozen or live foods like brine shrimp, bloodworms, and small insects.</li> <li>Supplement their diet with vegetable matter, like spirulina, to promote their vibrant colors.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are relatively peaceful for cichlids but can be territorial, so choose tank mates of similar size and temperament, avoiding overly aggressive or shy species.</li> <li>Compatible tank mates include other African cichlids from Lake Malawi, such as Mbunas and peaceful Haplochromis species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They exhibit typical cichlid behavior, establishing territories and showing occasional aggression, especially during breeding.</li> <li>Provide plenty of hiding places and breaking lines of sight to reduce aggression among tank mates.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T17:19:15+00:00",
            "date_created": "2023-10-26T07:35:59+00:00"
      },
      {
            "id": 162,
            "name": "Deepwater Hap Cichlid (Placidochromis electra)",
            "type": "physical",
            "sku": "57",
            "description": "<h3>Our Guide To Keeping Deepwater Hap Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Placidochromis electra</li> <li><strong>Common name</strong>: Deepwater Hap Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 15 cm</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Deepwater Hap Cichlids prefer a spacious tank with plenty of swimming space. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide ample hiding places with rocks and caves to mimic their natural habitat. Sand as a substrate is preferred, along with some open areas for swimming.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Deepwater Hap Cichlids thrive in slightly alkaline to neutral water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate to strong water flow is suitable for these fish, so choose a filter that provides good water circulation and oxygenation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Deepwater Hap Cichlids are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, daphnia, and small crustaceans to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Deepwater Hap Cichlids are relatively peaceful cichlids and can be kept with other non-aggressive Malawi cichlids. Avoid keeping them with overly aggressive or territorial fish.</li> <li>They are compatible with other peaceful cichlids and some larger, non-cichlid species like Synodontis catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Deepwater Hap Cichlids are generally peaceful but can be territorial during breeding. Provide plenty of hiding spots to reduce aggression.</li> <li>Avoid keeping them with overly aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:02+00:00"
      },
      {
            "id": 163,
            "name": "Blue Neon Peacock Cichlid (Aulonocara stuartgranti)",
            "type": "physical",
            "sku": "58",
            "description": "<h3>Our Guide To Keeping Blue Neon Peacock Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Aulonocara stuartgranti</li> <li><strong>Common name</strong>: Blue Neon Peacock Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 10 to 15 cm</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Blue Neon Peacock Cichlids prefer a tank with plenty of open swimming space and rocky areas to create caves and hiding spots.</li> <li>A minimum tank size of 200L is recommended to accommodate their active nature and territorial behavior.</li> <li>Use fine sand substrate and ensure the tank has ample filtration to maintain clean water.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Blue Neon Peacock Cichlids thrive in slightly alkaline water with a pH range of 7.8 to 8.6.</li> <li>Maintain a water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Ensure the water hardness is between 10 to 20 dGH.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system is necessary to handle their waste and keep the water clean.</li> <li>Moderate water flow is ideal, as Blue Neon Peacock Cichlids come from lake environments with minimal current.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blue Neon Peacock Cichlids are omnivores and should be fed a varied diet of high-quality cichlid pellets or flakes.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, krill, and daphnia to enhance their coloration and health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Blue Neon Peacock Cichlids are relatively peaceful for cichlids but can be territorial, especially males.</li> <li>They can be kept with other peaceful cichlids and compatible species such as Synodontis catfish or larger tetras.</li> <li>Avoid keeping them with aggressive or very small fish that may be seen as prey.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blue Neon Peacock Cichlids are active and enjoy swimming throughout the tank.</li> <li>Males are often more colorful and can become territorial, especially during breeding periods.</li> <li>It's best to keep one male with multiple females to reduce aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:05+00:00"
      },
      {
            "id": 164,
            "name": "OB Malawi Eyebiter Cichlid (Dimidiochromis compressiceps)",
            "type": "physical",
            "sku": "59",
            "description": "<h3>Our Guide To Keeping Malawi Eyebiter Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Dimidiochromis compressiceps</li> <li><strong>Common name</strong>: Malawi Eyebiter Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 25 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Malawi Eyebiters require a large tank with a minimum size of 250L to accommodate their size and territorial nature.</li> <li>Provide plenty of hiding spots using rocks and caves to create territories and reduce aggression. An open swimming area is also essential.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Malawi Eyebiters thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a robust filtration system to maintain excellent water quality and provide moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Malawi Eyebiters are carnivorous and should be fed a diet rich in protein. Offer high-quality cichlid pellets as a staple.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, krill, and small fish to mimic their natural diet and provide essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Malawi Eyebiters can be aggressive and territorial, so choose tank mates carefully. Suitable companions include other robust cichlids of similar size.</li> <li>Avoid keeping them with smaller, more peaceful fish that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Malawi Eyebiters are known for their predatory nature and unique hunting behavior. They are best kept with other large, similarly aggressive fish.</li> <li>Provide plenty of space and hiding spots to reduce territorial disputes and aggression among tank mates.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:08+00:00"
      },
      {
            "id": 165,
            "name": "Coral Red Saulosi Cichlid (Pseudotropheus saulosi)",
            "type": "physical",
            "sku": "60",
            "description": "<h3>Our Guide To Keeping Coral Red Saulosi Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudotropheus saulosi</li> <li><strong>Common name</strong>: Coral Red Saulosi</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi, Africa</li> <li><strong>Adult length</strong>: 6 cm (2.4 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Coral Red Saulosi Cichlids require a tank with plenty of rocks arranged in caves and crevices to mimic their natural habitat. Provide open swimming spaces as well.</li> <li>Decorate the tank with rocks, caves, and a sandy substrate to resemble their native rocky shoreline environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Saulosi Cichlids thrive in hard, alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A powerful filtration system is necessary to maintain water quality in the tank due to the high bio-load typically associated with cichlid tanks.</li> <li>Ensure adequate water flow and oxygenation in the tank, especially if keeping a densely populated aquarium.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Coral Red Saulosi Cichlids are primarily herbivorous, so their diet should include high-quality vegetable matter such as spirulina-based flake or pellet foods.</li> <li>Supplement their diet with occasional offerings of live or frozen foods like brine shrimp or bloodworms to provide essential protein.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Coral Red Saulosi Cichlids are relatively peaceful for cichlids but can be territorial, especially during breeding. It's best to keep them with other Lake Malawi cichlids of similar size and temperament.</li> <li>Avoid housing them with overly aggressive or significantly larger tank mates that may intimidate or harm them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Coral Red Saulosi Cichlids are active and social fish that thrive in the presence of conspecifics. Keep them in groups of at least six individuals to reduce aggression and display their natural behaviors.</li> <li>They may exhibit some aggression, particularly during breeding, so provide ample hiding places and territories to mitigate potential conflicts.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:13+00:00"
      },
      {
            "id": 166,
            "name": "Powder Blue Cichlid (Pseudotropheus socolofi) 4-5cm",
            "type": "physical",
            "sku": "62",
            "description": "<h3>Our Guide To Keeping Powder Blue Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudotropheus socolofi</li> <li><strong>Common name</strong>: Powder Blue Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Powder Blue Cichlids prefer a tank with plenty of rocks and caves to establish territories. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide sandy substrate and ample hiding places to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Powder Blue Cichlids thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate to high water flow is suitable for these fish, so choose a filter that provides adequate flow and efficient filtration.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Powder Blue Cichlids are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality cichlid pellets or flakes as a staple.</li> <li>Supplement their diet with occasional feedings of live or frozen foods like bloodworms, brine shrimp, and mysis shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Powder Blue Cichlids can be aggressive towards other fish, especially conspecifics and similarly colored species. Keep them with other Lake Malawi cichlids in a large enough tank to reduce aggression.</li> <li>Avoid keeping them with slow-moving or timid fish species that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Powder Blue Cichlids are territorial and can be aggressive, especially during breeding times. Provide plenty of hiding places and break lines of sight to reduce aggression.</li> <li>They are best kept in a species-only tank or with other Lake Malawi cichlids accustomed to their behavior and aggression levels.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 1,
            "is_visible": true,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:36:15+00:00"
      },
      {
            "id": 167,
            "name": "Hyena Cichlid (Nimbochromis polystigma)",
            "type": "physical",
            "sku": "64",
            "description": "<h3>Our Guide To Keeping Nimbochromis polystigma Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Nimbochromis polystigma</li> <li><strong>Common name</strong>: Hyena Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Lake Malawi in Africa</li> <li><strong>Adult length</strong>: 25 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Hyena Cichlids prefer a spacious tank with plenty of swimming space. A minimum tank size of 300L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with rocks and caves to mimic their natural habitat. They appreciate rocks stacked into formations and caves made from slate or ceramic.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Hyena Cichlids thrive in alkaline water conditions with a pH range of 7.5 to 8.5.</li> <li>Keep the water temperature between 24 to 28ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (75 to 82ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Hyena Cichlids are carnivores and primarily feed on small fish and invertebrates in the wild. Offer them a diet high in protein, such as quality cichlid pellets or flakes supplemented with occasional live foods like earthworms, shrimp, or small fish.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Hyena Cichlids can be aggressive and territorial, especially towards other cichlids. It is best kept with other large, robust cichlids from Lake Malawi that can handle its aggressive behavior.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Hyena Cichlids are ambush predators known for their intelligence and hunting strategies. They should be kept with fish that can hold their own and are not easily intimidated.</li> <li>Due to their aggressive nature, avoid keeping Hyena Cichlids with smaller or more passive fish species.</li> </ul> </li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  54
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:18+00:00"
      },
      {
            "id": 168,
            "name": "Albino Bronze Corydora (Corydoras aeneus) 2.8cm",
            "type": "physical",
            "sku": "66",
            "description": "<h3>Our Guide To Keeping Albino Bronze Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras aeneus</li> <li><strong>Common name</strong>: Albino Bronze Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, Amazon River basin</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Albino Bronze Corys prefer a tank with a sandy substrate and plenty of hiding places like caves, driftwood, and plants.</li> <li>Provide areas with gentle water flow as well as still areas to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Albino Bronze Corys prefer slightly acidic to neutral water with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system is suitable to maintain water quality without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Albino Bronze Corys are omnivores and accept a variety of foods including sinking pellets, flakes, and frozen or live foods like bloodworms and brine shrimp.</li> <li>Feed them a balanced diet to ensure proper nutrition and health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Albino Bronze Corys are peaceful and can be kept with other peaceful community fish like tetras, rasboras, and peaceful barbs.</li> <li>Avoid keeping them with aggressive or larger fish that may intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Albino Bronze Corys are peaceful bottom-dwelling fish that enjoy being kept in groups of at least six individuals.</li> <li>They are compatible with a wide range of community fish and make excellent tank mates.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 13,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-09T10:41:31+00:00",
            "date_created": "2023-10-26T07:36:21+00:00"
      },
      {
            "id": 169,
            "name": "Bronze Corydora (Corydoras aeneus) 2.8cm",
            "type": "physical",
            "sku": "67",
            "description": "<h3>Our Guide To Keeping Bronze Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras aeneus</li> <li><strong>Common name</strong>: Bronze Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, Amazon River basin</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Bronze Corys prefer a tank with a sandy substrate and plenty of hiding places like caves, driftwood, and plants.</li> <li>Provide areas with gentle water flow as well as still areas to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Bronze Corys prefer slightly acidic to neutral water with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system is suitable to maintain water quality without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Bronze Corys are omnivores and accept a variety of foods including sinking pellets, flakes, and frozen or live foods like bloodworms and brine shrimp.</li> <li>Feed them a balanced diet to ensure proper nutrition and health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Bronze Corys are peaceful and can be kept with other peaceful community fish like tetras, rasboras, and peaceful barbs.</li> <li>Avoid keeping them with aggressive or larger fish that may intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Bronze Corys are peaceful bottom-dwelling fish that enjoy being kept in groups of at least six individuals.</li> <li>They are compatible with a wide range of community fish and make excellent tank mates.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 18,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T16:10:18+00:00",
            "date_created": "2023-10-26T07:36:26+00:00"
      },
      {
            "id": 170,
            "name": "Salt & Pepper Corydora (Corydoras habrosus)",
            "type": "physical",
            "sku": "68",
            "description": "<h3>Our Guide To Keeping Salt &amp; Pepper Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras habrosus</li> <li><strong>Common name</strong>: Salt &amp; Pepper Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically in the Upper Orinoco and Upper Rio Negro basins in Venezuela and Colombia</li> <li><strong>Adult length</strong>: 2.5 cm (1 inch)</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Salt &amp; Pepper Corys thrive in well-established tanks with soft, sandy substrate to allow for natural foraging behavior without causing damage to their delicate barbels.</li> <li>Provide hiding places like caves, driftwood, and plants to make them feel secure.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Salt &amp; Pepper Corys prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Salt &amp; Pepper Corys are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality sinking pellets or tablets as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Salt &amp; Pepper Corys are peaceful shoaling fish and should be kept in groups of at least six individuals.</li> <li>They are compatible with other small, peaceful fish such as tetras, rasboras, and dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Salt &amp; Pepper Corys are peaceful bottom-dwellers and exhibit shoaling behavior, so they feel more secure and display natural behaviors when kept in a group.</li> <li>Avoid keeping them with large, aggressive fish species that may intimidate or outcompete them for food.</li> </ul> </li> </ol>",
            "price": 3.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:29+00:00"
      },
      {
            "id": 171,
            "name": "Panda Corydora (Corydoras panda) 2.8cm",
            "type": "physical",
            "sku": "69",
            "description": "<h3>Our Guide To Keeping Panda Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras panda</li> <li><strong>Common name</strong>: Panda Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically found in the upper reaches of the Rio Pachitea drainage in Peru</li> <li><strong>Adult length</strong>: 4.5 cm (1.8 inches)</li> <li><strong>Lifespan</strong>: 5 years or more with proper care</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Panda Corys prefer a well-planted tank with plenty of hiding spots, such as caves, driftwood, and dense vegetation.</li> <li>A tank size of at least 20 gallons (75 litres) is recommended for a small group of these fish.</li> <li>Provide a substrate of fine sand or smooth gravel to protect their delicate barbels.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Panda Corys thrive in tropical freshwater conditions with a temperature range of 22 to 26&deg;C (72 to 79&deg;F).</li> <li>Maintain a slightly acidic to neutral pH level between 6.5 and 7.5.</li> <li>Ensure good water quality with regular water changes and filtration.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide gentle to moderate water flow in the tank, as Panda Corys prefer slow-moving water.</li> <li>Use a filtration system that won't create strong currents, as these fish inhabit calm waters in nature.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Panda Corys are omnivores and will accept a variety of foods.</li> <li>Offer them a balanced diet of high-quality sinking pellets or granules as a staple food.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia for optimal health and coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Panda Corys are peaceful bottom-dwelling fish that do well in community tanks.</li> <li>They can be kept with other peaceful fish species that occupy different levels of the tank, such as tetras, rasboras, and small peaceful cichlids.</li> <li>Avoid keeping them with large or aggressive species that may intimidate or outcompete them for food.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Panda Corys are social fish that should be kept in groups of at least 6 individuals to thrive.</li> <li>They are active during the day and spend most of their time scavenging the bottom of the tank for food.</li> <li>Compatible tank mates include other peaceful community fish that won't outcompete them for food or harass them.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 11,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T12:05:01+00:00",
            "date_created": "2023-10-26T07:36:32+00:00"
      },
      {
            "id": 172,
            "name": "Peppered Corydora (Corydoras paleatus) 2.8cm",
            "type": "physical",
            "sku": "70",
            "description": "<h3>Our Guide To Keeping Peppered Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras paleatus</li> <li><strong>Common name</strong>: Peppered Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically Argentina, Brazil, and Uruguay</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Peppered Corys thrive in a tank with a sandy substrate to mimic their natural habitat.</li> <li>Provide hiding places such as caves, driftwood, and plants like Java Moss and Amazon Sword.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water slightly acidic to neutral with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Ensure gentle to moderate water flow in the tank, as Peppered Corys prefer calm waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality sinking pellets or wafers as a staple.</li> <li>Supplement their diet with frozen or live foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Peppered Corys are peaceful and can be kept with other peaceful community fish such as tetras, rasboras, and small peaceful cichlids.</li> <li>Avoid keeping them with larger or aggressive species that may bully or intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Peppered Corys are social and should be kept in groups of at least 6 individuals.</li> <li>They are bottom dwellers and spend most of their time scavenging for food.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 26,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-05T10:52:35+00:00",
            "date_created": "2023-10-26T07:36:34+00:00"
      },
      {
            "id": 173,
            "name": "Elegant Corydora (Corydoras elegans)",
            "type": "physical",
            "sku": "71",
            "description": "<h3>Our Guide To Keeping Elegant Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras elegans</li> <li><strong>Common name</strong>: Elegant Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, Amazon River Basin</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Elegant Corys prefer a tank with sandy substrate and plenty of hiding spots like caves, driftwood, and plants.</li> <li>Include plants like Java Moss and Amazon Sword to provide cover and replicate their natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Elegant Corys thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system is suitable for Elegant Corys to maintain water quality without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Elegant Corys are omnivores and will accept a variety of foods including sinking pellets, flakes, and live or frozen foods like bloodworms and brine shrimp.</li> <li>Offer a balanced diet to ensure their health and provide occasional treats like blanched vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Elegant Corys are peaceful community fish and should be kept in groups of at least six individuals.</li> <li>They are compatible with other peaceful fish species such as tetras, rasboras, small peaceful cichlids, and other Corydoras species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Elegant Corys are bottom-dwelling fish that display shoaling behavior, so they feel more secure and exhibit natural behaviors in a group.</li> <li>Avoid keeping them with aggressive or large fish that may intimidate or prey on them.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:41+00:00"
      },
      {
            "id": 174,
            "name": "Emerald Corydora (Corydoras splendens) 4-5cm",
            "type": "physical",
            "sku": "72",
            "description": "<h3>Our Guide To Keeping Emerald Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras splendens</li> <li><strong>Common name</strong>: Emerald Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically the Amazon River Basin</li> <li><strong>Adult length</strong>: Typically grows up to 5 cm (2 inches)</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Emerald Corys prefer a spacious tank with plenty of swimming space. A minimum tank size of 75 litres (20 gallons) is recommended for a small group of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and driftwood for cover.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Emerald Corys thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Emerald Corys are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality sinking pellets or wafers as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Emerald Corys are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Emerald Corys are bottom-dwelling and peaceful fish that spend most of their time scavenging for food. They are suitable for community tanks and can coexist with a wide range of peaceful fish species.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:44+00:00"
      },
      {
            "id": 175,
            "name": "Wild Caught Skunk Corydora (Corydoras arcuatus)",
            "type": "physical",
            "sku": "73",
            "description": "<h3>Our Guide To Keeping Skunk Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras arcuatus</li> <li><strong>Common name</strong>: Skunk Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, Amazon River Basin</li> <li><strong>Adult length</strong>: 5.5 cm to 7 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Skunk Corys prefer a tank with soft, sandy substrate and plenty of hiding spots such as caves, driftwood, and plants.</li> <li>Include live plants like Java ferns, Amazon swords, and floating plants to provide cover and mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water temperature between 22&deg;C to 26&deg;C (72&deg;F to 79&deg;F).</li> <li>Keep pH levels between 6.0 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filtration system to ensure water flow is not too strong for Skunk Corys.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including sinking pellets, algae wafers, and small live or frozen foods like bloodworms and brine shrimp.</li> <li>They are scavengers and will also graze on leftover food in the tank.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Skunk Corys are peaceful and do well with other peaceful community fish such as tetras, rasboras, and dwarf cichlids.</li> <li>Avoid keeping them with aggressive or larger species that may intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Skunk Corys are social fish and should be kept in groups of at least six individuals.</li> <li>They are bottom dwellers and spend most of their time scavenging for food in the substrate.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:47+00:00"
      },
      {
            "id": 176,
            "name": "Sterba's Corydora (Corydoras sterbai)",
            "type": "physical",
            "sku": "74",
            "description": "<h3>Our Guide To Keeping Sterba's Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras sterbai</li> <li><strong>Common name</strong>: Sterba's Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: Upper Rio Guapor&eacute; in Brazil</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Sterba's Corys appreciate a tank with soft substrate and plenty of hiding places like caves, driftwood, and plants.</li> <li>Ensure the tank has smooth decorations to prevent damage to their delicate barbels.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain the water temperature between 24 to 26&deg;C (75 to 79&deg;F).</li> <li>They prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Avoid strong water currents as Sterba's Corys prefer calmer waters. Opt for a filter with gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Sterba's Corys are omnivores and will accept a variety of foods including sinking pellets, flakes, and frozen or live foods like bloodworms and brine shrimp.</li> <li>Feed them sinking foods as they are bottom-dwellers and may not compete well for food at the surface.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and should be kept in groups of at least six individuals.</li> <li>Compatible tank mates include other peaceful community fish like tetras, rasboras, dwarf cichlids, and other Corydoras species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Sterba's Corys are social and active bottom-dwellers, often seen scavenging for food.</li> <li>They are compatible with most peaceful tank mates but avoid keeping them with aggressive or large fish that may intimidate or prey on them.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 2,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T14:10:49+00:00",
            "date_created": "2023-10-26T07:36:49+00:00"
      },
      {
            "id": 177,
            "name": "Wild Caught False Bandit Corydora (Corydoras melini)",
            "type": "physical",
            "sku": "76",
            "description": "<h3>Our Guide To Keeping False Bandit Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras sterbai</li> <li><strong>Common name</strong>: False Bandit Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, Brazil</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>False Bandit Corys prefer a tank with soft substrate like sand or fine gravel to sift through in search of food.</li> <li>They appreciate hiding places such as caves, driftwood, and plants like Java Moss or Anubias.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>False Bandit Corys prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for False Bandit Corys, so choose a filter that provides gentle filtration without strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>False Bandit Corys are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality sinking pellets or granules as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>False Bandit Corys are peaceful bottom-dwelling fish and can be kept with other peaceful community fish such as tetras, rasboras, small peaceful cichlids, and non-aggressive bottom dwellers.</li> <li>Avoid keeping them with large or aggressive fish species that may intimidate or harass them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>False Bandit Corys are social fish and should be kept in groups of at least 6 individuals to thrive and display their natural behaviors.</li> <li>They are peaceful and make excellent additions to community tanks.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:36:55+00:00"
      },
      {
            "id": 178,
            "name": "Black Corydora (Corydoras schultzei) 3-4cm",
            "type": "physical",
            "sku": "77",
            "description": "<h3>Our Guide To Keeping Black Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras schultzei</li> <li><strong>Common name</strong>: Black Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America</li> <li><strong>Adult length</strong>: Up to 5 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a tank with a sandy substrate and plenty of hiding places like caves, driftwood, and plants.</li> <li>They prefer a well-oxygenated tank with gentle filtration and moderate water flow.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water temperature between 22 to 26&deg;C (72 to 79&deg;F) and a pH level around 6.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter with gentle to moderate flow to keep the water clean without causing too much disturbance.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Feed them a varied diet including sinking pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful community fish and can be kept with other small, non-aggressive species like tetras, rasboras, and small peaceful catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Corys are peaceful bottom-dwellers that enjoy scavenging for food. They should not be housed with larger or aggressive species that may intimidate them.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 6,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-05T21:26:59+00:00",
            "date_created": "2023-10-26T07:36:58+00:00"
      },
      {
            "id": 179,
            "name": "Duplicate Corydora (Corydoras duplicareus)",
            "type": "physical",
            "sku": "78",
            "description": "<h3>Our Guide To Keeping Corydoras duplicareus Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras duplicareus</li> <li><strong>Common name</strong>: Duplicate Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically found in the upper Rio Negro basin in Brazil and the upper Orinoco basin in Venezuela</li> <li><strong>Adult length</strong>: Up to 6 centimeters (2.4 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Corydoras duplicareus prefer a well-planted aquarium with soft, sandy substrate.</li> <li>Provide hiding spots like caves, driftwood, and plants to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH level between 6.0 and 7.5.</li> <li>Water temperature should range from 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filter as Corydoras duplicareus prefer slow to moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>They are omnivores and should be fed a balanced diet including sinking pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> <li>Ensure they have access to food on the substrate as they are bottom feeders.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Compatible with other peaceful fish such as tetras, rasboras, and other small catfish species.</li> <li>Avoid keeping them with aggressive or large fish that may intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Corydoras duplicareus are peaceful and social fish, best kept in groups of at least 6 individuals.</li> <li>They are bottom-dwellers and spend much of their time scavenging the substrate for food.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-27T20:55:54+00:00",
            "date_created": "2023-10-26T07:37:00+00:00"
      },
      {
            "id": 180,
            "name": "Orange Bronze Corydora (Corydoras aeneus) 2.5cm",
            "type": "physical",
            "sku": "79",
            "description": "<h3>Our Guide To Keeping Orange Bronze Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras aeneus</li> <li><strong>Common name</strong>: Orange Bronze Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, Amazon River basin</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Orange Bronze Corys prefer a tank with a sandy substrate and plenty of hiding places like caves, driftwood, and plants.</li> <li>Provide areas with gentle water flow as well as still areas to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Orange Bronze Corys prefer slightly acidic to neutral water with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system is suitable to maintain water quality without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Orange Bronze Corys are omnivores and accept a variety of foods including sinking pellets, flakes, and frozen or live foods like bloodworms and brine shrimp.</li> <li>Feed them a balanced diet to ensure proper nutrition and health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Orange Bronze Corys are peaceful and can be kept with other peaceful community fish like tetras, rasboras, and peaceful barbs.</li> <li>Avoid keeping them with aggressive or larger fish that may intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Orange Bronze Corys are peaceful bottom-dwelling fish that enjoy being kept in groups of at least six individuals.</li> <li>They are compatible with a wide range of community fish and make excellent tank mates.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 18,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-30T08:36:16+00:00",
            "date_created": "2023-10-26T07:37:03+00:00"
      },
      {
            "id": 181,
            "name": "Dirty Bandit Corydora (Corydoras loxozonus)",
            "type": "physical",
            "sku": "80",
            "description": "<h3>Our Guide To Keeping Dirty Bandit Cory</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras loxozonus</li> <li><strong>Common name</strong>: Dirty Bandit Cory,Slant Bar Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America (Amazon Basin)</li> <li><strong>Adult length</strong>: Approximately 2.5 inches (6.5 cm)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Dirty Bandit Corys prefer a well-planted aquarium with soft, sandy substrate.</li> <li>Provide hiding spots with driftwood, caves, and plants to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water parameters with a pH range of 6.0 to 7.5 and a temperature between 72 to 78&deg;F (22 to 26&deg;C).</li> <li>Ensure good water quality and perform regular water changes.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filter to avoid strong currents that may stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Dirty Bandit Corys are omnivores and accept a variety of foods including high-quality sinking pellets, flakes, and frozen or live foods like bloodworms and brine shrimp.</li> <li>Ensure a balanced diet with occasional vegetable matter.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and can be kept with other small, non-aggressive fish such as tetras, rasboras, and dwarf cichlids.</li> <li>Avoid keeping them with larger or aggressive species that may outcompete or harass them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Dirty Bandit Corys are social and should be kept in groups of at least six individuals.</li> <li>They are peaceful bottom-dwellers and coexist well with other community fish.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:37:08+00:00"
      },
      {
            "id": 182,
            "name": "Blackfin Corydora (Corydoras leucomelas)",
            "type": "physical",
            "sku": "81",
            "description": "<h3>Our Guide To Keeping Blackfin Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras leucomelas</li> <li><strong>Common name</strong>: Blackfin Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically in Brazil and Colombia</li> <li><strong>Adult length</strong>: 5 to 6 centimeters (2 to 2.5 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Blackfin Cory prefers a well-decorated tank with plenty of hiding spots. Use smooth gravel or sand substrate to prevent damage to their delicate barbels.</li> <li>Add driftwood, rocks, and plants like Java Moss and Amazon Sword to create a natural environment and provide hiding places.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> <li>Maintain a pH level between 6.0 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Avoid strong water flow as Blackfin Cory prefers calmer waters. Use a gentle filtration system to maintain water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blackfin Cory is an omnivore and enjoys a varied diet. Offer them high-quality sinking pellets or granules as a staple.</li> <li>Supplement their diet with frozen or live foods like bloodworms, brine shrimp, and daphnia for optimal health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Blackfin Cory is a peaceful species and can be kept with other small, non-aggressive fish like tetras, rasboras, and peaceful dwarf cichlids.</li> <li>Avoid keeping them with large or aggressive species that may intimidate or outcompete them for food.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blackfin Cory is a social fish and should be kept in groups of at least six individuals to thrive.</li> <li>They are bottom-dwellers and spend most of their time scavenging for food along the substrate.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:37:11+00:00"
      },
      {
            "id": 183,
            "name": "Rusty Corydora (Corydoras rabauti)",
            "type": "physical",
            "sku": "82",
            "description": "<h3>Our Guide To Keeping Rusty Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras rabauti</li> <li><strong>Common name</strong>: Rusty Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically Brazil and Colombia</li> <li><strong>Adult length</strong>: 5 to 6 centimeters (2 to 2.5 inches)</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rusty Corys prefer a tank with soft substrate like sand or fine gravel to prevent injury to their delicate barbels.</li> <li>Provide plenty of hiding places such as caves, driftwood, and plants like Java moss and Amazon sword plants.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Rusty Corys thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for Rusty Corys, so choose a filter that provides this range of flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rusty Corys are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality sinking pellets or wafers as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Rusty Corys are peaceful bottom-dwelling fish and are compatible with other peaceful community fish such as tetras, rasboras, and small to medium-sized peaceful cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rusty Corys are social fish and should be kept in groups of at least 6 individuals to prevent stress.</li> <li>They are peaceful and can coexist with a variety of tank mates as long as they are not aggressive.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:37:14+00:00"
      },
      {
            "id": 184,
            "name": "Gold Laser Corydora (Corydoras sp. 'CW010') 3-4cm",
            "type": "physical",
            "sku": "84",
            "description": "<h3>Our Guide To Keeping Gold Laser Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras sp. 'CW010'</li> <li><strong>Common name</strong>: Gold Laser Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America</li> <li><strong>Adult length</strong>: 2.5 inches (6 cm)</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Gold Laser Corys prefer a tank with soft substrate like sand or smooth gravel to protect their delicate barbels.</li> <li>Provide plenty of hiding places with driftwood, caves, and plants to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep water conditions stable with a pH range of 6.0 to 7.5 and a temperature between 72&deg;F to 78&deg;F (22&deg;C to 26&deg;C).</li> <li>Ensure good filtration and regular water changes to maintain water quality.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with gentle to moderate flow as Gold Laser Corys prefer slow-moving water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Gold Laser Corys are omnivores and will accept a variety of foods including sinking pellets, flakes, and frozen or live foods like bloodworms and brine shrimp.</li> <li>Offer a balanced diet to ensure proper nutrition, including occasional vegetable-based foods.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Gold Laser Corys are peaceful community fish and can be kept with other non-aggressive species that won't outcompete them for food.</li> <li>They are compatible with small to medium-sized community fish like tetras, rasboras, gouramis, and peaceful barbs.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Gold Laser Corys are social fish and should be kept in groups of at least 6 individuals to thrive.</li> <li>They are peaceful bottom-dwellers and should not be housed with aggressive or fin-nipping species that may stress them.</li> </ul> </li> </ol>",
            "price": 15,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:30+00:00",
            "date_created": "2023-10-26T07:37:17+00:00"
      },
      {
            "id": 185,
            "name": "Smudge Spot Corydora (Corydoras similis) 2.5cm",
            "type": "physical",
            "sku": "85",
            "description": "<h3>Our Guide To Keeping Smudge Spot Cory</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras similis</li> <li><strong>Common name</strong>: Smudge Spot Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, Amazon River Basin</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Smudge Spot Corys prefer a spacious tank with plenty of swimming space. A minimum tank size of 20 litres is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Smudge Spot Corys thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Smudge Spot Corys are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Smudge Spot Corys are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Smudge Spot Corys are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:37:22+00:00"
      },
      {
            "id": 186,
            "name": "Three Line Corydora (Corydoras trilineatus) 2.8cm",
            "type": "physical",
            "sku": "87",
            "description": "<h3>Our Guide To Keeping Three Line Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras trilineatus</li> <li><strong>Common name</strong>: Three Line Cory, Leopard Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically in the Amazon River Basin</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Three Line Cory prefer a tank with a soft, sandy substrate to protect their delicate barbels.</li> <li>Provide hiding places with caves, driftwood, and plants like Java Moss or Amazon Sword.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Three Line Cory thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system is recommended to avoid strong currents that could stress these fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Three Line Cory are omnivores and will accept a variety of foods including sinking pellets, flakes, and live or frozen foods like bloodworms and brine shrimp.</li> <li>Ensure a balanced diet with occasional treats like blanched vegetables or small crustaceans.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Three Line Cory are peaceful bottom-dwelling fish and should be kept in groups of at least six individuals to prevent stress.</li> <li>They are compatible with other peaceful community fish such as tetras, rasboras, and small peaceful cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Three Line Cory are social fish and will display interesting behaviors when kept in groups.</li> <li>Avoid keeping them with aggressive or large fish that may intimidate or prey on them.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 2,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-31T14:06:56+00:00",
            "date_created": "2023-10-26T07:37:24+00:00"
      },
      {
            "id": 187,
            "name": "Spotted Corydora (Corydoras melanistius)",
            "type": "physical",
            "sku": "88",
            "description": "<h3>Our Guide To Keeping Spotted Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras melanistius</li> <li><strong>Common name</strong>: Spotted Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America (Amazon River Basin)</li> <li><strong>Adult length</strong>: 5-6 cm (2-2.5 inches)</li> <li><strong>Lifespan</strong>: 5-7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Spotted Corys prefer a tank with soft, sandy substrate and plenty of hiding spots such as caves, driftwood, and plants.</li> <li>Include live or artificial plants to provide cover and mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filtration system to ensure adequate water flow without causing stress to the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Spotted Corys are omnivores and will accept a variety of foods including sinking pellets, flakes, and live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> <li>Offer a balanced diet to ensure proper nutrition and health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Spotted Corys are peaceful and social fish that should be kept in groups of at least six individuals.</li> <li>They are compatible with other peaceful community fish such as tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Spotted Corys are bottom-dwelling fish that spend most of their time scavenging for food.</li> <li>They are compatible with a wide range of tank mates but avoid keeping them with aggressive or fin-nipping species that may harass them.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:37:27+00:00"
      },
      {
            "id": 188,
            "name": "Slate Corydora (Corydoras concolor)",
            "type": "physical",
            "sku": "89",
            "description": "<h3>Our Guide To Keeping Slate Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras concolor</li> <li><strong>Common name</strong>: Slate Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America (Amazon River Basin)</li> <li><strong>Adult length</strong>: 5-6 cm (2-2.5 inches)</li> <li><strong>Lifespan</strong>: 5-7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Slate Corys prefer a tank with soft, sandy substrate and plenty of hiding spots such as caves, driftwood, and plants.</li> <li>Include live or artificial plants to provide cover and mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filtration system to ensure adequate water flow without causing stress to the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Slate Corys are omnivores and will accept a variety of foods including sinking pellets, flakes, and live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> <li>Offer a balanced diet to ensure proper nutrition and health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Slate Corys are peaceful and social fish that should be kept in groups of at least six individuals.</li> <li>They are compatible with other peaceful community fish such as tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Slate Corys are bottom-dwelling fish that spend most of their time scavenging for food.</li> <li>They are compatible with a wide range of tank mates but avoid keeping them with aggressive or fin-nipping species that may harass them.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:37:30+00:00"
      },
      {
            "id": 189,
            "name": "Miguelito Corydora (Corydoras virginiae)",
            "type": "physical",
            "sku": "90",
            "description": "<h3>Our Guide To Keeping Miguelito Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras virginiae</li> <li><strong>Common name</strong>: Miguelito Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically the upper Rio Negro and Orinoco basins in Venezuela and Colombia</li> <li><strong>Adult length</strong>: 4.5 to 5 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Miguelito Cory prefer a tank with a sandy substrate and plenty of hiding places such as caves, driftwood, and plants.</li> <li>They appreciate a densely planted tank with areas of open space for swimming.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> <li>Maintain a pH level between 6.0 to 7.5.</li> <li>Provide gentle filtration and ensure good water quality.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Avoid strong water flow as Miguelito Cory prefer calm waters. Use a filter that provides gentle filtration.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality sinking pellets, flakes, and occasional live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> <li>They also appreciate vegetable matter such as blanched spinach or cucumber.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Miguelito Cory are peaceful and should be kept in a group of at least six individuals.</li> <li>They are compatible with other peaceful community fish such as tetras, rasboras, small barbs, and other similarly sized catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Miguelito Cory are peaceful bottom-dwellers that spend most of their time foraging for food.</li> <li>They are compatible with a wide range of community fish but avoid keeping them with aggressive or fin-nipping species.</li> </ul> </li> </ol>",
            "price": 7.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:37:35+00:00"
      },
      {
            "id": 190,
            "name": "Dwarf Neon Rainbowfish (Melanotaenia praecox)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Dwarf Neon Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia praecox</li> <li><strong>Common name</strong>: Dwarf Neon Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: New Guinea</li> <li><strong>Adult length</strong>: 5 - 6 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Dwarf Neon Rainbowfish thrive in a tank with plenty of swimming space and moderate water flow. A tank size of at least 75 litres is suitable for a small group.</li> <li>Provide a mix of open swimming areas and planted sections. They enjoy plants like Java Moss, Vallisneria, and Anubias.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Dwarf Neon Rainbowfish prefer slightly acidic to neutral water with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter that provides gentle to moderate water flow as Dwarf Neon Rainbowfish prefer moderate water movement.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Dwarf Neon Rainbowfish are omnivores and accept a variety of foods. Offer them high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Dwarf Neon Rainbowfish are peaceful community fish and should be kept in groups of at least six individuals. They coexist well with other peaceful species such as tetras, rasboras, and dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Dwarf Neon Rainbowfish are active and peaceful swimmers, displaying vibrant colors especially when kept in a group.</li> <li>They should not be housed with aggressive or fin-nipping fish that may stress them.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-21T23:54:16+00:00",
            "date_created": "2023-10-26T07:37:38+00:00"
      },
      {
            "id": 191,
            "name": "Checkered Rainbowfish (Melanotaenia splendida inornata)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Checkered Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia splendida inornata</li> <li><strong>Common name</strong>: Checkered Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Australia</li> <li><strong>Adult length</strong>: 6-10 cm</li> <li><strong>Lifespan</strong>: 5-6 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Checkered Rainbowfish prefer a spacious tank with plenty of swimming space. A minimum tank size of 75 litres is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Moss, Java Fern, and Vallisneria.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Checkered Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Checkered Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Checkered Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, tetras, rasboras, and peaceful catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Checkered Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:37:41+00:00"
      },
      {
            "id": 192,
            "name": "Madagascan Rainbowfish (Bedotia madagascariensis)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Madagascan Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Bedotia madagascariensis</li> <li><strong>Common name</strong>: Madagascan Rainbowfish</li> <li><strong>Family</strong>: Bedotiidae</li> <li><strong>Origin</strong>: Madagascar</li> <li><strong>Adult length</strong>: 7-9 cm</li> <li><strong>Lifespan</strong>: 3-5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Madagascan Rainbowfish prefer a spacious tank with plenty of swimming space. A minimum tank size of 75 litres (20 gallons) is recommended for a small group of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Madagascan Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Madagascan Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Madagascan Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Madagascan Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 3.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:37:46+00:00"
      },
      {
            "id": 193,
            "name": "Spotted Blue Eye Rainbowfish (Pseudomugil gertrudae) 1-2cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Spotted Blue Eye Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudomugil gertrudae</li> <li><strong>Common name</strong>: Spotted Blue Eye Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Northern Australia and New Guinea</li> <li><strong>Adult length</strong>: 3.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Spotted Blue Eye Rainbowfish prefer a heavily planted tank with plenty of hiding spots and open swimming areas.</li> <li>A tank size of at least 40 litres is suitable for a small group of these fish.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>They prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide gentle filtration and a moderate water flow to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Spotted Blue Eye Rainbowfish are omnivores and will accept a variety of foods including flakes, pellets, and live or frozen foods like daphnia and brine shrimp.</li> <li>Offer a varied diet to ensure their nutritional needs are met.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful fish and can be kept with other small, peaceful species such as small tetras, rasboras, and dwarf shrimp.</li> <li>Avoid keeping them with larger or aggressive fish that may intimidate or outcompete them for food.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Spotted Blue Eye Rainbowfish are social fish and should be kept in groups of at least six individuals to thrive.</li> <li>They display interesting behaviors and are active swimmers, especially in a well-planted tank.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 2,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-19T15:40:59+00:00",
            "date_created": "2023-10-26T07:37:53+00:00"
      },
      {
            "id": 194,
            "name": "Lake Kutubu Blue Rainbowfish (Melanotaenia lacustris)",
            "type": "physical",
            "sku": "95",
            "description": "<h3>Our Guide To Keeping Lake Kutubu Blue Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia lacustris</li> <li><strong>Common name</strong>: Lake Kutubu Blue Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Lake Kutubu in Papua New Guinea</li> <li><strong>Adult length</strong>: 5 to 6 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Lake Kutubu Blue Rainbowfish prefer a spacious tank with plenty of swimming space. A minimum tank size of 75 litres is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Lake Kutubu Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Lake Kutubu Blue Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Lake Kutubu Blue Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, peaceful tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Lake Kutubu Blue Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:37:59+00:00"
      },
      {
            "id": 195,
            "name": "Boeseman's Rainbowfish (Melanotaenia boesemani) 4-5.5cm",
            "type": "physical",
            "sku": "96",
            "description": "<h3>Our Guide To Keeping Boeseman's Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia boesemani</li> <li><strong>Common name</strong>: Boeseman's Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Vogelkop Peninsula, West Papua, Indonesia</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Boeseman's Rainbowfish thrive in a spacious tank with plenty of swimming space. A minimum tank size of 100L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Moss, Hornwort, and Vallisneria.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Boeseman's Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Boeseman's Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Boeseman's Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Boeseman's Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 14,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-26T20:50:52+00:00",
            "date_created": "2023-10-26T07:38:01+00:00"
      },
      {
            "id": 196,
            "name": "Celebes Rainbowfish (Marosatherina ladigesi)",
            "type": "physical",
            "sku": "97",
            "description": "<h3>Our Guide To Keeping Celebes Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Marosatherina ladigesi</li> <li><strong>Common name</strong>: Celebes Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Sulawesi, Indonesia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Celebes Rainbowfish prefer a tank with ample swimming space and areas for hiding. A minimum tank size of 50L is suitable for a small group.</li> <li>Provide a mix of open swimming space and planted areas with driftwood and rocks to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Celebes Rainbowfish thrive in slightly alkaline to neutral water conditions with a pH range of 7.0 to 8.0.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish. Use a filter that provides gentle to moderate flow and ensure good circulation in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Celebes Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Include live or frozen foods like bloodworms, brine shrimp, and daphnia to supplement their diet and enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Celebes Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to thrive.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, danios, tetras, and peaceful catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Celebes Rainbowfish are active and peaceful swimmers, displaying schooling behavior when kept in a group.</li> <li>They should not be housed with aggressive or fin-nipping species that may stress or harass them.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:04+00:00"
      },
      {
            "id": 197,
            "name": "Red Rainbowfish (Glossolepis incisus)",
            "type": "physical",
            "sku": "98",
            "description": "<h3>Our Guide To Keeping Red Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Glossolepis incisus</li> <li><strong>Common name</strong>: Red Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Papua New Guinea</li> <li><strong>Adult length</strong>: 10-12 cm</li> <li><strong>Lifespan</strong>: 5-8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Rainbowfish prefer a spacious tank with plenty of swimming space. A minimum tank size of 75 gallons is recommended for a small group of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 5.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:09+00:00"
      },
      {
            "id": 198,
            "name": "Threadfin Rainbowfish (Iriatherina werneri) 2.5cm",
            "type": "physical",
            "sku": "99",
            "description": "<h3>Our Guide To Keeping Threadfin Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Iriatherina werneri</li> <li><strong>Common name</strong>: Threadfin Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Northern Australia and New Guinea</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Threadfin Rainbowfish prefer a well-planted tank with open swimming areas. A minimum tank size of 60L is recommended for a small group of these fish.</li> <li>Provide plants like Java Moss, Java Fern, and floating plants like Water Sprite to create hiding spots and simulate their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Threadfin Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish, so choose a filter that provides gentle filtration and minimal disturbance.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Threadfin Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like daphnia, brine shrimp, and micro worms to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Threadfin Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other small rainbowfish species, tetras, and peaceful rasboras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Threadfin Rainbowfish are peaceful and active swimmers, often displaying interesting behaviors in a well-decorated tank.</li> <li>They may be intimidated by larger or more aggressive tank mates, so avoid housing them with fin-nipping or territorial fish.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 14,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-28T15:03:33+00:00",
            "date_created": "2023-10-26T07:38:12+00:00"
      },
      {
            "id": 199,
            "name": "Forktail Blue Eye Rainbowfish (Pseudomugil furcatus) 2cm",
            "type": "physical",
            "sku": "100",
            "description": "<h3>Our Guide To Keeping Forktail Blue Eye Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudomugil furcatus</li> <li><strong>Common name</strong>: Forktail Blue Eye Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Northern Australia, Papua New Guinea</li> <li><strong>Adult length</strong>: 3 to 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Forktail Blue Eye Rainbowfish prefer a well-planted tank with open swimming areas.</li> <li>Provide hiding spots among rocks, driftwood, and dense vegetation.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a temperature range of 23 to 28&deg;C (73 to 82&deg;F).</li> <li>Keep the pH level between 6.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter that provides gentle to moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality flakes, pellets, and small live or frozen foods like brine shrimp and bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Forktail Blue Eye Rainbowfish are peaceful and can be kept with other peaceful fish of similar size.</li> <li>They do best in a species tank or a community tank with small, peaceful species like tetras and rasboras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are schooling fish, so keep them in groups of at least six individuals.</li> <li>Compatible with other peaceful fish but avoid aggressive or fin-nipping species.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 36,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-04T01:55:48+00:00",
            "date_created": "2023-10-26T07:38:15+00:00"
      },
      {
            "id": 200,
            "name": "Lake Tebera Rainbowfish (Melanotaenia herbertaxelrodi)",
            "type": "physical",
            "sku": "101",
            "description": "<h3>Our Guide To Keeping Lake Tebera Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia herbertaxelrodi</li> <li><strong>Common name</strong>: Lake Tebera Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Papua New Guinea, Lake Tebera</li> <li><strong>Adult length</strong>: Up to 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Lake Tebera Rainbowfish prefer a tank with plenty of open swimming space and areas for hiding. A minimum tank size of 75 litres is recommended for a small group.</li> <li>Provide plants like Java Moss, Vallisneria, and floating plants to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Lake Tebera Rainbowfish are omnivores. Offer them a varied diet including high-quality flakes, pellets, and live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and do well in community tanks with other peaceful species such as other rainbowfish, tetras, and peaceful barbs.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Lake Tebera Rainbowfish are active and social fish that thrive in groups. They should be kept in a school of at least six individuals.</li> <li>They are generally compatible with other peaceful community fish.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:17+00:00"
      },
      {
            "id": 201,
            "name": "Dwarf Rainbowfish (Melanotaenia maccullochi)",
            "type": "physical",
            "sku": "102",
            "description": "<h3>Our Guide To Keeping Dwarf Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia maccullochi</li> <li><strong>Common name</strong>: Dwarf Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Australia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Dwarf Rainbowfish prefer a tank with a minimum size of 60L for a small school.</li> <li>Provide ample swimming space with open areas and planted sections to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH range of 6.5 to 7.5 and a temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable, so choose a filter accordingly.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Dwarf Rainbowfish are omnivores and thrive on a varied diet including high-quality flakes, pellets, and live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful fish and can be kept with other peaceful community species such as tetras, rasboras, and small peaceful catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Dwarf Rainbowfish are active swimmers and enjoy being kept in a group.</li> <li>They should not be housed with aggressive or fin-nipping fish.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:22+00:00"
      },
      {
            "id": 202,
            "name": "Parkinson's Rainbowfish (Melanotaenia parkinsoni)",
            "type": "physical",
            "sku": "103",
            "description": "<h3>Our Guide To Keeping Parkinson's Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia parkinsoni</li> <li><strong>Common name</strong>: Parkinson's Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Papua New Guinea</li> <li><strong>Adult length</strong>: 7 to 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Parkinson's Rainbowfish prefer a spacious tank with plenty of swimming space. A minimum tank size of 100L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Parkinson's Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Parkinson's Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Parkinson's Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Parkinson's Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:25+00:00"
      },
      {
            "id": 203,
            "name": "Western Rainbowfish (Melanotaenia australis)",
            "type": "physical",
            "sku": "104",
            "description": "<h3>Our Guide To Keeping Western Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia australis</li> <li><strong>Common name</strong>: Western Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Australia</li> <li><strong>Adult length</strong>: Up to 12 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Western Rainbowfish prefer a spacious tank with plenty of swimming space. A minimum tank size of 75 litres is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Western Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Western Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Western Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Western Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:28+00:00"
      },
      {
            "id": 204,
            "name": "Red Striped Rainbowfish (Melanotaenia rubrostriata)",
            "type": "physical",
            "sku": "105",
            "description": "<h3>Our Guide To Keeping Red Striped Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia rubrostriata</li> <li><strong>Common name</strong>: Red Striped Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Indonesia, Papua New Guinea</li> <li><strong>Adult length</strong>: 5 to 7 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Striped Rainbowfish prefer a spacious tank with plenty of swimming space. A minimum tank size of 75 litres is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Striped Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Striped Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Striped Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Striped Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 5.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:31+00:00"
      },
      {
            "id": 205,
            "name": "Red Neon Blue Eye Rainbowfish (Pseudomugil luminatus) 1-2cm",
            "type": "physical",
            "sku": "106",
            "description": "<h3>Our Guide To Keeping Red Neon Blue Eye Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudomugil luminatus</li> <li><strong>Common name</strong>: Red Neon Blue Eye Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: Australia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Neon Blue Eye Rainbowfish prefer a tank with plenty of swimming space and areas for hiding. A minimum tank size of 50L is recommended for a small group.</li> <li>Provide plants and decorations to create hiding spots and simulate their natural habitat. They appreciate a well-planted tank with driftwood and rocks.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Neon Blue Eye Rainbowfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Neon Blue Eye Rainbowfish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Neon Blue Eye Rainbowfish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rainbowfish, tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Neon Blue Eye Rainbowfish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-03T10:05:26+00:00",
            "date_created": "2023-10-26T07:38:36+00:00"
      },
      {
            "id": 206,
            "name": "Black Banded Rainbowfish (Melanotaenia nigrans)",
            "type": "physical",
            "sku": "107",
            "description": "<h3>Our Guide To Keeping Black Banded Rainbowfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Melanotaenia nigrans</li> <li><strong>Common name</strong>: Black Banded Rainbowfish</li> <li><strong>Family</strong>: Melanotaeniidae</li> <li><strong>Origin</strong>: New Guinea</li> <li><strong>Adult length</strong>: 8 - 10 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Banded Rainbowfish thrive in a well-decorated tank with open swimming areas. A minimum tank size of 75L is recommended for a small group.</li> <li>Provide rocks, driftwood, and live or artificial plants to create hiding spots and replicate their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for Black Banded Rainbowfish. Use a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Black Banded Rainbowfish are omnivores and accept a variety of foods. Feed them high-quality flake or pellet food as a staple and supplement with live or frozen foods like brine shrimp and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Black Banded Rainbowfish are generally peaceful and can be kept with other peaceful community fish. Avoid aggressive or fin-nipping species.</li> <li>They can coexist with other Rainbowfish, tetras, and similar-sized community fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Banded Rainbowfish are active swimmers and exhibit schooling behavior. Keep them in groups of at least six for the best results.</li> <li>They may be territorial during breeding, so provide sufficient hiding spots for females.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  42
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:39+00:00"
      },
      {
            "id": 207,
            "name": "Scarlet Badis (Dario dario) 1cm",
            "type": "physical",
            "sku": "108",
            "description": "<h3>Our Guide To Keeping Scarlet Badis Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Dario dario</li> <li><strong>Common name</strong>: Scarlet Badis</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: South Asia, specifically India and Bangladesh</li> <li><strong>Adult length</strong>: Approximately 2.5 to 3 centimeters (1 to 1.2 inches)</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Scarlet Badis fish thrive in densely planted tanks with plenty of hiding spots. Provide a soft substrate like sand or smooth gravel.</li> <li>They prefer dim lighting and areas with floating plants to simulate their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Scarlet Badis fish prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for these fish. Consider using a sponge filter or a filter with adjustable flow settings.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Scarlet Badis fish are carnivores and require a diet rich in protein. Offer them high-quality, small-sized pellets or flakes, as well as live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Scarlet Badis fish are relatively peaceful but can be territorial, especially during breeding. They are best kept in species-only tanks or with peaceful tank mates that occupy different areas of the tank.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Scarlet Badis fish are known for their striking appearance and interesting behaviors. They may exhibit aggression towards conspecifics, especially during breeding, so provide plenty of hiding spots to reduce aggression.</li> <li>Avoid keeping them with larger or aggressive fish species that may bully or outcompete them.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  60
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-07T20:08:25+00:00",
            "date_created": "2023-10-26T07:38:41+00:00"
      },
      {
            "id": 208,
            "name": "Asian Stone Catfish (Hara jerdoni)",
            "type": "physical",
            "sku": "109",
            "description": "<h3>Our Guide To Keeping Asian Stone Catfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hara jerdoni, Erethistes jerdoni</li> <li><strong>Common name</strong>: Asian Stone Catfish, Anchor Catfish</li> <li><strong>Family</strong>: Erethistidae</li> <li><strong>Origin</strong>: India</li> <li><strong>Adult length</strong>: 4-5 cm</li> <li><strong>Lifespan</strong>: 3-5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Asian Stone Catfish prefer a tank with hiding places like driftwood, rocks, and caves.</li> <li>They appreciate a well-planted tank with subdued lighting.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system with low water flow is suitable for Dwarf Anchor Catfish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Asian Stone Catfish are omnivores and accept a variety of foods including sinking pellets, algae wafers, and live or frozen foods like bloodworms and brine shrimp.</li> <li>Offer a balanced diet to ensure their nutritional needs are met.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Asian Stone Catfish are peaceful and can be kept with other small, peaceful fish such as tetras, rasboras, and small peaceful catfish species.</li> <li>They may be territorial with their own species, so it's best to keep them in small groups or pairs.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Asian Stone Catfish are nocturnal and may hide during the day.</li> <li>They are generally peaceful but may become territorial during breeding.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  29
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:31+00:00",
            "date_created": "2023-10-26T07:38:44+00:00"
      },
      {
            "id": 209,
            "name": "Pea Puffer (Carinotetraodon travancoricus)",
            "type": "physical",
            "sku": "110",
            "description": "<h3>Our Guide To Keeping Pea Puffer Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Carinotetraodon travancoricus</li> <li><strong>Common name</strong>: Pea Puffer, Dwarf Puffer Fish</li> <li><strong>Family</strong>: Tetraodontidae</li> <li><strong>Origin</strong>: Freshwater habitats in India (Western Ghats region)</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Pea Puffer Fish require a well-planted tank with plenty of hiding spots and smooth substrate as they like to sift through sand or fine gravel.</li> <li>A tank size of at least 10 gallons is suitable for a small group of Pea puffers.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water parameters stable with a temperature range of 24 to 28&deg;C (75 to 82&deg;F) and a pH range of 7.0 to 7.6.</li> <li>Provide a moderate level of water movement in the tank.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a sponge filter or a gentle filter to prevent the Pea puffer from getting stuck or injured.</li> <li>Ensure there are no strong currents in the tank to avoid stressing the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Pea Puffer Fish are carnivorous and should be fed a variety of small live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> <li>Offer snails or snail meat occasionally to help wear down their continuously growing teeth.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Pea Puffer Fish are best kept in a species-only tank or with other peaceful tank mates that won't outcompete them for food.</li> <li>Avoid keeping them with fin-nipping or aggressive fish as they may become stressed.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Pea Puffer Fish have individual personalities and can be territorial, especially males during breeding.</li> <li>They are not suitable for community tanks with larger or more aggressive fish.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  30
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-28T20:46:21+00:00",
            "date_created": "2023-10-26T07:38:50+00:00"
      },
      {
            "id": 210,
            "name": "Emerald Dwarf Rasbora (Danio erythromicron)",
            "type": "physical",
            "sku": "111",
            "description": "<h3>Our Guide To Keeping Emerald Dwarf Rasbora Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Celestichthys erythromicron</li> <li><strong>Common name</strong>: Emerald Dwarf Rasbora</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia, specifically Myanmar (formerly Burma)</li> <li><strong>Adult length</strong>: 1.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Emerald Dwarf Rasboras prefer a tank with plenty of swimming space. A minimum tank size of 20 litres is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Moss, Java Fern, and floating plants like Indian Fern.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Emerald Dwarf Rasboras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 27&deg;C (72 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Emerald Dwarf Rasboras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Emerald Dwarf Rasboras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rasboras, small peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Emerald Dwarf Rasboras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:32+00:00",
            "date_created": "2023-10-26T07:38:53+00:00"
      },
      {
            "id": 211,
            "name": "Assorted Male Endler Guppy (Poecilia wingei) 2cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Endler Guppy Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Poecilia wingei</li> <li><strong>Common name</strong>: Endler Guppy</li> <li><strong>Family</strong>: Poeciliidae</li> <li><strong>Origin</strong>: Venezuela</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Endler Guppies are small fish and can thrive in tanks as small as 20L, but larger tanks with more space are preferred.</li> <li>Include live plants and hiding spots to provide security and stimulate natural behaviors.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a slightly alkaline to neutral pH in the range of 7.0 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide gentle filtration as Endler Guppies prefer slower water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Endler Guppies are omnivores and thrive on a diet of high-quality flakes, pellets, and occasional live or frozen foods like daphnia and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and can be kept with other peaceful community fish of similar size.</li> <li>Compatible tank mates include small tetras, rasboras, and peaceful dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Endler Guppies are active and display schooling behavior, so it's recommended to keep them in groups for their well-being.</li> <li>Avoid aggressive tank mates that may stress or harass them.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 69,
            "is_visible": true,
            "categories": [
                  37
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-29T20:15:36+00:00",
            "date_created": "2023-10-26T07:38:55+00:00"
      },
      {
            "id": 212,
            "name": "Assorted Female Endler Guppy (Poecilia wingei) 2.5-3cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Endler Guppy Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Poecilia wingei</li> <li><strong>Common name</strong>: Endler Guppy</li> <li><strong>Family</strong>: Poeciliidae</li> <li><strong>Origin</strong>: Venezuela</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Endler Guppies are small fish and can thrive in tanks as small as 20L, but larger tanks with more space are preferred.</li> <li>Include live plants and hiding spots to provide security and stimulate natural behaviors.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a slightly alkaline to neutral pH in the range of 7.0 to 8.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide gentle filtration as Endler Guppies prefer slower water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Endler Guppies are omnivores and thrive on a diet of high-quality flakes, pellets, and occasional live or frozen foods like daphnia and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and can be kept with other peaceful community fish of similar size.</li> <li>Compatible tank mates include small tetras, rasboras, and peaceful dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Endler Guppies are active and display schooling behavior, so it's recommended to keep them in groups for their well-being.</li> <li>Avoid aggressive tank mates that may stress or harass them.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 36,
            "is_visible": true,
            "categories": [
                  37
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-04T18:23:41+00:00",
            "date_created": "2023-10-26T07:38:58+00:00"
      },
      {
            "id": 213,
            "name": "Pygmy Corydora (Corydoras pygmaeus) 1-2cm",
            "type": "physical",
            "sku": "75",
            "description": "<h3>Our Guide To Keeping Pygmy Cory Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Corydoras pygmaeus</li> <li><strong>Common name</strong>: Pygmy Cory</li> <li><strong>Family</strong>: Callichthyidae</li> <li><strong>Origin</strong>: South America, specifically found in the Amazon River Basin</li> <li><strong>Adult length</strong>: Approximately 2.5 cm (1 inch)</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Pygmy Corys thrive in well-planted aquariums with soft, sandy substrates. They prefer tanks with a minimum capacity of 10 gallons.</li> <li>Provide hiding spots like caves, driftwood, and plants to mimic their natural habitat and ensure they feel secure.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Pygmy Corys prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter that provides gentle water flow as Pygmy Corys prefer calm waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Pygmy Corys are omnivores and enjoy a varied diet. Offer them high-quality sinking pellets or flakes as a staple food.</li> <li>Supplement their diet with frozen or live foods like bloodworms, brine shrimp, and daphnia for optimal health and coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Pygmy Corys are peaceful and should be kept in groups of at least six individuals to thrive.</li> <li>They make excellent tank mates for small, peaceful fish like tetras, rasboras, and dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Pygmy Corys are social and peaceful fish that exhibit schooling behavior. Keeping them in a group enhances their well-being and reduces stress.</li> <li>Avoid keeping them with aggressive or larger fish that may intimidate or outcompete them for food.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 44,
            "is_visible": true,
            "categories": [
                  32
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-05T21:26:59+00:00",
            "date_created": "2023-10-26T07:39:04+00:00"
      },
      {
            "id": 214,
            "name": "Celestial Pearl Danio (Celestichthys margaritatus)",
            "type": "physical",
            "sku": "117",
            "description": "<h3>Our Guide To Keeping Celestial Pearl Danio Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: <strong>Celestichthys margaritatus</strong></li> <li><strong>Common name</strong>: Celestial Pearl Danio</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia, Myanmar, and Thailand</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Celestial Pearl Danios thrive in a well-planted aquarium with open swimming areas. A tank size of at least 40L is suitable for a small group of these fish.</li> <li>Provide hiding places with driftwood, rocks, and plants like Java Moss and Cryptocoryne species.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Celestial Pearl Danios prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish, so choose a filter with adjustable flow settings.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Celestial Pearl Danios are omnivores and accept high-quality flake or micro pellet food. Include live or frozen foods like daphnia, brine shrimp, and small insects to enhance their diet.</li> <li>Feed them small portions multiple times a day to mimic their natural feeding behavior.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Celestial Pearl Danios are peaceful and should be kept in groups of at least six individuals for their well-being.</li> <li>They coexist well with other small, peaceful fish such as other danios, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Celestial Pearl Danios are active swimmers and may display shoaling behavior. Keep them in a community tank with non-aggressive companions.</li> <li>Avoid housing them with larger or aggressive species that may stress or harm them.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 25,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-03T13:48:26+00:00",
            "date_created": "2023-10-26T07:39:07+00:00"
      },
      {
            "id": 215,
            "name": "Chili Rasbora (Boraras brigittae) 1-1.5cm",
            "type": "physical",
            "sku": "118",
            "description": "<h3>Our Guide To Keeping Chilli Rasbora Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Boraras brigittae</li> <li><strong>Common name</strong>: Chilli Rasbora</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia, specifically Borneo</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 3 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Chilli Rasboras prefer a heavily planted tank with subdued lighting.</li> <li>Provide fine-leaved plants like Java moss or other floating plants to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Chilli Rasboras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is preferred for Chilli Rasboras, so choose a filter that provides minimal to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Chilli Rasboras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like daphnia, bloodworms, and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Chilli Rasboras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress.</li> <li>They are compatible with other small, peaceful fish species such as other Boraras species, small rasboras, and small catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Chilli Rasboras are active and peaceful fish that display schooling behavior.</li> <li>They should not be kept with aggressive or large fish species that may intimidate or prey on them.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-03T19:03:07+00:00",
            "date_created": "2023-10-26T07:39:10+00:00"
      },
      {
            "id": 216,
            "name": "Ember Tetra (Hyphessobrycon amandae)",
            "type": "physical",
            "sku": "120",
            "description": "<h3>Our Guide To Keeping Ember Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon amandae</li> <li><strong>Common name</strong>: Ember Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Araguaia River basin in Brazil</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 1 to 2 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Ember Tetras thrive in a well-planted aquarium with subdued lighting. A tank size of 60L is suitable for a small group of these fish.</li> <li>Provide hiding spots and use fine-leaved plants like Java Moss and floating plants to create a natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Ember Tetras prefer soft to moderately hard water with a pH range of 5.5 to 7.0.</li> <li>Maintain the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filter to provide a mild water flow, mimicking their natural habitat in slow-moving streams and tributaries.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Ember Tetras are omnivores; offer them a varied diet including high-quality flakes, micro-pellets, and small live or frozen foods like daphnia and brine shrimp.</li> <li>Supplement their diet with vegetable matter and occasional treats like small insects.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Ember Tetras are peaceful and do well in a community aquarium. Keep them with other small, non-aggressive fish such as other tetras, rasboras, and dwarf corydoras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Ember Tetras are social and should be kept in a group of at least six individuals. They exhibit shoaling behavior and feel more secure in the presence of their own kind.</li> <li>Avoid housing them with larger or aggressive species that may intimidate or outcompete them for food.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 61,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-02T07:26:50+00:00",
            "date_created": "2023-10-26T07:39:12+00:00"
      },
      {
            "id": 217,
            "name": "Daisy's Blue Ricefish (Oryzias woworae)",
            "type": "physical",
            "sku": "121",
            "description": "<h3>Our Guide To Keeping Daisy's Blue Ricefish Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Oryzias woworae</li> <li><strong>Common name</strong>: Daisy's Blue Ricefish</li> <li><strong>Family</strong>: Adrianichthyidae</li> <li><strong>Origin</strong>: Indonesia</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Daisy's Blue Ricefish prefer a well-planted tank with plenty of open swimming space. A minimum tank size of 20L is suitable for a small group of these fish.</li> <li>Provide plenty of hiding spots among plants and decorations to mimic their natural habitat and make them feel secure.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Daisy's Blue Ricefish thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish, so choose a filter that provides gentle filtration.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Daisy's Blue Ricefish are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Daisy's Blue Ricefish are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other ricefish species, small tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Daisy's Blue Ricefish are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>They are generally peaceful and can be kept with other peaceful fish species that won't outcompete them for food or harass them.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  25
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:32+00:00",
            "date_created": "2023-10-26T07:39:17+00:00"
      },
      {
            "id": 218,
            "name": "Black Tiger Dario (Dario sp. 'Myanmar') 1-1.5cm",
            "type": "physical",
            "sku": "122",
            "description": "<h3>Our Guide To Keeping Black Tiger Dario Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Dario dario sp. 'Myanmar'</li> <li><strong>Common name</strong>: Black Tiger Dario</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: South Asia, specifically India and Bangladesh</li> <li><strong>Adult length</strong>: Approximately 2.5 to 3 centimeters (1 to 1.2 inches)</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Tiger Dario fish thrive in densely planted tanks with plenty of hiding spots. Provide a soft substrate like sand or smooth gravel.</li> <li>They prefer dim lighting and areas with floating plants to simulate their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Black Tiger Dario fish prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for these fish. Consider using a sponge filter or a filter with adjustable flow settings.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Black Tiger Dario fish are carnivores and require a diet rich in protein. Offer them high-quality, small-sized pellets or flakes, as well as live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Black Tiger Dario fish are relatively peaceful but can be territorial, especially during breeding. They are best kept in species-only tanks or with peaceful tank mates that occupy different areas of the tank.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Tiger Dario fish are known for their striking appearance and interesting behaviors. They may exhibit aggression towards conspecifics, especially during breeding, so provide plenty of hiding spots to reduce aggression.</li> <li>Avoid keeping them with larger or aggressive fish species that may bully or outcompete them.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  60
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:32+00:00",
            "date_created": "2023-10-26T07:39:20+00:00"
      },
      {
            "id": 219,
            "name": "Pearl Danio (Danio albolineatus)",
            "type": "physical",
            "sku": "123",
            "description": "<h3>Our Guide To Keeping Pearl Danio Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Danio albolineatus</li> <li><strong>Common name</strong>: Pearl Danio</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Pearl Danios are active swimmers and appreciate a tank with a minimum size of 75L. Provide open swimming areas and include some plants like Java Moss or Hornwort.</li> <li>These fish enjoy a well-lit aquarium, so consider adding a light source to enhance their colors and activity levels.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Pearl Danios prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain a water temperature between 20 to 26&deg;C (68 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide a gentle to moderate water flow with a suitable filter to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Pearl Danios are omnivores and accept a variety of foods. Offer them high-quality flake or pellet food as a staple, supplemented with live or frozen foods like brine shrimp and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Pearl Danios are peaceful community fish and should be kept in groups of at least six individuals to ensure their well-being and encourage natural behaviors.</li> <li>They are compatible with other peaceful fish species such as other danios, rasboras, and small tetras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Pearl Danios are known for their lively behavior and schooling instincts. Keep them in a group to promote their natural behaviors and reduce stress.</li> <li>Avoid housing them with aggressive or fin-nipping tank mates that may cause harm or stress.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:32+00:00",
            "date_created": "2023-10-26T07:39:23+00:00"
      },
      {
            "id": 220,
            "name": "Leopard Danio (Danio frankei) 3-3.5cm",
            "type": "physical",
            "sku": "124",
            "description": "<h3>Our Guide To Keeping Leopard Danio Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Danio frankei</li> <li><strong>Common name</strong>: Leopard Danio</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: South Asia, specifically India, Bangladesh, Nepal, and Myanmar</li> <li><strong>Adult length</strong>: Up to 4 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Leopard Danios are active swimmers and require a tank with ample swimming space. A tank size of at least 10 gallons is recommended for a small group.</li> <li>Provide hiding spots and areas with vegetation such as Java Moss and Hornwort to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Leopard Danios thrive in freshwater with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Leopard Danios prefer gentle water flow, so choose a filter that provides minimal disturbance.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Leopard Danios are omnivores and accept various foods including flakes, pellets, and live or frozen foods like bloodworms and brine shrimp.</li> <li>Offer a varied diet to ensure they receive essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Leopard Danios are peaceful community fish and can be kept with other peaceful species such as other danios, rasboras, and small catfish.</li> <li>Avoid housing them with fin-nipping or aggressive species that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Leopard Danios are social and should be kept in groups of at least six individuals to thrive.</li> <li>They exhibit schooling behavior and feel more secure in a group.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:32+00:00",
            "date_created": "2023-10-26T07:39:26+00:00"
      },
      {
            "id": 221,
            "name": "Giant Danio (Devario malabaricus)",
            "type": "physical",
            "sku": "125",
            "description": "<h3>Our Guide To Keeping Giant Danio Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Devario malabaricus</li> <li><strong>Common name</strong>: Giant Danio</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: South India</li> <li><strong>Adult length</strong>: Up to 7.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Giant Danios thrive in a well-planted tank with open swimming areas. A tank size of 80L or more is suitable for a small group of these fish.</li> <li>Include driftwood, rocks, and live or artificial plants to create hiding spots and mimic their natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide gentle to moderate water flow with a suitable filter to maintain good water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Giant Danios are omnivores and accept a variety of foods. Offer them high-quality flake or pellet food as a primary diet.</li> <li>Include live or frozen foods like brine shrimp, daphnia, and small insects to provide essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Giant Danios are peaceful schooling fish and should be kept in groups of at least six individuals for their well-being.</li> <li>They are compatible with other peaceful community fish like rasboras, tetras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Giant Danios are active swimmers and exhibit schooling behavior, so maintaining a group enhances their natural behavior and reduces stress.</li> <li>Avoid housing them with aggressive or territorial fish that may harass or intimidate them.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 16,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:32+00:00",
            "date_created": "2023-10-26T07:39:31+00:00"
      },
      {
            "id": 222,
            "name": "Cherry Barb (Puntius titteya) 3-3.5cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Cherry Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Puntius titteya</li> <li><strong>Common name</strong>: Cherry Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Sri Lanka</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 4 to 6 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Cherry Barbs thrive in a well-planted tank with open swimming areas. A minimum tank size of 75L is recommended for a small school of these fish.</li> <li>Include fine-leaved plants like Java Moss and provide floating plants to diffuse light and create shaded areas.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Cherry Barbs prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with a gentle to moderate flow, as Cherry Barbs don't appreciate strong currents in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Cherry Barbs are omnivores and accept a varied diet. Provide them with high-quality flakes or pellets as a staple, and supplement with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Cherry Barbs are peaceful community fish and should be kept in groups of at least six individuals for optimal social behavior.</li> <li>They are compatible with other peaceful community fish such as tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Cherry Barbs are active and social fish, displaying vibrant colors, especially during courtship. They may exhibit mild territorial behavior, so provide adequate hiding spots.</li> <li>Avoid keeping them with aggressive or fin-nipping fish that could stress or harm them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 17,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-19T23:49:43+00:00",
            "date_created": "2023-10-26T07:39:34+00:00"
      },
      {
            "id": 223,
            "name": "Green Tiger Barb (Puntigrus tetrazona)",
            "type": "physical",
            "sku": "128",
            "description": "<h3>Our Guide To Keeping Green Tiger Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Puntigrus tetrazona</li> <li><strong>Common name</strong>: Green Tiger Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 6 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Green Tiger Barbs thrive in well-decorated tanks with plenty of hiding places and open swimming areas. A minimum tank size of 75L is recommended for a small school.</li> <li>Provide plants like Java Moss, Java Fern, and artificial decorations to create hiding spots and territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Green Tiger Barbs prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 22 to 27&deg;C (72 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Green Tiger Barbs are omnivores and will accept a variety of foods. Offer them high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Green Tiger Barbs are known for their fin-nipping behavior, so they should be kept with fish of similar size and temperament. Good tank mates include other fast-swimming, robust fish such as danios, rasboras, and other barbs.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Green Tiger Barbs are active and social fish that display schooling behavior, so they should be kept in groups of at least six individuals to minimize aggression and stress.</li> <li>They may show aggression towards slow-moving or long-finned fish, so avoid keeping them with species like angelfish or bettas.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:32+00:00",
            "date_created": "2023-10-26T07:39:39+00:00"
      },
      {
            "id": 224,
            "name": "Tiger Barb (Puntigrus tetrazona)",
            "type": "physical",
            "sku": "129",
            "description": "<h3>Our Guide To Keeping Tiger Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Puntigrus tetrazona</li> <li><strong>Common name</strong>: Tiger Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 6 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Tiger Barbs thrive in well-decorated tanks with plenty of hiding places and open swimming areas. A minimum tank size of 75L is recommended for a small school.</li> <li>Provide plants like Java Moss, Java Fern, and artificial decorations to create hiding spots and territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Tiger Barbs prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 22 to 27&deg;C (72 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Tiger Barbs are omnivores and will accept a variety of foods. Offer them high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Tiger Barbs are known for their fin-nipping behavior, so they should be kept with fish of similar size and temperament. Good tank mates include other fast-swimming, robust fish such as danios, rasboras, and other barbs.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Tiger Barbs are active and social fish that display schooling behavior, so they should be kept in groups of at least six individuals to minimize aggression and stress.</li> <li>They may show aggression towards slow-moving or long-finned fish, so avoid keeping them with species like angelfish or bettas.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:32+00:00",
            "date_created": "2023-10-26T07:39:42+00:00"
      },
      {
            "id": 225,
            "name": "Rosy Barb (Pethia Conchonius)",
            "type": "physical",
            "sku": "130",
            "description": "<h3>Our Guide To Keeping Rosy Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pethia conchonius</li> <li><strong>Common name</strong>: Rosy Barb</li> <li><strong>Family</strong>: <em>Cyprinidae</em></li> <li><strong>Origin</strong>: South Asia, particularly India and Bangladesh</li> <li><strong>Adult length</strong>: Up to 7 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rosy Barbs prefer a well-decorated tank with ample swimming space. A tank size of at least 75 litres is recommended for a small group of these fish.</li> <li>Provide plenty of plants like Java Moss, Java Fern, and floating plants to mimic their natural habitat and offer hiding spots.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Rosy Barbs thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide moderate filtration and gentle water flow in the tank, as these fish prefer calm waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rosy Barbs are omnivorous and will readily accept high-quality flake or pellet food as a staple diet.</li> <li>Offer them a varied diet including live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and keep them healthy.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Rosy Barbs are peaceful community fish and can be kept with other small, peaceful species such as other barbs, tetras, danios, and rasboras.</li> <li>Ensure they are not housed with aggressive or fin-nipping fish that may stress or harm them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rosy Barbs are active swimmers and should be kept in groups of at least six individuals to feel secure and exhibit natural behaviors.</li> <li>They are known for their social nature and can display interesting interactions within a well-planted tank.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-16T15:18:59+00:00",
            "date_created": "2023-10-26T07:39:47+00:00"
      },
      {
            "id": 226,
            "name": "Golden Barb (Barbodes semifasciolatus)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Golden Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Barbodes semifasciolatus</li> <li><strong>Common name</strong>: Golden Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: Up to 35 cm</li> <li><strong>Lifespan</strong>: 8 to 14 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Golden Barbs require a spacious tank with plenty of swimming space. A minimum tank size of 300L is recommended for a small school of these fish.</li> <li>Provide hiding spots and open swimming areas. Decorate the tank with rocks, driftwood, and artificial or live plants.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Golden Barbs prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide a strong and efficient filtration system to maintain water quality, as Golden Barbs can be messy eaters.</li> <li>Ensure a moderate to strong water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Golden Barbs are omnivores. Offer them a varied diet including high-quality flakes, pellets, and occasional live or frozen foods like brine shrimp, bloodworms, and daphnia.</li> <li>Feed them multiple small meals throughout the day to mimic their natural feeding behavior.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Golden Barbs are generally peaceful but can be active swimmers. Keep them in a group of at least five individuals to reduce stress and encourage their natural behavior.</li> <li>They are compatible with other large, peaceful fish species such as similar-sized barbs, tetras, and some catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Golden Barbs are known for their active swimming behavior and may jump, so ensure the tank has a secure lid.</li> <li>Avoid keeping them with small or timid tank mates, as they may outcompete them for food.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:33+00:00",
            "date_created": "2023-10-26T07:39:50+00:00"
      },
      {
            "id": 227,
            "name": "Albino Tiger Barb (Puntigrus tetrazona)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Albino Tiger Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Puntigrus tetrazona</li> <li><strong>Common name</strong>: Albino Tiger Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 7.5 cm</li> <li><strong>Lifespan</strong>: 6 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Albino Tiger Barbs require a spacious tank with plenty of swimming space. A minimum tank size of 75L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Moss, Java Fern, and floating plants like Water Sprite.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Albino Tiger Barbs thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 27&deg;C (72 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Albino Tiger Barbs are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Albino Tiger Barbs are known to be semi-aggressive and may exhibit fin-nipping behavior, especially when kept in smaller groups. It's recommended to keep them in groups of at least 6 to disperse aggression.</li> <li>They are compatible with other robust, fast-swimming fish such as danios, rasboras, and larger tetra species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Albino Tiger Barbs are active and playful fish known for their energetic behavior and tendency to chase each other. They may not be suitable for very peaceful community tanks.</li> <li>Avoid keeping them with slow-moving or long-finned species that may become targets of their nipping behavior.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:33+00:00",
            "date_created": "2023-10-26T07:39:53+00:00"
      },
      {
            "id": 228,
            "name": "Melon Barb (Haludaria fasciata)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Melon Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Puntius fasciatus</li> <li><strong>Common name</strong>: Melon Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Sri Lanka</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Melon Barbs appreciate a tank with plenty of swimming space. A minimum tank size of 100L is recommended for a small group.</li> <li>Include areas with dense vegetation like Java moss and Vallisneria, along with open swimming areas.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Melon Barbs prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide a moderate water flow with a filter suitable for the tank size to ensure good water circulation and oxygenation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Melon Barbs are omnivores and should be fed a varied diet. Offer them high-quality flake or pellet food supplemented with live or frozen foods like bloodworms and brine shrimp.</li> <li>Include vegetable matter in their diet with occasional blanched vegetables like zucchini or spinach.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Melon Barbs are peaceful and should be kept in groups of at least 6 individuals. They are compatible with other peaceful community fish such as tetras, rasboras, and peaceful barbs.</li> <li>Avoid keeping them with aggressive or fin-nipping species that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Melon Barbs are active and social fish that display shoaling behavior. They thrive in the company of their own kind and other peaceful tankmates.</li> <li>They may exhibit more vibrant colors and natural behaviors when kept in a well-established, harmonious community tank.</li> </ul> </li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:33+00:00",
            "date_created": "2023-10-26T07:39:57+00:00"
      },
      {
            "id": 229,
            "name": "Black Ruby Barb (Pethia nigrofasciata) 3.5-4cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Black Ruby Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pethia nigrofasciata</li> <li><strong>Common name</strong>: Black Ruby Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Myanmar (Burma)</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Ruby Barbs thrive in a tank of at least 75 litres with ample swimming space and hiding spots. They prefer densely planted tanks with subdued lighting.</li> <li>Provide a substrate of fine gravel or sand and include driftwood and rocks to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water slightly acidic to neutral with a pH range of 6.0 to 7.0.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter with gentle to moderate water flow as Black Ruby Barbs prefer calm waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Black Ruby Barbs are omnivores and will accept a variety of foods. Offer them a balanced diet of high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Black Ruby Barbs are peaceful community fish and should be kept in groups of at least six individuals. They are compatible with other peaceful species such as tetras, rasboras, dwarf cichlids, and small catfish.</li> <li>Avoid keeping them with aggressive or fin-nipping species that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Ruby Barbs are active and peaceful fish that display schooling behavior, especially in larger groups. They coexist well with other community fish and are generally peaceful.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 26,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-05T21:26:59+00:00",
            "date_created": "2023-10-26T07:40:03+00:00"
      },
      {
            "id": 230,
            "name": "Odessa Barb (Pethia padamya) 3cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Odessa Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pethia padamya</li> <li><strong>Common name</strong>: Odessa Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Myanmar (Burma)</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Odessa Barbs thrive in planted tanks with plenty of open swimming space. A minimum tank size of 75 litres (20 gallons) is recommended.</li> <li>Provide ample hiding places among plants and driftwood to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Odessa Barbs prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 27&deg;C (72 to 80&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for Odessa Barbs, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Odessa Barbs are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Odessa Barbs are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other barbs, tetras, rasboras, danios, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Odessa Barbs are active and social fish that display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 8,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-26T18:45:37+00:00",
            "date_created": "2023-10-26T07:40:07+00:00"
      },
      {
            "id": 231,
            "name": "Silver Shark (Balantiocheilos melanopterus)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Silver Shark Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Balantiocheilos melanopterus</li> <li><strong>Common name</strong>: Silver Shark</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia, including Thailand, Malaysia, and Indonesia</li> <li><strong>Adult length</strong>: Up to 35 cm (14 inches)</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Silver Sharks require a large tank with a minimum capacity of 200 gallons to accommodate their size and swimming habits.</li> <li>Provide plenty of open swimming space along with hiding spots created by driftwood, rocks, or artificial caves.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a temperature range of 22 to 28&deg;C (72 to 82&deg;F).</li> <li>Keep the pH level between 6.5 to 7.5.</li> <li>Ensure good water quality with regular water changes and efficient filtration.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to maintain water clarity and quality, as Silver Sharks are sensitive to poor water conditions.</li> <li>Provide moderate water flow, ensuring it's not too strong to stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Silver Sharks are omnivores with a preference for meaty foods.</li> <li>Offer a varied diet including high-quality pellets, flakes, and occasional live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Silver Sharks are generally peaceful but can be skittish. They should be kept with fish of similar size and temperament.</li> <li>Compatible tank mates include other large, peaceful species such as barbs, danios, rasboras, and larger tetras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Silver Sharks are active swimmers and may jump if startled, so a tight-fitting lid is essential.</li> <li>They can be territorial with their own species, so it's best to keep them in small groups or as solitary individuals.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 7,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-30T08:39:13+00:00",
            "date_created": "2023-10-26T07:40:12+00:00"
      },
      {
            "id": 232,
            "name": "Siamese Algae Eater (Crossocheilus oblongus) 3cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Siamese Algae Eater Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Crossocheilus oblongus</li> <li><strong>Common name</strong>: Siamese Algae Eater</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: Up to 15 cm (6 inches)</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Siamese Algae Eaters appreciate a tank with plenty of swimming space and areas to explore.</li> <li>Provide hiding spots and plants to mimic their natural habitat, as well as open areas for swimming.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Siamese Algae Eaters thrive in water with a pH range of 6.5 to 7.5 and a temperature between 24 to 26&deg;C (75 to 79&deg;F).</li> <li>They prefer well-oxygenated water with moderate to high flow.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter that provides moderate to high flow to maintain good water quality and simulate their natural environment.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Siamese Algae Eaters are primarily herbivores and enjoy algae as a staple part of their diet.</li> <li>Offer them high-quality sinking algae wafers and fresh vegetables like zucchini and cucumber.</li> <li>They may also consume small invertebrates and prepared foods, but algae should form the majority of their diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Siamese Algae Eaters are peaceful community fish and can be kept with a variety of tank mates.</li> <li>They may be territorial towards their own kind, so it's best to keep them singly or in small groups with ample space.</li> <li>Compatible tank mates include other peaceful community fish like tetras, rasboras, danios, and peaceful cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Siamese Algae Eaters are active and social fish that enjoy swimming in groups.</li> <li>They are excellent algae eaters and can help control algae growth in the aquarium.</li> <li>Ensure adequate hiding spots and swimming space to reduce aggression, especially if keeping multiple Siamese Algae Eaters.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-31T21:06:00+00:00",
            "date_created": "2023-10-26T07:40:15+00:00"
      },
      {
            "id": 233,
            "name": "White Cloud Mountain Minnow (Tanichthys albonubes) 3cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping White Cloud Mountain Minnow Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Tanichthys albonubes</li> <li><strong>Common name</strong>: White Cloud Mountain Minnow</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: White Cloud Mountain, China</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>White Cloud Mountain Minnows prefer a well-planted tank with open swimming areas. A tank size of at least 20L is suitable for a small group.</li> <li>Provide a variety of plants like Java Moss, Java Fern, and floating plants to create hiding spots and mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>White Cloud Mountain Minnows thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 8.0.</li> <li>Maintain the water temperature between 18 to 24&deg;C (64 to 75&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>They can tolerate gentle to moderate water flow, so choose a filter that provides adequate filtration without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>White Cloud Mountain Minnows are omnivores and will accept a variety of foods. Offer them a diet consisting of high-quality flake or pellet food supplemented with live or frozen foods like bloodworms and brine shrimp.</li> <li>Feed them small portions multiple times a day to prevent overeating and maintain water quality.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>White Cloud Mountain Minnows are peaceful and can be kept with other small, peaceful fish species such as other minnows, small tetras, danios, and rasboras.</li> <li>Avoid keeping them with aggressive or larger species that may outcompete or harass them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are schooling fish and should be kept in groups of at least six individuals to feel secure and exhibit natural behaviors.</li> <li>They are active swimmers and appreciate plenty of swimming space in the aquarium.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 48,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T21:58:56+00:00",
            "date_created": "2023-10-26T07:40:20+00:00"
      },
      {
            "id": 234,
            "name": "Red-tailed Black Shark (Epalzeorhynchos bicolor)",
            "type": "physical",
            "sku": "140",
            "description": "<h3>Our Guide To Keeping Red-tailed Black Shark Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Epalzeorhynchos bicolor</li> <li><strong>Common name</strong>: Red-tailed Black Shark</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Thailand</li> <li><strong>Adult length</strong>: 15 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red-tailed Black Sharks need a tank with plenty of hiding spots and caves. A tank of at least 200L is recommended.</li> <li>Provide rocks, driftwood, and artificial caves to create hiding spots and territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red-tailed Black Sharks prefer slightly acidic to neutral water with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system is recommended to maintain water quality, but ensure the flow is not too strong to avoid stressing the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red-tailed Black Sharks are omnivores and need a balanced diet. Offer them high-quality pellets or flakes supplemented with vegetables like zucchini and cucumber.</li> <li>Occasionally provide live or frozen foods like bloodworms and brine shrimp to mimic their natural diet and enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red-tailed Black Sharks can be territorial, so choose tank mates carefully. Avoid keeping them with other bottom-dwelling species or those with similar body shapes and colors.</li> <li>Compatible tank mates include larger, fast-swimming fish that occupy different areas of the tank, such as larger tetras, barbs, and rainbowfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red-tailed Black Sharks can be territorial and may exhibit aggression towards similar-looking species or those that invade their space.</li> <li>Provide plenty of hiding spots and territories to reduce aggression, and monitor their behavior when introducing new tank mates.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 4,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-30T10:06:16+00:00",
            "date_created": "2023-10-26T07:40:23+00:00"
      },
      {
            "id": 235,
            "name": "Torpedo Denison Barb (Sahyadria denisonii) 5cm",
            "type": "physical",
            "sku": "141",
            "description": "<h3>Our Guide To Keeping Torpedo Denison Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Sahyadria denisonii</li> <li><strong>Common name</strong>: Torpedo Denison Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Western Ghats in India</li> <li><strong>Adult length</strong>: 15 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Torpedo Denison Barbs require a spacious tank with ample swimming space. A minimum tank size of 150L is recommended for a small group of these fish.</li> <li>Provide hiding spots and open swimming areas. They appreciate plants like Vallisneria, Java Moss, and driftwood for cover and exploration.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Torpedo Denison Barbs prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for Denison Barbs. Choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Torpedo Denison Barbs are omnivores and will accept a varied diet. Offer them high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Torpedo Denison Barbs are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other barbs, rasboras, peaceful cichlids, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Torpedo Denison Barbs are active swimmers and enjoy schooling. They exhibit vibrant colors and feel more secure when kept in a group.</li> <li>Avoid housing them with aggressive or fin-nipping species that may harass or intimidate them.</li> </ul> </li> </ol>",
            "price": 6.5,
            "sale_price": 0,
            "inventory_level": 4,
            "is_visible": true,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-28T15:39:46+00:00",
            "date_created": "2023-10-26T07:40:26+00:00"
      },
      {
            "id": 236,
            "name": "Harlequin Rasbora (Trigonostigma heteromorpha) 3cm",
            "type": "physical",
            "sku": "142",
            "description": "<h3>Our Guide To Keeping Harlequin Rasbora Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trigonostigma heteromorpha</li> <li><strong>Common name</strong>: Harlequin Rasbora</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia, specifically in Thailand, Malaysia, and Singapore</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Harlequin Rasboras prefer a well-planted tank with areas of open swimming space. A minimum tank size of 60 cm (24 inches) is recommended.</li> <li>They thrive in densely planted tanks with subdued lighting and a dark substrate to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Harlequin Rasboras prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>They prefer gentle water flow, so choose a filter that provides low to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Harlequin Rasboras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Harlequin Rasboras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rasboras, tetras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Harlequin Rasboras are peaceful and active fish that do well in community tanks.</li> <li>They may exhibit some fin-nipping behavior towards slow-moving fish with long fins, so avoid keeping them with such species.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 84,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-04T22:38:30+00:00",
            "date_created": "2023-10-26T07:40:29+00:00"
      },
      {
            "id": 237,
            "name": "Rainbow Shark (Epalzeorhynchos frenatum)",
            "type": "physical",
            "sku": "143",
            "description": "<h3>Our Guide To Keeping Rainbow Shark Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Epalzeorhynchos frenatum</li> <li><strong>Common name</strong>: Rainbow Shark</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Thailand</li> <li><strong>Adult length</strong>: 15 cm</li> <li><strong>Lifespan</strong>: 6 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rainbow Sharks require a tank of at least 150L with plenty of hiding spots and territories.</li> <li>Provide caves, rocks, and driftwood for shelter, and consider adding hardy plants like Java Fern or Anubias.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly alkaline water with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 30&deg;C (75 to 86&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a strong filtration system to maintain water quality, and ensure good water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rainbow Sharks are omnivores and will accept a variety of foods including high-quality pellets, flakes, and occasional treats like bloodworms or brine shrimp.</li> <li>Ensure a balanced diet and avoid overfeeding.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be territorial, especially as they mature. Choose tank mates carefully, avoiding similarly shaped or aggressive fish.</li> <li>Compatible tank mates include larger, robust community fish that can hold their own against the Rainbow Shark's territorial behavior.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rainbow Sharks are territorial and may exhibit aggression towards similar or bottom-dwelling species.</li> <li>Provide hiding places and territories to reduce aggression, and consider keeping them singly or in larger tanks with plenty of hiding spots.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:33+00:00",
            "date_created": "2023-10-26T07:40:34+00:00"
      },
      {
            "id": 238,
            "name": "Snakeskin Barb (Desmopuntius rhomboocellatus)",
            "type": "physical",
            "sku": "144",
            "description": "<h3>Our Guide To Keeping Snakeskin Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Desmopuntius rhomboocellatus</li> <li><strong>Common name</strong>: Snakeskin Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 5-7 cm</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Snakeskin Barbs prefer a well-decorated tank with ample swimming space. A tank size of at least 75 litres is recommended for a small group.</li> <li>Provide hiding spots with driftwood, rocks, and dense vegetation to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Snakeskin Barbs thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Snakeskin Barbs are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Snakeskin Barbs are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other barbs, tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Snakeskin Barbs are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:33+00:00",
            "date_created": "2023-10-26T07:40:37+00:00"
      },
      {
            "id": 239,
            "name": "Scissortail Rasbora (Rasbora trilineata)",
            "type": "physical",
            "sku": "145",
            "description": "<h3>Our Guide To Keeping Scissortail Rasbora Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Rasbora trilineata</li> <li><strong>Common name</strong>: Scissortail Rasbora</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 12 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Scissortail Rasboras prefer a spacious tank with plenty of swimming space. A minimum tank size of 75 litres is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Scissortail Rasboras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Scissortail Rasboras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Scissortail Rasboras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Scissortail Rasboras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 1,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-03T13:05:18+00:00",
            "date_created": "2023-10-26T07:40:39+00:00"
      },
      {
            "id": 240,
            "name": "Zebra Danio (Danio rerio)",
            "type": "physical",
            "sku": "146",
            "description": "<h3>Our Guide To Keeping Zebra Danio Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Danio rerio</li> <li><strong>Common name</strong>: Zebra Danio</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: South Asia, specifically India, Bangladesh, Nepal, and Myanmar</li> <li><strong>Adult length</strong>: Up to 4 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Zebra Danios are active swimmers and require a tank with ample swimming space. A tank size of at least 10 gallons is recommended for a small group.</li> <li>Provide hiding spots and areas with vegetation such as Java Moss and Hornwort to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Zebra Danios thrive in freshwater with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Zebra Danios prefer gentle water flow, so choose a filter that provides minimal disturbance.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Zebra Danios are omnivores and accept various foods including flakes, pellets, and live or frozen foods like bloodworms and brine shrimp.</li> <li>Offer a varied diet to ensure they receive essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Zebra Danios are peaceful community fish and can be kept with other peaceful species such as other danios, rasboras, and small catfish.</li> <li>Avoid housing them with fin-nipping or aggressive species that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Zebra Danios are social and should be kept in groups of at least six individuals to thrive.</li> <li>They exhibit schooling behavior and feel more secure in a group.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-09T12:42:14+00:00",
            "date_created": "2023-10-26T07:40:42+00:00"
      },
      {
            "id": 241,
            "name": "Filament Barb (Dawkinsia filamentosa)",
            "type": "physical",
            "sku": "147",
            "description": "<h3>Our Guide To Keeping Filament Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Dawkinsia filamentosa</li> <li><strong>Common name</strong>: Filament Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: South India</li> <li><strong>Adult length</strong>: Up to 10 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Filament Barbs require a well-planted aquarium with open swimming areas.</li> <li>They prefer a tank size of at least 75 litres for a small school.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH range of 6.5 to 7.5.</li> <li>Water temperature should be kept between 22 to 28ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (72 to 82ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable; ensure the filter provides adequate circulation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Feed Filament Barbs a varied diet including flakes, pellets, and occasional live or frozen foods like bloodworms or brine shrimp.</li> <li>Supplement their diet with vegetables like blanched spinach or zucchini.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Filament Barbs are peaceful and should be kept in groups of 6 or more.</li> <li>They coexist well with other peaceful fish such as tetras, rasboras, and dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They exhibit schooling behavior and are active swimmers.</li> <li>Avoid housing them with fin-nipping or aggressive species.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:33+00:00",
            "date_created": "2023-10-26T07:40:50+00:00"
      },
      {
            "id": 242,
            "name": "Gold Zebra Danio (Danio rerio)",
            "type": "physical",
            "sku": "148",
            "description": "<h3>Our Guide To Keeping Gold Zebra Danio Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Danio rerio</li> <li><strong>Common name</strong>: Gold Zebra Danio</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: South Asia, specifically India, Bangladesh, Nepal, and Myanmar</li> <li><strong>Adult length</strong>: Up to 4 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Gold Zebra Danios are active swimmers and require a tank with ample swimming space. A tank size of at least 10 gallons is recommended for a small group.</li> <li>Provide hiding spots and areas with vegetation such as Java Moss and Hornwort to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Gold Zebra Danios thrive in freshwater with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Gold Zebra Danios prefer gentle water flow, so choose a filter that provides minimal disturbance.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Gold Zebra Danios are omnivores and accept various foods including flakes, pellets, and live or frozen foods like bloodworms and brine shrimp.</li> <li>Offer a varied diet to ensure they receive essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Gold Zebra Danios are peaceful community fish and can be kept with other peaceful species such as other danios, rasboras, and small catfish.</li> <li>Avoid housing them with fin-nipping or aggressive species that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Gold Zebra Danios are social and should be kept in groups of at least six individuals to thrive.</li> <li>They exhibit schooling behavior and feel more secure in a group.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:33+00:00",
            "date_created": "2023-10-26T07:40:53+00:00"
      },
      {
            "id": 243,
            "name": "Gold Cloud Minnow (Tanichthys albonubes)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Gold Cloud Minnow Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Tanichthys albonubes</li> <li><strong>Common name</strong>: Gold Cloud Minnow</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: White Cloud Mountain, China</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Gold Cloud Minnows prefer a well-planted tank with open swimming areas. A tank size of at least 20L is suitable for a small group.</li> <li>Provide a variety of plants like Java Moss, Java Fern, and floating plants to create hiding spots and mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Gold Cloud Minnows thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 8.0.</li> <li>Maintain the water temperature between 18 to 24&deg;C (64 to 75&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>They can tolerate gentle to moderate water flow, so choose a filter that provides adequate filtration without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Gold Cloud Minnows are omnivores and will accept a variety of foods. Offer them a diet consisting of high-quality flake or pellet food supplemented with live or frozen foods like bloodworms and brine shrimp.</li> <li>Feed them small portions multiple times a day to prevent overeating and maintain water quality.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Gold Cloud Minnows are peaceful and can be kept with other small, peaceful fish species such as other minnows, small tetras, danios, and rasboras.</li> <li>Avoid keeping them with aggressive or larger species that may outcompete or harass them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are schooling fish and should be kept in groups of at least six individuals to feel secure and exhibit natural behaviors.</li> <li>They are active swimmers and appreciate plenty of swimming space in the aquarium.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 51,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T22:05:58+00:00",
            "date_created": "2023-10-26T07:40:56+00:00"
      },
      {
            "id": 244,
            "name": "Neon Green Rasbora (Microdevario kubotai)",
            "type": "physical",
            "sku": "119",
            "description": "<h3>Our Guide To Keeping Neon Green Rasbora Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Microdevario kubotai</li> <li><strong>Common name</strong>: Neon Green Rasbora</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia (Thailand, Malaysia)</li> <li><strong>Adult length</strong>: 2 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Neon Green Rasboras thrive in a densely planted aquarium with open swimming areas. A tank size of 20L or more is suitable for a small school of these fish.</li> <li>Provide floating plants and gentle water movement to mimic their natural habitat. Use soft substrate and dim lighting to create a comfortable environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide a gentle water flow using a sponge filter or a filter with adjustable flow settings.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Neon Green Rasboras are micro predators and accept small-sized food. Offer them high-quality micro pellets, small flakes, and live or frozen foods like daphnia and brine shrimp.</li> <li>Feed them small, frequent meals to accommodate their small size and fast metabolism.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Neon Green Rasboras are peaceful schooling fish and should be kept in groups of at least six individuals.</li> <li>They are compatible with other small, non-aggressive community fish such as small tetras, dwarf rasboras, and peaceful shrimp species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Neon Green Rasboras are active and exhibit schooling behavior. They feel more secure in a group and display their vibrant colors.</li> <li>Avoid keeping them with aggressive or fin-nipping fish that may stress or harm them.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T22:05:58+00:00",
            "date_created": "2023-10-26T07:40:59+00:00"
      },
      {
            "id": 245,
            "name": "Redline Rasbora (Trigonopoma pauciperforatum)",
            "type": "physical",
            "sku": "151",
            "description": "<h3>Our Guide To Keeping Redline Rasbora Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trigonopoma pauciperforatum</li> <li><strong>Common name</strong>: Redline Rasbora</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Redline Rasboras prefer a well-planted tank with plenty of hiding spots and open swimming areas.</li> <li>A tank size of at least 20 litres is suitable for a small group of these fish.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Redline Rasboras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish, so choose a filter that provides gentle filtration.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Redline Rasboras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Redline Rasboras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other rasboras, tetras, dwarf gouramis, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Redline Rasboras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:04+00:00"
      },
      {
            "id": 246,
            "name": "Panda Garra (Garra flavatra)",
            "type": "physical",
            "sku": "152",
            "description": "<h3>Our Guide To Keeping Panda Garra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Garra flavatra</li> <li><strong>Common name</strong>: Panda Garra</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: Up to 7 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Panda Garra prefers a well-planted tank with hiding spots and smooth substrate. Provide rocks and driftwood for them to explore.</li> <li>Keep the tank temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Ensure good water quality and perform regular water changes.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Panda Garra appreciates moderate water flow. Use a filter that provides gentle to moderate circulation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Panda Garra is an omnivorous species. Offer a balanced diet of high-quality pellets or flakes supplemented with live or frozen foods like bloodworms and brine shrimp.</li> <li>Include vegetable-based foods to meet their dietary needs.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Panda Garra is peaceful and can be kept with other non-aggressive fish species that share similar water parameters.</li> <li>They are suitable for community tanks with small, peaceful companions.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Panda Garra is a social fish and should be kept in groups. They exhibit interesting behavior and are generally compatible with other peaceful tankmates.</li> <li>Avoid aggressive or fin-nipping tankmates to ensure a harmonious community.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 13,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T19:53:18+00:00",
            "date_created": "2023-10-26T07:41:07+00:00"
      },
      {
            "id": 247,
            "name": "Clown Barb (Barbodes everetti)",
            "type": "physical",
            "sku": "153",
            "description": "<h3>Our Guide To Keeping Clown Barb Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Puntius everetti, Barbus everetti</li> <li><strong>Common name</strong>: Clown Barb</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Southeast Asia, specifically Borneo and Sumatra</li> <li><strong>Adult length</strong>: Up to 7 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Clown Barbs thrive in well-planted aquariums with plenty of swimming space. A tank size of at least 75 litres is recommended for a small group.</li> <li>They prefer areas with moderate water flow and some hiding spots among plants or decorations.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Clown Barbs prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 28ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (72 to 82ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable. Choose a filter that provides good circulation without causing strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Clown Barbs are omnivores and will accept a variety of foods. Offer them a balanced diet of high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> <li>Include vegetable matter in their diet, such as blanched spinach or cucumber slices.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Clown Barbs are peaceful schooling fish and should be kept in groups of at least 6 individuals to thrive.</li> <li>They are compatible with other peaceful community fish like tetras, rasboras, danios, and small peaceful catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Clown Barbs are active swimmers and display schooling behavior. They may occasionally chase each other but are generally peaceful towards other tank mates.</li> <li>Keep them away from aggressive or fin-nipping fish that could stress them.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  41
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:10+00:00"
      },
      {
            "id": 248,
            "name": "Glowlight Danio (Danio choprae)",
            "type": "physical",
            "sku": "154",
            "description": "<h3>Our Guide To Keeping Danio Choprae Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Danio choprae</li> <li><strong>Common name</strong>: Glowlight Danio</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Myanmar</li> <li><strong>Adult length</strong>: 3 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Glowlight Danios thrive in a well-planted aquarium with open swimming areas. A tank size of 40L or more is suitable for a small group.</li> <li>Include plants like Java Moss, Java Fern, and floating plants to provide cover and replicate their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0 for optimal health.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with a gentle to moderate flow, ensuring good water quality without causing excessive currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Glowlight Danios are omnivores and accept a varied diet. Provide high-quality flake or micro-pellet food as their main diet.</li> <li>Include live or frozen foods like brine shrimp, daphnia, and small insects to enhance their diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Glowlight Danios are peaceful and should be kept in groups of at least six individuals. They coexist well with other small, non-aggressive community fish.</li> <li>Compatible tank mates include other peaceful danios, rasboras, small tetras, and dwarf shrimp.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>These danios are active swimmers and exhibit schooling behavior, so maintain a group for their well-being and to observe their natural behaviors.</li> <li>Avoid pairing them with aggressive or fin-nipping species to prevent stress and injuries.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:13+00:00"
      },
      {
            "id": 249,
            "name": "Orange Finned Dani (Danio kyathit)",
            "type": "physical",
            "sku": "155",
            "description": "<h3>Our Guide To Keeping Orange Finned Danio Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Danio kyathit</li> <li><strong>Common name</strong>: Orange Finned Danio</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Myanmar</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Orange Finned Danios prefer a tank with plenty of open swimming space and some planted areas. A minimum tank size of 60L is recommended for a small group of these fish.</li> <li>Use fine substrate and provide plants like Java Moss, Anubias, and floating plants for hiding and mimicking their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Orange Finned Danios thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for these fish, so choose a filter that provides such flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Orange Finned Danios are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, daphnia, and micro worms to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Orange Finned Danios are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as small tetras, rasboras, and other danios.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Orange Finned Danios are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or larger predatory fish that may intimidate or harm them.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:18+00:00"
      },
      {
            "id": 250,
            "name": "Albino Rainbow Shark (Epalzeorhynchos frenatum)",
            "type": "physical",
            "sku": "156",
            "description": "<h3>Our Guide To Keeping Albino Rainbow Shark Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Epalzeorhynchos frenatum</li> <li><strong>Common name</strong>: Albino Rainbow Shark</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Selectively bred variant of the Rainbow Shark, originating from Thailand</li> <li><strong>Adult length</strong>: 15 cm</li> <li><strong>Lifespan</strong>: 6 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Albino Rainbow Sharks require a tank of at least 150L with plenty of hiding spots and territories.</li> <li>Provide caves, rocks, and driftwood for shelter, and consider adding hardy plants like Java Fern or Anubias.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly alkaline water with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 30&deg;C (75 to 86&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a strong filtration system to maintain water quality, and ensure good water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Albino Rainbow Sharks are omnivores and will accept a variety of foods including high-quality pellets, flakes, and occasional treats like bloodworms or brine shrimp.</li> <li>Ensure a balanced diet and avoid overfeeding.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be territorial, especially as they mature. Choose tank mates carefully, avoiding similarly shaped or aggressive fish.</li> <li>Compatible tank mates include larger, robust community fish that can hold their own against the Albino Rainbow Shark's territorial behavior.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Albino Rainbow Sharks are territorial and may exhibit aggression towards similar or bottom-dwelling species.</li> <li>Provide hiding places and territories to reduce aggression, and consider keeping them singly or in larger tanks with plenty of hiding spots.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:21+00:00"
      },
      {
            "id": 251,
            "name": "Sunset Dwarf Cichlid (Apistogramma atahualpa)",
            "type": "physical",
            "sku": "157",
            "description": "<h3>Our Guide To Keeping Sunset Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apistogramma atahualpa</li> <li><strong>Common name</strong>: Sunset Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America, Amazon Basin</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Sunset Dwarf Cichlids prefer a tank with plenty of hiding spots and areas for exploration. Include driftwood, rocks, and plants like Java Moss and Amazon Sword for shelter and territory marking.</li> <li>Provide soft, acidic water conditions similar to their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Maintain a pH level between 6.0 to 7.0.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filtration system to maintain water quality without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality flake or pellet food supplemented with live or frozen foods like brine shrimp, bloodworms, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Sunset Dwarf Cichlids are territorial but can be kept with peaceful tank mates such as small tetras, rasboras, and catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They display interesting territorial behavior and may become aggressive during breeding. Provide ample hiding spots to reduce aggression.</li> <li>Keep them away from aggressive or fin-nipping tank mates.</li> </ul> </li> </ol>",
            "price": 20,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:24+00:00"
      },
      {
            "id": 252,
            "name": "Double Red Cockatoo Dwarf Cichlid (Apistogramma cacatuoides)",
            "type": "physical",
            "sku": "158",
            "description": "<h3>Our Guide To Keeping Double Red Cockatoo Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apistogramma cacatuoides</li> <li><strong>Common name</strong>: Double Red Cockatoo Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America, specifically the Amazon River basin in Brazil, Colombia, and Peru</li> <li><strong>Adult length</strong>: Varies, typically between 5 to 8 centimeters</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Double Red Cockatoo Dwarf Cichlids prefer a well-planted aquarium with plenty of hiding spots such as caves, driftwood, and plants like Java Fern and Amazon Sword.</li> <li>Provide soft, slightly acidic water with a pH ranging from 6.0 to 7.0 and a temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water parameters stable with low to moderate lighting.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filtration system that provides gentle to moderate water flow, ensuring good circulation without causing excessive disturbance.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Double Red Cockatoo Dwarf Cichlids are omnivores and will accept a variety of foods including high-quality flakes, pellets, and frozen or live foods like bloodworms, brine shrimp, and daphnia.</li> <li>Offer a varied diet to ensure nutritional balance and supplement their diet with occasional treats like small insects and insect larvae.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be territorial, especially during breeding, so it's best to keep them with peaceful tank mates such as tetras, rasboras, and other small, non-aggressive fish.</li> <li>Avoid keeping them with larger or more aggressive fish that may intimidate or harass them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Double Red Cockatoo Dwarf Cichlids are generally peaceful but can exhibit territorial behavior, especially when breeding.</li> <li>They do well in a community setup with other small, peaceful fish species.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T18:07:46+00:00",
            "date_created": "2023-10-26T07:41:27+00:00"
      },
      {
            "id": 253,
            "name": "Panduro Dwarf Cichlid (Apistogramma panduro)",
            "type": "physical",
            "sku": "159",
            "description": "<h3>Our Guide To Keeping Panduro Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apistogramma panduro</li> <li><strong>Common name</strong>: Panduro Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America (Amazon River Basin)</li> <li><strong>Adult length</strong>: Up to 6 cm (2.4 inches)</li> <li><strong>Lifespan</strong>: 2 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Panduro Dwarf Cichlids prefer a tank with plenty of hiding places such as caves, rocks, and driftwood.</li> <li>They appreciate densely planted areas and floating plants to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Apistogramma panduro thrives in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for Panduro Dwarf Cichlids, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Apistogramma panduro are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Panduro Dwarf Cichlids are peaceful but can be territorial during breeding. They are best kept with other small, peaceful fish species such as tetras, rasboras, and small catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Apistogramma panduro are relatively peaceful but can be territorial during breeding. They should be kept in pairs or small groups in a well-decorated tank with plenty of hiding spots.</li> <li>They may display colorful breeding behaviors, and it's essential to provide them with suitable breeding caves or sites.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 5,
            "is_visible": false,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:32+00:00"
      },
      {
            "id": 254,
            "name": "Agassizs Dwarf Cichlid (Apistogramma agassizi)",
            "type": "physical",
            "sku": "160",
            "description": "<h3>Our Guide To Keeping Agassiz&rsquo;s Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apistogramma agassizii</li> <li><strong>Common name</strong>: Agassiz&rsquo;s Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America, specifically in the Amazon River Basin</li> <li><strong>Adult length</strong>: 5 - 8 cm</li> <li><strong>Lifespan</strong>: 3 - 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Agassiz&rsquo;s Dwarf Cichlids prefer a well-planted aquarium with plenty of hiding spots and caves.</li> <li>Maintain a tank size of at least 20 gallons for a pair or small group.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>They prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Provide soft to moderately hard water with a dH range of 5 - 15.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Ensure good water circulation and filtration to maintain water quality.</li> <li>Provide gentle to moderate water flow as Agassiz&rsquo;s Dwarf Cichlids prefer calm waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality flakes, pellets, and small live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> <li>Supplement their diet with vegetable matter and occasional treats like mosquito larvae.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Choose tank mates that are peaceful and not too large or aggressive.</li> <li>Good tank mates include small peaceful fish like tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Agassiz&rsquo;s Dwarf Cichlids are territorial during breeding but otherwise peaceful. Provide plenty of hiding spots to reduce aggression.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:35+00:00"
      },
      {
            "id": 255,
            "name": "Agassizs Double Red Dwarf Cichlid (Apistogramma agassizii)",
            "type": "physical",
            "sku": "161",
            "description": "<h3>Our Guide To Keeping Agassiz's Double Red Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apistogramma agassizii</li> <li><strong>Common name</strong>: Agassiz's Double Red Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Amazon Basin in South America</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Agassiz's Double Red Dwarf Cichlids prefer a tank with plenty of hiding places and areas with dense vegetation to mimic their natural habitat. A minimum tank size of 75L is recommended for a pair of these fish.</li> <li>Provide driftwood, rocks, and caves for hiding spots, and use plants like Java Moss, Amazon Sword, and Vallisneria for cover.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Agassiz's Double Red Dwarf Cichlids thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Agassiz's Double Red Dwarf Cichlids are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Agassiz's Double Red Dwarf Cichlids are peaceful cichlids but can be territorial, especially during breeding. They are best kept in a species-only tank or with other small, peaceful fish species.</li> <li>Compatible tank mates include small tetras, rasboras, dwarf corydoras, and peaceful bottom-dwelling species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Agassiz's Double Red Dwarf Cichlids are territorial during breeding and may exhibit aggressive behavior towards other fish, especially intruding males.</li> <li>Provide plenty of hiding spots and visual barriers to reduce aggression, and consider keeping only one male with multiple females in the same tank.</li> </ul> </li> </ol>",
            "price": 7.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:37+00:00"
      },
      {
            "id": 256,
            "name": "Banded Dwarf Cichlid Pair (Apistogramma bitaeniata)",
            "type": "physical",
            "sku": "162",
            "description": "<h3>Our Guide To Keeping Banded Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apistogramma bitaeniata</li> <li><strong>Common name</strong>: Banded Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America (Amazon River Basin)</li> <li><strong>Adult length</strong>: 5 to 6 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Banded Dwarf Cichlids prefer a tank with plenty of hiding places such as caves, driftwood, and plants like Java Moss and Amazon Sword.</li> <li>Provide a substrate of fine sand to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F) with a slightly acidic to neutral pH ranging from 6.0 to 7.0.</li> <li>They prefer soft to moderately hard water with a dH range of 2 to 15.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable, so choose a filter that provides adequate circulation without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Banded Dwarf Cichlids are omnivores and accept a variety of foods including high-quality flake or pellet food, frozen or live foods like bloodworms, brine shrimp, and small insects.</li> <li>Offer a varied diet to ensure nutritional balance and supplement with vegetable matter like blanched spinach or zucchini.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful dwarf cichlids but can be territorial, especially during breeding. Suitable tank mates include other small, peaceful fish species such as tetras, rasboras, and small catfish.</li> <li>Avoid keeping them with aggressive or large species that may intimidate or harass them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Banded Dwarf Cichlids exhibit interesting behaviors and may form pairs or small groups.</li> <li>They can be shy and will appreciate a well-decorated tank with plenty of hiding spots.</li> </ul> </li> </ol>",
            "price": 12,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:40+00:00"
      },
      {
            "id": 257,
            "name": "Umbrella Borelli Dwarf Cichlid (Apistogramma Borellii) 3-4cm",
            "type": "physical",
            "sku": "163",
            "description": "<h3>Our Guide To Keeping Opal Umbrella Borelli Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apistogramma borellii \"Opal\"</li> <li><strong>Common name</strong>: Opal Umbrella Borelli's Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America (Paraguay, Brazil, Argentina)</li> <li><strong>Adult length</strong>: 5 - 7.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Opal Umbrella Borelli's Dwarf Cichlids thrive in a tank with plenty of hiding spots and territories. A well-decorated tank with caves, driftwood, and plants is ideal.</li> <li>They prefer a slightly acidic to neutral pH level between 6.0 to 7.0.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> <li>Provide clean and well-aerated water with a moderate to low flow.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with gentle to moderate water flow to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Opal Umbrella Borelli's Dwarf Cichlids are omnivores; offer a balanced diet of high-quality pellets, flakes, and supplement with live or frozen foods like brine shrimp and small insects.</li> <li>Variety is key to their diet, ensuring they receive essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be territorial, so keep them with peaceful tank mates such as other small cichlids, tetras, or rasboras.</li> <li>Avoid aggressive or larger fish that may intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Opal Umbrella Borelli's Dwarf Cichlids may exhibit breeding behavior in pairs, so provide suitable breeding conditions if intending to breed them.</li> <li>They can be somewhat shy, so a well-planted tank provides security and encourages natural behavior.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-08T17:43:57+00:00",
            "date_created": "2023-10-26T07:41:46+00:00"
      },
      {
            "id": 258,
            "name": "Redfin Three-Striped Dwarf Cichlid Pair (Apistogramma trifasciata)",
            "type": "physical",
            "sku": "164",
            "description": "<h3>Our Guide To Keeping Redfin Three-Striped Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apistogramma trifasciata</li> <li><strong>Common name</strong>: Redfin Three-Striped Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Redfin Three-Striped Dwarf Cichlids prefer a tank with plenty of hiding places such as caves, rocks, and driftwood.</li> <li>They also appreciate a substrate of fine sand and some floating plants to provide cover.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter that provides gentle to moderate flow to maintain water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet consisting of high-quality flake or pellet food, supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Redfin Three-Striped Dwarf Cichlids are peaceful but territorial fish, so choose tank mates carefully.</li> <li>They can be kept with other peaceful community fish of similar size and temperament, such as tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are territorial during breeding but otherwise peaceful, so provide plenty of hiding places to reduce aggression.</li> <li>Avoid keeping them with larger or aggressive fish that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 20,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:41:49+00:00"
      },
      {
            "id": 259,
            "name": "Red Phantom Tetra (Hyphessobrycon sweglesi)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Red Phantom Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon sweglesi</li> <li><strong>Common name</strong>: Red Phantom Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically Brazil and Paraguay</li> <li><strong>Adult length</strong>: 3.5 cm to 4.5 cm (1.4 in to 1.8 in)</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Phantom Tetras prefer a well-planted tank with plenty of hiding spots and subdued lighting to mimic their natural habitat.</li> <li>A tank size of at least 20 gallons is suitable for a small school of these fish.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 23&deg;C to 27&deg;C (73&deg;F to 81&deg;F).</li> <li>Maintain a slightly acidic to neutral pH level ranging from 6.0 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Red Phantom Tetras prefer moderate water flow, so choose a filter that provides gentle to moderate circulation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet consisting of high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>T </strong></p> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-19T19:59:41+00:00",
            "date_created": "2023-10-26T07:41:52+00:00"
      },
      {
            "id": 260,
            "name": "Black Phantom Tetra (Hyphessobrycon megalopterus)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Black Phantom Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon megalopterus</li> <li><strong>Common name</strong>: Black Phantom Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, Paran&aacute; River Basin</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Phantom Tetras thrive in a well-planted tank with open swimming areas. A tank size of at least 75L is suitable for a small group of these fish.</li> <li>Provide hiding spots with plants and decorations, and maintain a dimly lit environment to simulate their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water slightly acidic to neutral with a pH range of 6.0 to 7.0.</li> <li>Maintain the water temperature between 24 to 27&deg;C (75 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filtration system to provide a calm water flow, as Black Phantom Tetras prefer slow to moderate currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>These tetras are omnivores, so offer them a balanced diet of high-quality flake or pellet food supplemented with live or frozen options like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Black Phantom Tetras are peaceful community fish and should be kept in groups of at least six individuals.</li> <li>They coexist well with other small, peaceful species such as other tetras, rasboras, and non-aggressive dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>These tetras exhibit schooling behavior, so keeping them in a group enhances their well-being and natural behaviors.</li> <li>Avoid housing them with aggressive or fin-nipping species to prevent stress and potential harm.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 24,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-02T17:00:30+00:00",
            "date_created": "2023-10-26T07:41:55+00:00"
      },
      {
            "id": 261,
            "name": "Rummy Nose Tetra (Hemigrammus rhodostomus) 2.8cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Rummy Nose Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hemigrammus rhodostomus</li> <li><strong>Common name</strong>: Rummy Nose Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Amazon River Basin in South America</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rummy Nose Tetras thrive in a well-planted tank with open swimming areas. A minimum tank size of 80L is suitable for a small group of these fish.</li> <li>Provide hiding spots and utilize plants like Java Moss, Amazon Sword, and floating plants to create a natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0 for optimal health.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter that provides gentle to moderate water flow, as Rummy Nose Tetras prefer a moderate current in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rummy Nose Tetras are omnivores and accept a variety of foods. Include high-quality flakes or pellets as a staple and supplement with live or frozen foods like brine shrimp and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Keep Rummy Nose Tetras in a group of at least six individuals to promote schooling behavior and reduce stress.</li> <li>They are compatible with other peaceful community fish, such as tetras, rasboras, dwarf cichlids, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rummy Nose Tetras are active swimmers known for their distinctive red nose markings. They coexist well with other non-aggressive fish species and should be kept away from fin-nipping tank mates.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 42,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-26T18:45:37+00:00",
            "date_created": "2023-10-26T07:42:00+00:00"
      },
      {
            "id": 262,
            "name": "Silvertip Tetra (Hasemania nana)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Silvertip Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hasemania melanura</li> <li><strong>Common name</strong>: Silvertip Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically in the Amazon River basin</li> <li><strong>Adult length</strong>: Approximately 4 centimeters (1.6 inches)</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Silvertip Tetras prefer a well-planted aquarium with open swimming spaces.</li> <li>Provide floating plants and areas with dense vegetation to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water slightly acidic to neutral with a pH range of 6.0 to 7.5.</li> <li>Temperature should be maintained between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for Silvertip Tetras.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>They are omnivores and accept a variety of foods including flakes, pellets, and live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Silvertip Tetras are peaceful schooling fish and should be kept in groups of at least six individuals.</li> <li>They are compatible with other small, peaceful fish such as other tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Silvertip Tetras are active swimmers and display schooling behavior.</li> <li>They should not be kept with aggressive or fin-nipping fish species.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 27,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-25T23:54:30+00:00",
            "date_created": "2023-10-26T07:42:03+00:00"
      },
      {
            "id": 263,
            "name": "Green Neon Tetra (Paracheirodon simulans) 1.6cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Green Neon Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Paracheirodon simulans</li> <li><strong>Common name</strong>: Green Neon Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Amazon River Basin in South America</li> <li><strong>Adult length</strong>: 3 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Green Neon Tetras prefer a well-planted tank with subdued lighting. A minimum tank size of 30 cm is recommended for a small school of these fish.</li> <li>Provide floating plants like Amazon Frogbit or Water Sprite to diffuse the lighting and create shaded areas.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Green Neon Tetras thrive in soft, acidic water conditions with a pH range of 5.0 to 7.0.</li> <li>Keep the water temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish, so choose a filter that provides gentle filtration without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Green Neon Tetras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, bloodworms, and micro worms to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Green Neon Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, small rasboras, dwarf corydoras, and small peaceful catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Green Neon Tetras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or large fish species that may intimidate or prey on them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:34+00:00",
            "date_created": "2023-10-26T07:42:06+00:00"
      },
      {
            "id": 264,
            "name": "Black Neon Tetra (Hyphessobrycon herbertaxelrodi) 3-3.5cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Black Neon Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon herbertaxelrodi</li> <li><strong>Common name</strong>: Black Neon Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically Brazil and Peru</li> <li><strong>Adult length</strong>: 3 cm (1.2 inches)</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Neon Tetras prefer a well-planted tank with dim lighting to mimic their natural habitat.</li> <li>Provide hiding spots with plants and driftwood.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> <li>They prefer soft to slightly hard water with a pH range of 5.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system is suitable for Black Neon Tetras.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>They are omnivores and will accept a variety of foods including flakes, pellets, and live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Black Neon Tetras are peaceful and should be kept in groups of at least six individuals.</li> <li>They are compatible with other peaceful community fish like other tetras, rasboras, and small peaceful catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are peaceful schooling fish and should not be housed with aggressive tank mates.</li> <li>They display vibrant colors and active swimming behavior when kept in a group.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 26,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-16T12:33:44+00:00",
            "date_created": "2023-10-26T07:42:11+00:00"
      },
      {
            "id": 265,
            "name": "Lemon Tetra (Hyphessobrycon pulchripinnis)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Lemon Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon pulchripinnis</li> <li><strong>Common name</strong>: Lemon Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically in the Amazon River Basin</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Lemon Tetras prefer a well-planted tank with open swimming areas. A tank size of at least 60 cm (24 inches) is recommended for a small school.</li> <li>Include plants like Java moss, Java fern, and floating plants to provide cover and replicate their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Lemon Tetras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system with a low to moderate water flow is suitable for Lemon Tetras.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Lemon Tetras are omnivores and will accept a variety of foods. Offer them a balanced diet of high-quality flake or pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Lemon Tetras are peaceful community fish and should be kept in groups of at least six individuals.</li> <li>They are compatible with other peaceful fish such as other tetras, rasboras, dwarf cichlids, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Lemon Tetras are active and social fish that thrive in groups. They display schooling behavior and feel more secure in the presence of conspecifics.</li> <li>They should not be housed with aggressive or fin-nipping species that may stress or injure them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 24,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:42:19+00:00"
      },
      {
            "id": 266,
            "name": "Flame Tetra (Hyphessobrycon flammeus) 2.5cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Flame Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon flammeus</li> <li><strong>Common name</strong>: Flame Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically in the Paraguay basin</li> <li><strong>Adult length</strong>: 2.5 cm (1 inch)</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Flame Tetras are best kept in a tank with a capacity of at least 60 litres (15 gallons).</li> <li>Provide plenty of hiding spots and areas with dense vegetation, as well as open spaces for swimming.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> <li>Maintain a slightly acidic to neutral pH level, ideally between 6.0 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter that provides gentle to moderate water flow, as Flame Tetras prefer calmer waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality flake or pellet food, as well as live or frozen foods like bloodworms and brine shrimp.</li> <li>Feed small amounts multiple times a day to mimic their natural feeding habits.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Flame Tetras are peaceful and thrive in groups of 6 or more individuals.</li> <li>They can coexist with other peaceful fish species such as other tetras, rasboras, and small catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Flame Tetras are peaceful and active fish that enjoy swimming in schools.</li> <li>Avoid keeping them with aggressive or fin-nipping tank mates.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 30,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:42:24+00:00"
      },
      {
            "id": 267,
            "name": "Black Widow Tetra (Gymnocorymbus ternetzi)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Black Widow Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Gymnocorymbus ternetzi</li> <li><strong>Common name</strong>: Black Widow Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Paraguay Basin in South America</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Widow Tetras are active swimmers and prefer a tank with plenty of horizontal swimming space. A minimum tank size of 75L is recommended for a small school of these fish.</li> <li>Provide ample hiding places with driftwood, rocks, or artificial decorations. They appreciate densely planted areas with floating plants to diffuse light.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Black Widow Tetras are adaptable to a wide range of water conditions. They prefer slightly acidic to neutral water with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>They can tolerate a moderate water flow, so choose a filter that provides gentle to moderate flow without causing too much disturbance.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Black Widow Tetras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and variety.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Black Widow Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage natural behavior.</li> <li>They are compatible with other peaceful community fish such as other tetras, danios, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Widow Tetras are social and display schooling behavior, so they should be kept in groups to thrive.</li> <li>They may exhibit fin-nipping behavior towards long-finned tank mates, so avoid keeping them with fish like bettas or angelfish.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:42:27+00:00"
      },
      {
            "id": 268,
            "name": "Buenos Aires Tetra (Hyphessobrycon anisitsi)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Buenos Aires Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon anisitsi</li> <li><strong>Common name</strong>: Buenos Aires Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically Argentina, Paraguay, and Brazil</li> <li><strong>Adult length</strong>: Up to 7 cm (2.75 inches)</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Buenos Aires Tetras are hardy and adaptable, suitable for a variety of tank setups.</li> <li>They appreciate a densely planted tank with open swimming spaces.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 20 to 26&deg;C (68 to 79&deg;F).</li> <li>They can tolerate a wide pH range from acidic to slightly alkaline, ideally between 6.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide efficient filtration to maintain water quality, and moderate water flow is suitable.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Buenos Aires Tetras are omnivores and will accept a variety of foods including flakes, pellets, and live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are generally peaceful but can be fin nippers, so avoid housing them with long-finned or slow-moving tank mates.</li> <li>Compatible tank mates include other robust community fish like danios, barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Buenos Aires Tetras are active and may display schooling behavior.</li> <li>They can be territorial during breeding, so provide ample hiding places for other tank mates.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:42:30+00:00"
      },
      {
            "id": 269,
            "name": "X-Ray Tetra (Pristella maxillaris)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping X-Ray Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pristella maxillaris</li> <li><strong>Common name</strong>: X-Ray Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically in the Amazon and Orinoco River basins</li> <li><strong>Adult length</strong>: Up to 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>X-Ray Tetras prefer a heavily planted tank with subdued lighting to mimic their natural habitat. Provide plenty of hiding places among plants and driftwood.</li> <li>A tank size of at least 60 cm (24 inches) in length is suitable for a small group of X-Ray Tetras.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is preferred, so choose a filter that provides adequate filtration without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>X-Ray Tetras are omnivores and will accept a variety of foods including high-quality flake or pellet food as a staple.</li> <li>Offer them live or frozen foods like bloodworms, brine shrimp, and daphnia to supplement their diet and enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>X-Ray Tetras are peaceful schooling fish and should be kept in groups of at least six individuals.</li> <li>They are compatible with other small, peaceful community fish such as other tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>X-Ray Tetras are active and peaceful fish that display schooling behavior. They feel more secure and exhibit their best colors when kept in a group.</li> <li>Ensure tank mates are peaceful and not aggressive to prevent stress or harassment.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 30,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-27T11:35:32+00:00",
            "date_created": "2023-10-26T07:42:36+00:00"
      },
      {
            "id": 270,
            "name": "Red Eye Tetra (Moenkhausia sanctaefilomenae)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Red Eye Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Moenkhausia sanctaefilomenae</li> <li><strong>Common name</strong>: Red Eye Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Paraguay, Paran&aacute; River basin in South America</li> <li><strong>Adult length</strong>: 4.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Eye Tetras appreciate a planted aquarium with open swimming areas. A minimum tank size of 60 cm (24 inches) is suitable for a small group of these fish.</li> <li>Include live plants like Java Moss, Amazon Sword, and Vallisneria to provide cover and mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Eye Tetras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for these fish. Use a filter that provides adequate filtration without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Eye Tetras are omnivores and accept a wide range of foods. Offer them a varied diet including high-quality flakes, pellets, and occasional live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Eye Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to promote natural behavior and reduce stress.</li> <li>They are compatible with other peaceful community fish such as tetras, rasboras, dwarf cichlids, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Eye Tetras are active and peaceful fish that exhibit schooling behavior. They feel more secure and display vibrant colors when kept in a group.</li> <li>Avoid keeping them with aggressive or large fish that may intimidate or harm them.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:42:39+00:00"
      },
      {
            "id": 271,
            "name": "Congo Tetra (Phenacogrammus interruptus) 3cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Congo Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Phenacogrammus interruptus</li> <li><strong>Common name</strong>: Congo Tetra</li> <li><strong>Family</strong>: Alestidae</li> <li><strong>Origin</strong>: Congo River Basin in Africa</li> <li><strong>Adult length</strong>: 8 cm</li> <li><strong>Lifespan</strong>: 7 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Congo Tetras prefer a spacious tank with plenty of swimming space. A minimum tank size of 200L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Congo Tetras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Congo Tetras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Congo Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Congo Tetras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-04T22:38:30+00:00",
            "date_created": "2023-10-26T07:42:45+00:00"
      },
      {
            "id": 272,
            "name": "Neon Tetra (Paracheirodon innesi) 2.2cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Neon Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Paracheirodon innesi</li> <li><strong>Common name</strong>: Neon Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Amazon basin in South America</li> <li><strong>Adult length</strong>: 3 cm</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Neon Tetras thrive in a well-planted aquarium with subdued lighting. A minimum tank size of 10 gallons is suitable for a small school.</li> <li>Provide hiding places with driftwood, rocks, and plants like Java Moss and Hornwort to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Neon Tetras prefer soft to slightly hard water with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 20 to 26&deg;C (68 to 78&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable, so choose a filter that provides gentle filtration without causing strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Neon Tetras are omnivores and should be fed a varied diet including high-quality flake or micro pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia for optimal health and coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Neon Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to feel secure and display their natural behaviors.</li> <li>They are compatible with other small, peaceful fish such as other tetras, rasboras, dwarf gouramis, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Neon Tetras are active swimmers and exhibit schooling behavior, which enhances their colors and reduces stress.</li> <li>They should not be housed with aggressive or fin-nipping tank mates that may harass them.</li> </ul> </li> </ol>",
            "price": 1,
            "sale_price": 0,
            "inventory_level": 132,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-03T13:48:26+00:00",
            "date_created": "2023-10-26T07:42:50+00:00"
      },
      {
            "id": 273,
            "name": "Glowlight Tetra (Hemigrammus erythrozonus)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Glowlight Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hemigrammus erythrozonus</li> <li><strong>Common name</strong>: Glowlight Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Guyana and Suriname in South America</li> <li><strong>Adult length</strong>: 2.5 to 3 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Glowlight Tetras do well in a well-planted tank with open swimming areas. A minimum tank size of 60L is suitable for a small school of these fish.</li> <li>Provide hiding spots with plants like Java Moss, and use dim lighting to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Glowlight Tetras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable, so choose a filter that provides minimal to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Glowlight Tetras are omnivores and will accept a variety of foods. Offer them high-quality flake or pellet food as a staple and supplement with live or frozen foods like brine shrimp and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Glowlight Tetras are peaceful schooling fish and should be kept in groups of at least six individuals. They are compatible with other small, peaceful community fish like rasboras and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Glowlight Tetras exhibit schooling behavior and feel more secure in a group. Avoid housing them with aggressive or fin-nipping fish to prevent stress.</li> </ul> </li> </ol>",
            "price": 1.5,
            "sale_price": 0,
            "inventory_level": 20,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-31T14:56:46+00:00",
            "date_created": "2023-10-26T07:42:56+00:00"
      },
      {
            "id": 274,
            "name": "Serpae Tetra (Hyphessobrycon eques)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Serpae Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon eques</li> <li><strong>Common name</strong>: Serpae Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, in the Paraguay and Guapor&eacute; River basins</li> <li><strong>Adult length</strong>: 4.5 to 5.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Serpae Tetras appreciate a well-decorated tank with hiding spots and swimming spaces. A tank size of at least 75L is suitable for a small group of these fish.</li> <li>Provide plants like Java Moss, Java Fern, and floating plants to create a natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Serpae Tetras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 23 to 28&deg;C (73 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with gentle to moderate flow, as Serpae Tetras prefer moderate water movement.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Serpae Tetras are omnivores and accept a varied diet. Offer them high-quality flakes or pellets as a staple, supplemented with live or frozen foods like brine shrimp and bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Serpae Tetras are known for their semi-aggressive nature. Keep them in a group of at least six individuals to distribute aggression.</li> <li>Choose tank mates carefully; avoid keeping them with long-finned or slow-moving fish to prevent fin-nipping.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Serpae Tetras exhibit schooling behavior, and a group provides a sense of security. They may show aggression within their species, so monitor their behavior closely.</li> <li>Avoid keeping them with very docile or slow-swimming fish to prevent stress and conflicts.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 30,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:42:59+00:00"
      },
      {
            "id": 275,
            "name": "Super Blue Emperor Tetra (Inpaichthys Kerri) 2.5-3cm",
            "type": "physical",
            "sku": "188",
            "description": "<h3>Our Guide To Keeping Super Blue Emperor Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: <strong>Inpaichthys kerri</strong></li> <li><strong>Common name</strong>: Super Blue Emperor Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, Rio Guapore, Brazil</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Super Blue Emperor Tetras prefer a spacious tank with plenty of swimming space. A minimum tank size of 50L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Moss, Amazon Sword, and floating plants like Dwarf Water Lettuce.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Super Blue Emperor Tetras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish, so choose a filter that provides gentle flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Super Blue Emperor Tetras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like brine shrimp, daphnia, and small insects to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Super Blue Emperor Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, small rasboras, and peaceful dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Super Blue Emperor Tetras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 30,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:43:04+00:00"
      },
      {
            "id": 276,
            "name": "Penguin Tetra (Thayeria boehlkei) 3-4cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Penguin Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Thayeria boehlkei</li> <li><strong>Common name</strong>: Penguin Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Amazon River Basin in South America</li> <li><strong>Adult length</strong>: 3.5 to 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Penguin Tetras thrive in a well-planted aquarium with ample swimming space. A tank size of 60L or more is recommended for a small group.</li> <li>Provide hiding places and floating plants to mimic their natural habitat. They appreciate plants like Hornwort, Water Sprite, and Java Moss.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Penguin Tetras prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for these fish, so choose a filter that provides adjustable flow settings.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Penguin Tetras are omnivores and accept a variety of foods. Offer them high-quality flake or micro-pellet food supplemented with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Penguin Tetras are peaceful community fish and should be kept in groups of at least six individuals.</li> <li>They are compatible with other peaceful species like tetras, rasboras, dwarf cichlids, and small catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Penguin Tetras are social and active swimmers, displaying shoaling behavior when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish that may stress or harm them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-26T18:45:37+00:00",
            "date_created": "2023-10-26T07:43:07+00:00"
      },
      {
            "id": 277,
            "name": "Cardinal Tetra (Paracheirodon axelrodi) 2.5cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Cardinal Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Paracheirodon axelrodi</li> <li><strong>Common name</strong>: Cardinal Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Amazon basin in South America</li> <li><strong>Adult length</strong>: 3 cm</li> <li><strong>Lifespan</strong>: 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Cardinal Tetras prefer a heavily planted tank with dim lighting to mimic their natural habitat. A minimum tank size of 20L is recommended for a small school of these fish.</li> <li>Provide hiding spots among plants and driftwood, as well as open swimming areas.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Cardinal Tetras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 21 to 27&deg;C (70 to 80&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Cardinal Tetras prefer gentle water flow, so a sponge filter or a filter with adjustable flow is recommended.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Cardinal Tetras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or micro pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, daphnia, and brine shrimp for optimal health and coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Cardinal Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to thrive and exhibit natural behavior.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, small peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Cardinal Tetras are shoaling fish and feel more secure when kept in a group. They display vibrant colors and are active swimmers.</li> <li>Avoid keeping them with aggressive or fin-nipping tank mates that may stress or harm them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 149,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T22:05:58+00:00",
            "date_created": "2023-10-26T07:43:13+00:00"
      },
      {
            "id": 278,
            "name": "Barred Shovelnose Catfish (Pseudoplatystoma fasciatum)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Barred Shovelnose Catfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pseudoplatystoma fasciatum</li> <li><strong>Common name</strong>: Barred Shovelnose Catfish</li> <li><strong>Family</strong>: Pimelodidae</li> <li><strong>Origin</strong>: South America, specifically the Amazon and Orinoco River basins</li> <li><strong>Adult length</strong>: Up to 100 cm (39 inches)</li> <li><strong>Lifespan</strong>: Up to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Barred Shovelnose Catfish require a large tank with a minimum size of 500 litres (132 gallons) due to their large size.</li> <li>Provide plenty of hiding spots and caves as they are nocturnal and prefer to hide during the day.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>They prefer slightly acidic to neutral water with a pH range of 6.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Efficient filtration is essential due to their messy eating habits and large size.</li> <li>Provide moderate water flow to simulate their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Barred Shovelnose Catfish are carnivorous and require a diet rich in meaty foods such as live or frozen shrimp, fish fillets, and earthworms.</li> <li>They are opportunistic feeders and will also accept sinking pellets or tablets.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Due to their large size and predatory nature, they are best kept with similarly sized or larger tank mates that can withstand their presence.</li> <li>Avoid keeping them with small fish that can be seen as prey.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Barred Shovelnose Catfish are nocturnal and will mostly hide during the day, becoming more active at night.</li> <li>They can be territorial towards their own species, so provide plenty of hiding spots to reduce aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  29
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:43:16+00:00"
      },
      {
            "id": 279,
            "name": "Diamond Tetra (Moenkhausia pittieri) 2.5-3cm",
            "type": "physical",
            "sku": "192",
            "description": "<h3>Our Guide To Keeping Diamond Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Moenkhausia pittieri</li> <li><strong>Common name</strong>: Diamond Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, Venezuela</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Diamond Tetras prefer a well-planted tank with open swimming areas.</li> <li>Provide soft, slightly acidic water with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the tank well-filtered and perform regular water changes to maintain good water quality.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable.</li> <li>Choose a filter that provides adequate filtration without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Diamond Tetras are omnivores and will accept a variety of foods.</li> <li>Offer them high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Diamond Tetras are peaceful schooling fish.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Diamond Tetras are active and peaceful fish.</li> <li>They exhibit schooling behavior and should be kept in groups of at least six individuals.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 12,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-18T16:20:51+00:00",
            "date_created": "2023-10-26T07:43:19+00:00"
      },
      {
            "id": 280,
            "name": "Colombian Tetra (Hyphessobrycon columbianus)",
            "type": "physical",
            "sku": "194",
            "description": "<h3>Our Guide To Keeping Columbian Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: <strong>Hyphessobrycon columbianus</strong></li> <li><strong>Common name</strong>: Columbian Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, Colombia</li> <li><strong>Adult length</strong>: # cm (please fill in)</li> <li><strong>Lifespan</strong>: # years (please fill in)</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Columbian Tetras prefer a spacious tank with plenty of swimming space. A minimum tank size of #L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Columbian Tetras thrive in slightly acidic to neutral water conditions with a pH range of # to #.</li> <li>Keep the water temperature between # to #&deg;C (# to #&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Columbian Tetras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Columbian Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Columbian Tetras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 18,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-26T16:26:39+00:00",
            "date_created": "2023-10-26T07:43:22+00:00"
      },
      {
            "id": 281,
            "name": "Silver Dollar (Metynnis hypsauchen)",
            "type": "physical",
            "sku": "199",
            "description": "<h3>Our Guide To Keeping Silver Dollar Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Metynnis hypsauchen</li> <li><strong>Common name</strong>: Silver Dollar</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, primarily in the Amazon River Basin</li> <li><strong>Adult length</strong>: 15 cm</li> <li><strong>Lifespan</strong>: 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Silver Dollars prefer a spacious tank with ample swimming space. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide hiding places and areas with dense vegetation. They appreciate plants, but due to their herbivorous nature, use hardy plants like Java Fern and Anubias, or artificial plants.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Silver Dollars thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Silver Dollars are primarily herbivores and prefer a diet rich in plant matter. Offer them high-quality flake or pellet food designed for herbivorous fish.</li> <li>Supplement their diet with blanched vegetables like spinach, lettuce, and peas, as well as algae wafers.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Silver Dollars are peaceful schooling fish and should be kept in groups of at least five to reduce stress and encourage natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, larger rasboras, peaceful barbs, and larger catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Silver Dollars are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:43:29+00:00"
      },
      {
            "id": 282,
            "name": "Spotted Silver Dollar (Metynnis hypsauchen) 4cm",
            "type": "physical",
            "sku": "200",
            "description": "<h3>Our Guide To Keeping Spotted Silver Dollar Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Metynnis hypsauchen</li> <li><strong>Common name</strong>: Spotted Silver Dollar</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, primarily in the Amazon River Basin</li> <li><strong>Adult length</strong>: 15 cm</li> <li><strong>Lifespan</strong>: 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Spotted Silver Dollars prefer a spacious tank with ample swimming space. A minimum tank size of 200L is recommended for a small group of these fish.</li> <li>Provide hiding places and areas with dense vegetation. They appreciate plants, but due to their herbivorous nature, use hardy plants like Java Fern and Anubias, or artificial plants.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Spotted Silver Dollars thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Spotted Silver Dollars are primarily herbivores and prefer a diet rich in plant matter. Offer them high-quality flake or pellet food designed for herbivorous fish.</li> <li>Supplement their diet with blanched vegetables like spinach, lettuce, and peas, as well as algae wafers.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Spotted Silver Dollars are peaceful schooling fish and should be kept in groups of at least five to reduce stress and encourage natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, larger rasboras, peaceful barbs, and larger catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Spotted Silver Dollars are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:43:31+00:00"
      },
      {
            "id": 283,
            "name": "Rosy Tetra (Hyphessobrycon rosaceus)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Rosy Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon rosaceus</li> <li><strong>Common name</strong>: Rosy Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically the Amazon River basin</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rosy Tetras thrive in a planted aquarium setup with soft, slightly acidic water.</li> <li>Provide ample hiding places using plants like Java Moss, Java Fern, and floating plants such as Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Rosy Tetras prefer water with a pH range of 6.0 to 7.0 and a temperature between 24 to 26&deg;C (75 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Ensure efficient filtration and gentle water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rosy Tetras are omnivores and accept a variety of foods including high-quality flake or pellet food, as well as live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Rosy Tetras are peaceful and do well in community tanks with other small, non-aggressive fish such as other tetras, rasboras, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are schooling fish, so keeping them in groups of at least six individuals is recommended to reduce stress and encourage natural behavior.</li> <li>Avoid keeping them with aggressive or fin-nipping species that may cause stress or harm.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-02T17:36:17+00:00",
            "date_created": "2023-10-26T07:43:34+00:00"
      },
      {
            "id": 284,
            "name": "Blind Cave Fish(Astyanax mexicanus)",
            "type": "physical",
            "sku": "202",
            "description": "<h3>Our Guide To Keeping Blind Cave Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Astyanax mexicanus</li> <li><strong>Common name</strong>: Blind Cave Fish</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: Caves in North America, especially Mexico and the United States</li> <li><strong>Adult length</strong>: Varies by species, typically around 7 to 12 cm</li> <li><strong>Lifespan</strong>: Varies by species, typically around 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Blind Cave Fish are adapted to dark environments, so provide a tank with low or no lighting. Use caves, rocks, and other structures for hiding places.</li> <li>As they have no functional eyes, decorations should be arranged to prevent injury, and substrate should be smooth to avoid damage to their barbels.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Blind Cave Fish are hardy but prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 20 to 25&deg;C (68 to 77&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filter to avoid strong water flow, as Blind Cave Fish are not strong swimmers.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blind Cave Fish are omnivores; offer them a varied diet of high-quality flake or pellet food, along with live or frozen foods like bloodworms and brine shrimp.</li> <li>They may not compete well for food in a community tank, so consider a species-specific setup.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Keep Blind Cave Fish in a species-only tank as they may struggle to compete for food with sighted fish. Avoid aggressive or fin-nipping tank mates.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blind Cave Fish rely on their other senses due to the absence of eyes. They are sensitive to vibrations and have an interesting schooling behavior.</li> <li>Provide a secure environment to reduce stress, as they can be more susceptible to stress-related illnesses.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 20,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-20T06:59:07+00:00",
            "date_created": "2023-10-26T07:43:37+00:00"
      },
      {
            "id": 285,
            "name": "Ornate Tetra (Hyphessobrycon bentosi)",
            "type": "physical",
            "sku": "203",
            "description": "<h3>Our Guide To Keeping Ornate Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hyphessobrycon bentosi</li> <li><strong>Common name</strong>: Ornate Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, specifically found in the Paraguay and Guapor&eacute; River basins in Brazil</li> <li><strong>Adult length</strong>: 4 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Ornate Tetras thrive in a well-planted tank with subdued lighting and open swimming areas.</li> <li>They prefer soft, acidic water conditions similar to their natural habitat. Aim for a pH range of 6.0 to 6.5 and a temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> <li>Provide hiding spots among plants and driftwood, as well as open areas for swimming.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain good water quality with regular water changes and filtration.</li> <li>They are sensitive to water parameters, so monitor ammonia, nitrite, and nitrate levels closely.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filtration system to mimic the slow-moving waters of their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Ornate Tetras are omnivores and will accept a variety of foods including high-quality flakes, pellets, and live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> <li>Offer a varied diet to ensure their nutritional needs are met.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful schooling fish and should be kept in groups of at least six individuals.</li> <li>Compatible tank mates include other small, peaceful fish such as tetras, rasboras, dwarf cichlids, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Ornate Tetras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>They are peaceful and can coexist with a variety of community fish species.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:43:44+00:00"
      },
      {
            "id": 286,
            "name": "Wild Caught Gold Tetra (Hemigrammus rodwayi)",
            "type": "physical",
            "sku": "204",
            "description": "<h3>Our Guide To Keeping Gold Tetra Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Hemigrammus rodwayi</li> <li><strong>Common name</strong>: Gold Tetra</li> <li><strong>Family</strong>: Characidae</li> <li><strong>Origin</strong>: South America, Amazon Basin</li> <li><strong>Adult length</strong>: 3 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Gold Tetras prefer a tank with plenty of plants and hiding spots, as well as open swimming areas.</li> <li>A tank size of at least 20 gallons is suitable for a small group of Gold Tetras.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Gold Tetras thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Gold Tetras are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Gold Tetras are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Gold Tetras are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  33
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:43:47+00:00"
      },
      {
            "id": 287,
            "name": "Senegal Bichir (Polypterus senegalus)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Senegal Bichir Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Polypterus senegalus</li> <li><strong>Common name</strong>: Senegal Bichir</li> <li><strong>Family</strong>: Polypteridae</li> <li><strong>Origin</strong>: West and Central Africa, Senegal River basin</li> <li><strong>Adult length</strong>: Up to 30 cm (12 inches)</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Senegal Bichirs require a spacious tank with a secure lid as they are capable of jumping. A minimum tank size of 200L is recommended for juveniles, but adults may need larger tanks.</li> <li>Provide hiding spots like caves, driftwood, and plants as they are nocturnal and like to hide during the day.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Senegal Bichirs prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide a gentle to moderate water flow in the tank.</li> <li>Avoid strong currents as these fish come from slow-moving waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Senegal Bichirs are carnivorous and should be offered a diet rich in protein. They readily accept a variety of live and frozen foods such as bloodworms, brine shrimp, and small feeder fish.</li> <li>Feed them sinking pellets or tablets specifically formulated for carnivorous fish as a staple diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Senegal Bichirs are generally peaceful but may eat smaller tank mates that can fit in their mouth. Choose tank mates of similar size and temperament.</li> <li>They can be kept with larger, non-aggressive fish like cichlids, larger tetras, and catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Senegal Bichirs are nocturnal and spend most of the day hiding. They are relatively shy and solitary fish.</li> <li>They are compatible with other peaceful, non-aggressive fish that won't compete for food.</li> </ul> </li> </ol>",
            "price": 10,
            "sale_price": 0,
            "inventory_level": 5,
            "is_visible": true,
            "categories": [
                  27
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:43:49+00:00"
      },
      {
            "id": 288,
            "name": "Bumblebee Goby (Brachygobius xanthozonus) 2-2.5cm",
            "type": "physical",
            "sku": "206",
            "description": "<h3>Our Guide To Keeping Bumblebee Goby Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Brachygobius xanthozonus</li> <li><strong>Common name</strong>: Bumblebee Goby</li> <li><strong>Family</strong>: Gobiidae</li> <li><strong>Origin</strong>: Southeast Asia, including Indonesia and Malaysia</li> <li><strong>Adult length</strong>: Up to 3 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Bumblebee Gobies thrive in small aquariums with a minimum size of 20L. Provide fine substrate and structures like caves or PVC pipes for hiding.</li> <li>They appreciate a setup with gentle water flow and may benefit from the addition of live plants like Java Moss.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly brackish water conditions with a specific gravity of around 1.005 to 1.008.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a sponge filter or gentle filtration system to avoid strong currents that can stress the Bumblebee Goby.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Bumblebee Gobies are carnivorous and prefer live or frozen foods such as brine shrimp, bloodworms, and small crustaceans.</li> <li>Offer a variety of small, sinking pellets or granules as part of their diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Keep Bumblebee Gobies in a species-only tank or with peaceful, non-competitive tank mates.</li> <li>Avoid housing them with aggressive or larger fish that may pose a threat.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Bumblebee Gobies are relatively peaceful but can be territorial, especially during breeding. Males may display aggression towards each other.</li> <li>Provide adequate hiding spaces to reduce aggression and monitor their interactions closely.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:35+00:00",
            "date_created": "2023-10-26T07:43:54+00:00"
      },
      {
            "id": 289,
            "name": "Clown Knifefish (Chitala ornata)",
            "type": "physical",
            "sku": "207",
            "description": "<h3>Our Guide To Keeping Clown Knifefish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Chitala ornata</li> <li><strong>Common name</strong>: Clown Knifefish</li> <li><strong>Family</strong>: Notopteridae</li> <li><strong>Origin</strong>: Southeast Asia, particularly in Thailand, Cambodia, Laos, and Vietnam</li> <li><strong>Adult length</strong>: Up to 1 meter (39 inches)</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Clown Knifefish require a very large tank due to their potential size. A minimum tank size of 500L is recommended for young individuals, with larger tanks needed as they grow.</li> <li>Provide plenty of hiding places with driftwood, rocks, and large aquatic plants. They appreciate dim lighting and subdued environments to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Clown Knifefish thrive in neutral to slightly acidic water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (75 to 82ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system is essential due to the large bioload of Clown Knifefish. Ensure moderate water flow to keep the water clean and well-oxygenated.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Clown Knifefish are carnivores and require a diet rich in protein. Offer them live or frozen foods such as small fish, shrimp, and worms.</li> <li>They can also be trained to accept high-quality carnivorous fish pellets.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Clown Knifefish can be territorial and may eat smaller tank mates. They are best kept with other large, non-aggressive fish such as large cichlids, catfish, and other large predatory species.</li> <li>Avoid keeping them with small, peaceful fish as they may be seen as prey.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Clown Knifefish are nocturnal and most active during the night. They may be shy and reclusive, especially when first introduced to a new tank.</li> <li>They can become more interactive and confident over time, especially when kept in a suitable environment with appropriate tank mates.</li> </ul> </li> </ol>",
            "price": 7.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  31
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:00+00:00"
      },
      {
            "id": 290,
            "name": "Leopard Bush Fish (Ctenopoma acutirostre)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Leopard Bush Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Ctenopoma acutirostre</li> <li><strong>Common name</strong>: Leopard Bush Fish</li> <li><strong>Family</strong>: Anabantidae</li> <li><strong>Origin</strong>: Africa (Congo River Basin and West Africa)</li> <li><strong>Adult length</strong>: Up to 15 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Leopard Bush Fish prefer a well-planted tank with plenty of hiding spots and territories.</li> <li>Provide driftwood, rocks, and caves to mimic their natural habitat and create hiding places.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Leopard Bush Fish thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Leopard Bush Fish are carnivorous and should be offered a variety of live and frozen foods such as bloodworms, brine shrimp, and small crustaceans.</li> <li>They can also accept high-quality pellets or flakes, but live foods are preferred.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Leopard Bush Fish are semi-aggressive and should be kept with similarly sized, peaceful tank mates.</li> <li>Avoid keeping them with small or slow-moving fish that may become prey.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Leopard Bush Fish are solitary and territorial, so provide plenty of hiding places to reduce aggression.</li> <li>They may show aggression towards conspecifics or similar-looking fish, so monitor their behavior carefully.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:03+00:00"
      },
      {
            "id": 291,
            "name": "Zebra Spiny Eel (Macrognathus zebrinus)",
            "type": "physical",
            "sku": "209",
            "description": "<h3>Our Guide To Keeping Zebra Spiny Eel Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Macrognathus zebrinus</li> <li><strong>Common name</strong>: Zebra Spiny Eel</li> <li><strong>Family</strong>: Mastacembelidae</li> <li><strong>Origin</strong>: Rivers and streams in Southeast Asia, particularly India, Bangladesh, and Myanmar</li> <li><strong>Adult length</strong>: 25 cm</li> <li><strong>Lifespan</strong>: 8 to 12 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Zebra Spiny Eels prefer a tank with soft, sandy substrate to prevent injury to their delicate skin. A minimum tank size of 150L is recommended for a single adult.</li> <li>Provide plenty of hiding places with rocks, driftwood, and PVC pipes to create a secure environment. They appreciate dim lighting and low-flow areas in the tank.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Zebra Spiny Eels thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish, so choose a filter that provides minimal to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Zebra Spiny Eels are carnivores and prefer live or frozen foods. Offer them a diet consisting of bloodworms, brine shrimp, and small crustaceans.</li> <li>They may also accept high-quality sinking pellets designed for carnivorous fish, but live or frozen foods should form the bulk of their diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Zebra Spiny Eels are generally peaceful but can be territorial with their own kind. It is best to keep them with other non-aggressive fish that occupy different levels of the tank.</li> <li>Suitable tank mates include peaceful species like tetras, rasboras, and small catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Zebra Spiny Eels are nocturnal and may be shy during the day. They become more active and confident during nighttime feeding.</li> <li>Avoid keeping them with aggressive or overly active fish that may outcompete them for food or disturb their resting areas.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  35
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:05+00:00"
      },
      {
            "id": 292,
            "name": "Tyre Track Eel (Mastacembelus armatus)",
            "type": "physical",
            "sku": "210",
            "description": "<h3>Our Guide To Keeping Tyre Track Eel Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Mastacembelus armatus</li> <li><strong>Common name</strong>: Tyre Track Eel</li> <li><strong>Family</strong>: Mastacembelidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: Up to 90 cm (35 inches)</li> <li><strong>Lifespan</strong>: 10 to 20 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Tyre Track Eels require a large tank with a minimum size of 300L to accommodate their potential size and activity level.</li> <li>Provide plenty of hiding places such as caves, driftwood, and PVC pipes, as these eels are nocturnal and prefer to hide during the day.</li> <li>Use a soft substrate like sand to prevent injury to their delicate skin.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Tyre Track Eels thrive in neutral to slightly alkaline water with a pH range of 7.0 to 8.0.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system is necessary to maintain water quality, but ensure that the water flow is moderate, as Tyre Track Eels prefer slower-moving waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Tyre Track Eels are carnivorous and should be fed a diet of live or frozen foods such as bloodworms, brine shrimp, earthworms, and small fish.</li> <li>Occasionally, they may accept high-quality pellet food designed for carnivorous fish.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Tyre Track Eels can be kept with other large, peaceful fish species that will not fit into their mouths.</li> <li>Avoid keeping them with small fish or aggressive species that may nip at their fins.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Tyre Track Eels are generally peaceful but can be territorial with their own kind. It's best to keep only one eel per tank unless it is very large and has ample hiding places.</li> <li>They are nocturnal and will be more active during the evening and night hours.</li> </ul> </li> </ol>",
            "price": 5.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  35
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:08+00:00"
      },
      {
            "id": 293,
            "name": "Black Ghost Knifefish (Apteronotus albifrons)",
            "type": "physical",
            "sku": "211",
            "description": "<h3>Our Guide To Keeping Black Ghost Knifefish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Apteronotus albifrons</li> <li><strong>Common name</strong>: Black Ghost Knifefish</li> <li><strong>Family</strong>: Apteronotidae</li> <li><strong>Origin</strong>: South America, Amazon and Orinoco basins</li> <li><strong>Adult length</strong>: Up to 50 cm (20 inches)</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a spacious tank with plenty of swimming space and hiding spots, as Black Ghost Knifefish are nocturnal and prefer low lighting.</li> <li>Decorate the tank with driftwood, rocks, and live or artificial plants to create hiding spots and mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Maintain a pH level between 6.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter with gentle to moderate flow to maintain water quality without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Black Ghost Knifefish are carnivores, so offer them a varied diet consisting of live or frozen foods like bloodworms, brine shrimp, and blackworms.</li> <li>Supplement their diet with high-quality sinking pellets or tablets to ensure they receive all essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Choose tank mates carefully, as Black Ghost Knifefish can be aggressive towards smaller fish.</li> <li>Compatible tank mates include larger peaceful fish like angelfish, gouramis, and larger tetras. Avoid keeping them with aggressive or territorial species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Ghost Knifefish are generally peaceful but may become territorial, especially during breeding.</li> <li>They are nocturnal and will be most active during the night, preferring to hide during the day.</li> </ul> </li> </ol>",
            "price": 15,
            "sale_price": 0,
            "inventory_level": 5,
            "is_visible": true,
            "categories": [
                  31
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-19T12:07:47+00:00",
            "date_created": "2023-10-26T07:44:13+00:00"
      },
      {
            "id": 294,
            "name": "Peacock Gudgeon (Tateurndina ocellicauda)",
            "type": "physical",
            "sku": "212",
            "description": "<h3>Our Guide To Keeping Peacock Gudgeon Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Tateurndina ocellicauda</li> <li><strong>Common name</strong>: Peacock Gudgeon</li> <li><strong>Family</strong>: Eleotridae</li> <li><strong>Origin</strong>: Papua New Guinea</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Peacock Gudgeons thrive in a tank with a minimum size of 80L, providing hiding spots and caves as they appreciate a well-structured environment.</li> <li>Include fine substrate and decorations to create hiding places, and consider adding live plants like Java Moss and Anubias for cover.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5 for Peacock Gudgeons.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter with gentle to moderate flow, ensuring a well-filtered and oxygenated environment for these fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Peacock Gudgeons are carnivores, and their diet should include high-quality flake or pellet food supplemented with live or frozen foods like brine shrimp, bloodworms, and daphnia.</li> <li>Offer a varied diet to ensure they receive essential nutrients and mimic their natural feeding habits.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Peacock Gudgeons are generally peaceful but may show aggression during breeding. Keep them in pairs or groups and avoid housing them with aggressive or larger fish.</li> <li>Compatible tank mates include small, peaceful species like dwarf cichlids, small tetras, and rasboras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>These fish exhibit interesting behavior, and males may display vibrant colors during courtship and breeding.</li> <li>Provide adequate hiding places to reduce stress, and avoid keeping them with fin-nipping or aggressive species.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:16+00:00"
      },
      {
            "id": 295,
            "name": "Fahaka Puffer (Tetraodon lineatus)",
            "type": "physical",
            "sku": "213",
            "description": "<h3>Our Guide To Keeping Fahaka Puffer Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Tetraodon lineatus</li> <li><strong>Common name</strong>: Fahaka Puffer</li> <li><strong>Family</strong>: Tetraodontidae</li> <li><strong>Origin</strong>: Nile River and other river systems in East Africa</li> <li><strong>Adult length</strong>: Up to 17 inches (43 cm)</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Fahaka Puffers need a large tank with a minimum capacity of 125 gallons for juveniles and 300 gallons or more for adults due to their large size and high waste production.</li> <li>Include plenty of hiding spots and decorations like rocks, caves, and driftwood to create territories and provide stimulation.</li> <li>Use sand or smooth gravel substrate to prevent injuries to the puffer's delicate skin and mouth.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 75&deg;F to 82&deg;F (24&deg;C to 28&deg;C).</li> <li>Maintain a pH level between 7.0 to 8.5.</li> <li>Provide strong and efficient filtration to handle the puffer's high waste output and ensure excellent water quality.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system with a high turnover rate to keep the water clean and oxygenated.</li> <li>Avoid strong water currents as Fahaka Puffers prefer calmer waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Fahaka Puffers are carnivores and require a diet rich in protein.</li> <li>Offer a variety of live and frozen foods such as snails, clams, mussels, shrimp, and crayfish.</li> <li>Supplement their diet with occasional feedings of high-quality sinking pellets or tablets formulated for carnivorous fish.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Fahaka Puffers are solitary and highly aggressive towards tank mates, especially conspecifics (other Fahaka Puffers).</li> <li>Best kept alone in a species-only tank due to their aggressive nature and large size.</li> <li>Avoid keeping them with small or slow-moving fish as they may be seen as prey.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Fahaka Puffers are intelligent and curious fish that require mental stimulation.</li> <li>They are territorial and can be aggressive towards tank mates, often displaying dominance behaviors.</li> <li>Provide ample hiding spots and visual barriers to reduce aggression and stress in the tank.</li> </ul> </li> </ol>",
            "price": 15,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  30
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:19+00:00"
      },
      {
            "id": 296,
            "name": "Southern Purple-spotted Gudgeon (Mogurnda adspersa)",
            "type": "physical",
            "sku": "215",
            "description": "<h3>Our Guide To Keeping Southern Purple-spotted Gudgeon Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Mogurnda adspersa</li> <li><strong>Common name</strong>: Southern Purple-spotted Gudgeon</li> <li><strong>Family</strong>: Eleotridae</li> <li><strong>Origin</strong>: Australia, New Guinea</li> <li><strong>Adult length</strong>: 8 to 12 cm</li> <li><strong>Lifespan</strong>: 5 to 7 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Southern Purple-spotted Gudgeons prefer a tank with plenty of hiding places like rocks, caves, and driftwood. They also appreciate a sandy substrate and areas with dense vegetation.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F) and maintain a pH level of 6.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow with efficient filtration is suitable for Purple-spotted Gudgeons.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>They are omnivorous and will accept a variety of foods including high-quality flakes, pellets, frozen, and live foods like bloodworms, brine shrimp, and small insects.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Southern Purple-spotted Gudgeons are generally peaceful but can be territorial during breeding. Suitable tank mates include peaceful community fish like small tetras, rasboras, and catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are territorial during breeding and may display aggression towards conspecifics and other bottom-dwelling fish. Provide plenty of hiding spots to reduce aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:22+00:00"
      },
      {
            "id": 297,
            "name": "Rainbow Goby (Stiphodon ornatus) 5cm",
            "type": "physical",
            "sku": "216",
            "description": "<h3>Our Guide To Keeping Rainbow Goby Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Stiphodon semoni</li> <li><strong>Common name</strong>: Rainbow Goby</li> <li><strong>Family</strong>: Gobiidae</li> <li><strong>Origin</strong>: Western Pacific, including Indonesia and Papua New Guinea</li> <li><strong>Adult length</strong>: Approximately 3 to 4 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rainbow Gobies require a tank with plenty of hiding spots provided by rocks, driftwood, and plants.</li> <li>They prefer a tank with a moderate to strong water flow to mimic their natural habitat in fast-flowing streams.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Rainbow Gobies thrive in slightly acidic to neutral water conditions with a pH range of 7.0 to 8.0.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A strong filtration system with a moderate to strong water flow is recommended to maintain water quality and simulate their natural environment.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rainbow Gobies are omnivores and should be provided with a varied diet including algae-based foods, small live or frozen foods like daphnia, brine shrimp, or bloodworms.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Rainbow Gobies can be territorial, especially towards other males of their species, so it's best to keep them in a single male to multiple female ratio.</li> <li>They are compatible with other peaceful fish species that can tolerate their territorial behavior, such as small peaceful tetras, rasboras, or other small peaceful gobies.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rainbow Gobies are active and colorful fish that display interesting behaviors, including grazing on algae and establishing territories.</li> <li>Provide plenty of hiding spots and space for each fish to reduce aggression and territorial disputes.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:27+00:00"
      },
      {
            "id": 298,
            "name": "Ropefish (Erpetoichthys calabaricus)",
            "type": "physical",
            "sku": "217",
            "description": "<h3>Our Guide To Keeping Ropefish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Erpetoichthys calabaricus</li> <li><strong>Common name</strong>: Ropefish</li> <li><strong>Family</strong>: Polypteridae</li> <li><strong>Origin</strong>: West Africa, including the Niger Delta and the Ogun River basin</li> <li><strong>Adult length</strong>: Can reach up to 50 cm (20 inches)</li> <li><strong>Lifespan</strong>: 8 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Ropefish require a tank with a tight-fitting lid as they are known to be escape artists. A minimum tank size of 200L is recommended for a single ropefish, with additional space needed for each additional fish.</li> <li>Provide plenty of hiding spots such as caves, PVC pipes, and driftwood. Dense vegetation and floating plants can also be beneficial.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Ropefish prefer soft to moderately hard water with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Effective filtration is essential for maintaining water quality as ropefish are sensitive to water conditions. Aim for a gentle to moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Ropefish are carnivorous and prefer live or frozen foods such as bloodworms, blackworms, brine shrimp, and small crustaceans.</li> <li>They may also accept sinking pellets or tablets, but live foods should form the majority of their diet to ensure proper nutrition.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Ropefish are peaceful but may eat very small tank mates. They can be kept with other peaceful, non-aggressive fish of similar size that will not fit in their mouth.</li> <li>Consider tank mates such as larger tetras, barbs, gouramis, and peaceful catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Ropefish are nocturnal and may hide during the day, becoming more active at night.</li> <li>They are generally peaceful but may become territorial during breeding.</li> </ul> </li> </ol>",
            "price": 15,
            "sale_price": 0,
            "inventory_level": 5,
            "is_visible": true,
            "categories": [
                  116
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-17T19:52:42+00:00",
            "date_created": "2023-10-26T07:44:30+00:00"
      },
      {
            "id": 299,
            "name": "Mountain Rock Goby (Sicyopterus sp)",
            "type": "physical",
            "sku": "218",
            "description": "<h3>Our Guide To Keeping Mountain Rock Goby Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Sicyopterus</li> <li><strong>Common name</strong>: Mountain Rock Goby</li> <li><strong>Family</strong>: Gobiidae</li> <li><strong>Origin</strong>: Mountain streams and rivers in various regions</li> <li><strong>Adult length</strong>: Varies by species, typically ranging from 5 to 10 centimeters</li> <li><strong>Lifespan</strong>: Varies by species, typically 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Mountain Rock Gobies require a tank with plenty of hiding places, such as caves, rocks, and driftwood, to mimic their natural habitat.</li> <li>A tank size of at least 20 gallons (75 litres) is suitable for a small group of Mountain Rock Gobies.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Mountain Rock Gobies prefer clean, well-oxygenated water with a pH range of 7.0 to 8.0.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for Mountain Rock Gobies. Use a filter that provides adequate filtration without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Mountain Rock Gobies are omnivores and will accept a variety of foods, including small live or frozen foods like brine shrimp, bloodworms, and daphnia.</li> <li>Offer a balanced diet consisting of high-quality sinking pellets or flakes supplemented with occasional live or frozen foods.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Mountain Rock Gobies are peaceful fish but may display territorial behavior towards conspecifics (members of the same species).</li> <li>They can be kept with other peaceful fish species that occupy different areas of the tank, such as small peaceful tetras, rasboras, and bottom-dwelling catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Mountain Rock Gobies are secretive fish that spend much of their time hiding among rocks and substrate.</li> <li>They may become territorial, especially during breeding periods, so provide ample hiding spots to reduce aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:32+00:00"
      },
      {
            "id": 300,
            "name": "Desert Goby (Chlamydogobius eremius)",
            "type": "physical",
            "sku": "219",
            "description": "<h3>Our Guide To Keeping Desert Goby Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Chlamydogobius eremius</li> <li><strong>Common name</strong>: Desert Goby</li> <li><strong>Family</strong>: Eleotridae</li> <li><strong>Origin</strong>: Inland rivers and water bodies in Australia</li> <li><strong>Adult length</strong>: 5 to 7 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Desert Gobies thrive in aquariums with a sandy substrate and plenty of hiding spots. A tank size of at least 40L is suitable for a small group of these fish.</li> <li>Provide rocks, driftwood, and artificial caves as shelters, and consider adding live plants like Vallisneria for a natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Desert Gobies prefer slightly alkaline to neutral water conditions with a pH range of 7.0 to 8.5.</li> <li>Maintain the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filter to maintain water quality, and ensure a minimal to moderate water flow in the aquarium.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Desert Gobies are opportunistic feeders and accept a varied diet. Offer them high-quality micro-pellets or crushed flakes as their main food source.</li> <li>Include live or frozen foods like brine shrimp, daphnia, and small insects to supplement their diet and enhance their coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Desert Gobies can be territorial, especially during breeding, so keep them in pairs or small groups in a species-only tank.</li> <li>Avoid housing them with aggressive or fin-nipping species, and choose tank mates that are compatible with their behavior.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Desert Gobies exhibit interesting behaviors, including burrowing in the substrate and establishing territories. Provide adequate hiding spaces to reduce stress.</li> <li>They may not be suitable for community tanks with larger, more boisterous fish.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:35+00:00"
      },
      {
            "id": 301,
            "name": "South Amazon Puffer (Colomesus asellus)",
            "type": "physical",
            "sku": "220",
            "description": "<h3>Our Guide To Keeping South American Puffer</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Colomesus asellus</li> <li><strong>Common name</strong>: South American Pufferfish</li> <li><strong>Family</strong>: Tetraodontidae</li> <li><strong>Origin</strong>: South America, particularly the Amazon River Basin</li> <li><strong>Adult length</strong>: Up to 10 cm</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>South American Pufferfish require a tank with plenty of swimming space despite their small size. A minimum tank size of 75 litres is recommended for a small group.</li> <li>Include hiding spots and decorations like driftwood, rocks, and plants (live or artificial) to provide security and stimulation for the pufferfish.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>South American Pufferfish thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate to high water flow is suitable for these fish, so choose a filter that provides adequate circulation and oxygenation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>South American Pufferfish are primarily carnivorous and require a diet rich in protein. Offer them a variety of foods including live or frozen options like bloodworms, brine shrimp, and snails.</li> <li>Supplement their diet with commercial pufferfish pellets or tablets formulated specifically for their nutritional needs.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>South American Pufferfish are not suitable for community tanks due to their aggressive and territorial nature. They are best kept alone or with species that can tolerate their behavior, such as large, fast-moving fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>South American Pufferfish are known for their curious and sometimes aggressive behavior, especially towards tankmates and intruders in their territory.</li> <li>They have powerful jaws and beak-like teeth, which they use for hunting and defense. Avoid keeping them with smaller or slower fish species that may become prey.</li> </ul> </li> </ol>",
            "price": 15,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  30
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:43+00:00"
      },
      {
            "id": 302,
            "name": "Lipstick Goby (Sicyopus exallisquamulus)",
            "type": "physical",
            "sku": "221",
            "description": "<h3>Our Guide To Keeping Lipstick Goby</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Elacatinus multifasciatus</li> <li><strong>Common name</strong>: Lipstick Goby</li> <li><strong>Family</strong>: Gobiidae</li> <li><strong>Origin</strong>: Western Atlantic Ocean</li> <li><strong>Adult length</strong>: 2.5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Lipstick Gobies prefer a tank with plenty of hiding places. A minimum tank size of 20 litres is recommended for a small group of these fish.</li> <li>Provide ample hiding places and areas with live rock or caves to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Lipstick Gobies thrive in water conditions with a pH range of 8.0 to 8.4.</li> <li>Keep the water temperature between 23 to 27&deg;C (73 to 81&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Lipstick Gobies are carnivores and will accept a variety of foods. Offer them a diet consisting of high-quality frozen or live foods such as brine shrimp, bloodworms, and mysis shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Lipstick Gobies are peaceful fish but can be territorial towards their own kind. Keep them with other peaceful fish species such as small gobies, blennies, and small wrasses.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Lipstick Gobies are active fish and will spend much of their time exploring their environment.</li> <li>They may become territorial towards other Lipstick Gobies, especially in smaller tanks, so it's best to keep them singly or in mated pairs.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:46+00:00"
      },
      {
            "id": 303,
            "name": "Badis Badis (Badis badis)",
            "type": "physical",
            "sku": "222",
            "description": "<h3>Our Guide To Keeping Badis Badis Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Badis badis</li> <li><strong>Common name</strong>: Badis Badis, Chameleon Fish</li> <li><strong>Family</strong>: Badidae</li> <li><strong>Origin</strong>: South Asia, specifically in rivers and streams of India, Bangladesh, and Myanmar</li> <li><strong>Adult length</strong>: Up to 6 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Badis Badis thrive in a well-decorated tank with plenty of hiding spots. A tank size of at least 40 litres is suitable for a small group.</li> <li>Provide caves, rocks, and plants like Java Moss and Anubias to create hiding places and territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Badis Badisprefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filter to maintain a low to moderate water flow, simulating their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Badis Badis are carnivorous and prefer live or frozen foods. Offer them a variety of high-quality live or frozen foods like brine shrimp, bloodworms, and small insects.</li> <li>Supplement their diet with high-quality pellets or flakes formulated for small carnivorous fish.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Badis Badis are generally peaceful but may be territorial. Keep them in a group of at least six individuals to distribute aggression.</li> <li>Compatible tank mates include small and peaceful fish like rasboras, smaller tetras, and peaceful dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Badis Badis are known for their intriguing behavior, and they may display some territoriality, especially during breeding.</li> <li>Avoid keeping them with aggressive or overly territorial fish that may stress them.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  60
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:48+00:00"
      },
      {
            "id": 304,
            "name": "Micro Dragon Goby (Schismatogobius ampluvinculus)",
            "type": "physical",
            "sku": "223",
            "description": "<h3>Our Guide To Keeping Micro Dragon Goby Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Schismatogobius ampluvinculus</li> <li><strong>Common name</strong>: Micro Dragon Goby</li> <li><strong>Family</strong>: Gobiidae</li> <li><strong>Origin</strong>: Philippines</li> <li><strong>Adult length</strong>: 3 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Micro Dragon Gobies prefer a tank with sandy substrate and plenty of hiding places such as caves, rocks, and driftwood.</li> <li>They also require a moderate to strong water flow in the tank.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Micro Dragon Gobies thrive in slightly brackish water conditions with a specific gravity range of 1.005 to 1.010.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate to strong water flow is suitable for these fish to mimic their natural habitat.</li> <li>Choose a filter that provides efficient filtration and water movement in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Micro Dragon Gobies are carnivores and should be fed a diet primarily consisting of live or frozen foods such as bloodworms, brine shrimp, and small crustaceans.</li> <li>Offer them a variety of high-protein foods to ensure their nutritional needs are met.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Micro Dragon Gobies are territorial and should be kept singly or in mated pairs in a species-specific tank.</li> <li>Avoid keeping them with aggressive or larger fish species that may intimidate or harm them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Micro Dragon Gobies are known for their unique behavior and are best kept in a species-specific setup.</li> <li>They may exhibit aggression towards other bottom-dwelling fish, so choose tank mates carefully.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:51+00:00"
      },
      {
            "id": 305,
            "name": "Clown Killifish (Epiplatys annulatus)",
            "type": "physical",
            "sku": "115",
            "description": "<h3>Our Guide To Keeping Clown Killifish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Epiplatys annulatus</li> <li><strong>Common name</strong>: Clown Killifish</li> <li><strong>Family</strong>: Nothobranchiidae</li> <li><strong>Origin</strong>: West Africa</li> <li><strong>Adult length</strong>: Approximately 5 cm</li> <li><strong>Lifespan</strong>: 1 to 2 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Clown Killifish can thrive in smaller tanks, preferably a well-planted aquarium of at least 10 gallons.</li> <li>Provide dense vegetation and areas with floating plants to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for Clown Killifish, so choose a filter that provides adequate but not too strong flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Clown Killifish are carnivorous and will accept a variety of small live and frozen foods such as bloodworms, brine shrimp, and daphnia.</li> <li>Offer them high-quality flake or pellet food as a staple and supplement their diet with live or frozen foods to ensure proper nutrition.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Clown Killifish are peaceful fish and can be kept in a community tank with other small, peaceful species such as small tetras, rasboras, and dwarf cichlids.</li> <li>Avoid keeping them with larger or aggressive tank mates that may intimidate or outcompete them for food.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Clown Killifish are relatively peaceful and can be kept in pairs or small groups.</li> <li>They may display some territorial behavior, especially during breeding, so provide plenty of hiding spots and territories within the tank.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 36,
            "is_visible": true,
            "categories": [
                  25
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-03T19:26:01+00:00",
            "date_created": "2023-10-26T07:44:56+00:00"
      },
      {
            "id": 306,
            "name": "Firemouth Panchax Killifish (Epiplatys dageti)",
            "type": "physical",
            "sku": "224",
            "description": "<h3>Our Guide To Keeping Firemouth Panchax Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Epiplatys dageti</li> <li><strong>Common name</strong>: Firemouth Panchax</li> <li><strong>Family</strong>: Nothobranchiidae</li> <li><strong>Origin</strong>: West Africa</li> <li><strong>Adult length</strong>: 5 to 7 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Firemouth Panchax prefer a well-decorated tank with hiding spots and a mix of open swimming areas.</li> <li>Include plants like Java Moss, Vallisneria, and floating plants to provide cover and create a natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter with gentle to moderate water flow, as Firemouth Panchax prefer calmer water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Firemouth Panchax are carnivores, and their diet should include high-quality flake or pellet food along with live or frozen foods like brine shrimp and bloodworms.</li> <li>Offer a varied diet to ensure they receive essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Firemouth Panchax can be kept with other peaceful community fish, but avoid aggressive species that may intimidate them.</li> <li>Consider tank mates such as small tetras, rasboras, and peaceful catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Firemouth Panchax are relatively peaceful, but males can be territorial, especially during breeding.</li> <li>Provide adequate hiding places to reduce aggression, and consider keeping a larger group to diffuse aggression.</li> </ul> </li> </ol>",
            "price": 3.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  25
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:44:59+00:00"
      },
      {
            "id": 307,
            "name": "Steel Blue Killifish Pair (Fundulopanchax gardneri)",
            "type": "physical",
            "sku": "225",
            "description": "<h3>Our Guide To Keeping Steel Blue Killifish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Fundulopanchax gardneri</li> <li><strong>Common name</strong>: Steel Blue Killifish</li> <li><strong>Family</strong>: Nothobranchiidae</li> <li><strong>Origin</strong>: Western Africa, specifically Nigeria and Cameroon</li> <li><strong>Adult length</strong>: 5 - 6 cm (2 inches)</li> <li><strong>Lifespan</strong>: 1 - 2 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Steel Blue Killifish prefer a tank with plenty of hiding places such as plants, caves, and driftwood.</li> <li>The tank should have a tight-fitting lid as they are known to jump.</li> <li>Provide a substrate of fine sand or gravel.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Steel Blue Killifish thrive in slightly acidic to neutral water with a pH range of 6.0 - 7.0.</li> <li>Water temperature should be maintained between 22 - 26&deg;C (72 - 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system with minimal water flow is recommended.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Steel Blue Killifish are carnivorous and should be fed a diet primarily consisting of live and frozen foods such as bloodworms, brine shrimp, and small insects.</li> <li>They may also accept high-quality flake or pellet foods, but live and frozen foods are preferred.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Steel Blue Killifish are relatively peaceful but may display aggression towards smaller or slower-moving tank mates.</li> <li>They are best kept with other small, peaceful fish that can tolerate similar water conditions.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Steel Blue Killifish are active and may display territorial behavior, especially during breeding.</li> <li>They are best kept in a species-only tank or with other small, peaceful fish.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 3,
            "is_visible": true,
            "categories": [
                  25
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:45:02+00:00"
      },
      {
            "id": 308,
            "name": "American Flagfish Killifish (Jordanella floridae)",
            "type": "physical",
            "sku": "226",
            "description": "<h3>Our Guide To Keeping American Flagfish Killifish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Jordanella floridae</li> <li><strong>Common name</strong>: American Flagfish</li> <li><strong>Family</strong>: Cyprinodontidae</li> <li><strong>Origin</strong>: Southeastern United States</li> <li><strong>Adult length</strong>: Up to 6 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>American Flagfish can thrive in a well-planted tank with open swimming areas.</li> <li>Provide a tank size of at least 20 gallons with a secure lid as they are known to jump.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>They prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 20 to 26&deg;C (68 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide a moderate to strong water flow in the tank.</li> <li>A good filtration system is necessary to maintain water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>American Flagfish are omnivores and will accept a variety of foods including flake, pellet, and live foods.</li> <li>Offer a balanced diet with occasional treats like bloodworms, brine shrimp, and vegetable matter.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be territorial, especially towards other males of their species, so it's best to keep them in a single-species tank or with peaceful community fish.</li> <li>Compatible tank mates include small tetras, rasboras, livebearers, and peaceful bottom-dwellers.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>American Flagfish are known for their colorful appearance and interesting behavior.</li> <li>They can be aggressive towards each other, especially males, so it's important to provide plenty of hiding spots and break lines of sight with decorations and plants.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 16,
            "is_visible": true,
            "categories": [
                  25
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T21:58:56+00:00",
            "date_created": "2023-10-26T07:45:05+00:00"
      },
      {
            "id": 309,
            "name": "Kuhli Loach (Pangio kuhlii) 4-5cm",
            "type": "physical",
            "sku": "227",
            "description": "<h3>Our Guide To Keeping Kuhli Loach Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Pangio kuhlii</li> <li><strong>Common name</strong>: Kuhli Loach</li> <li><strong>Family</strong>: Cobitidae</li> <li><strong>Origin</strong>: Southeast Asia, from Malaysia to Indonesia</li> <li><strong>Adult length</strong>: 5-12 cm</li> <li><strong>Lifespan</strong>: 10-15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Kuhli Loaches are bottom dwellers and prefer tanks with plenty of hiding spots like caves, plants, and driftwood.</li> <li>A sandy substrate is recommended to prevent injury to their delicate bodies.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Kuhli Loaches thrive in tropical water conditions with a temperature range of 24-30&deg;C (75-86&deg;F).</li> <li>Maintain a slightly acidic to neutral pH level between 6.0 and 7.5.</li> <li>They are sensitive to water quality, so regular water changes are essential.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide gentle to moderate water flow in the tank as Kuhli Loaches prefer slow-moving waters.</li> <li>Use a sponge filter or a filter with a low flow setting to avoid stressing them.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Kuhli Loaches are omnivores and will accept a variety of foods including sinking pellets, flakes, and frozen foods like bloodworms and brine shrimp.</li> <li>Feed them a balanced diet and offer sinking foods since they mainly feed at the bottom of the tank.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Kuhli Loaches are peaceful and social fish that thrive in groups of 5 or more individuals.</li> <li>They are compatible with other peaceful community fish such as tetras, rasboras, gouramis, and small catfish species.</li> <li>Ensure tank mates are not aggressive or territorial to prevent stress.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Kuhli Loaches are nocturnal and spend most of their time hiding in substrates or among plants during the day.</li> <li>They are peaceful and do well in community tanks with other non-aggressive species.</li> <li>Provide plenty of hiding spots to make them feel secure and reduce stress.</li> </ul> </li> </ol>",
            "price": 2.5,
            "sale_price": 0,
            "inventory_level": 32,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T16:20:04+00:00",
            "date_created": "2023-10-26T07:45:11+00:00"
      },
      {
            "id": 310,
            "name": "Clown Loach (Chromobotia macracanthus) 5cm",
            "type": "physical",
            "sku": "228",
            "description": "<h3>Our Guide To Keeping Clown Loach Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Chromobotia macracanthus</li> <li><strong>Common name</strong>: Clown Loach</li> <li><strong>Family</strong>: Cobitidae</li> <li><strong>Origin</strong>: Indonesia, Borneo</li> <li><strong>Adult length</strong>: Up to 30 cm</li> <li><strong>Lifespan</strong>: 10 to 20 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Clown Loaches require a spacious tank with plenty of swimming space. A minimum tank size of 300L is recommended for a small group of these fish.</li> <li>Provide hiding places like caves, driftwood, and plants to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Clown Loaches prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 25 to 30&deg;C (77 to 86&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate to strong water flow is suitable for these fish, so choose a filter that provides adequate filtration and water movement.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Clown Loaches are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality pellets, flakes, and occasional live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Clown Loaches are peaceful fish but can be shy. They should be kept in groups of at least five individuals to feel secure and display natural behaviors.</li> <li>They are compatible with other peaceful community fish like tetras, barbs, and rasboras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Clown Loaches are social and active fish that enjoy exploring their surroundings. They may hide during the day and become more active during the night.</li> <li>Avoid keeping them with aggressive or overly territorial fish species that may stress or harm them.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T15:09:55+00:00",
            "date_created": "2023-10-26T07:45:14+00:00"
      },
      {
            "id": 311,
            "name": "Yoyo Loach (Botia almorhae)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Yoyo Loach Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Botia almorhae</li> <li><strong>Common name</strong>: Yoyo Loach</li> <li><strong>Family</strong>: Cobitidae</li> <li><strong>Origin</strong>: India, Nepal, and Bangladesh</li> <li><strong>Adult length</strong>: 12 - 15 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Yoyo Loaches thrive in a tank with plenty of hiding places and substrate for burrowing. A tank size of at least 75 gallons is recommended for a small group of these fish.</li> <li>Provide driftwood, rocks, and caves to create hiding spots, and use sand or fine gravel as substrate.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 23 to 29&deg;C (73 to 84&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Yoyo Loaches prefer moderate water flow, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Yoyo Loaches are omnivores, and their diet should include high-quality sinking pellets, flakes, and live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> <li>Include vegetable matter in their diet, and avoid overfeeding to prevent obesity.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Yoyo Loaches are social and should be kept in groups of at least three individuals.</li> <li>They are compatible with other peaceful community fish but may become aggressive towards their own kind if not kept in a group.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Yoyo Loaches are active and may display playful behavior, especially when kept in a group.</li> <li>Avoid keeping them with aggressive or territorial fish that may stress or harm them.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:36+00:00",
            "date_created": "2023-10-26T07:45:17+00:00"
      },
      {
            "id": 312,
            "name": "Rosy Loach (Petruichthys sp.)",
            "type": "physical",
            "sku": "230",
            "description": "<h3>Our Guide To Keeping Rosy Loach Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Petruichthys sp.</li> <li><strong>Common name</strong>: Rosy Loach</li> <li><strong>Family</strong>: Botiidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 5 - 7 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rosy Loaches prefer a well-decorated tank with hiding spots, rocks, and driftwood. Provide a soft substrate to mimic their natural habitat.</li> <li>They appreciate low to moderate lighting conditions, and a tank size of 80 litres or more is suitable for a small group.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a slightly acidic to neutral pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle to moderate filtration system to ensure good water quality. Rosy Loaches appreciate a slow to moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rosy Loaches are omnivores and will accept a variety of foods, including high-quality pellets, flakes, and live or frozen foods like bloodworms and brine shrimp.</li> <li>Provide a balanced diet to meet their nutritional needs.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Rosy Loaches are peaceful and can be kept with other peaceful community fish, such as other small loach species, rasboras, and small tetras.</li> <li>Avoid aggressive or fin-nipping tank mates.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rosy Loaches are social and thrive in groups. Keep them in a group of at least six individuals to ensure their well-being.</li> <li>They may display playful and active behavior, especially in the evening.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:45:20+00:00"
      },
      {
            "id": 313,
            "name": "Hillstream Loach (Sewellia lineolata) 5-6cm",
            "type": "physical",
            "sku": "231",
            "description": "<h3>Our Guide To Keeping Hillstream Loach Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Sewellia lineolata</li> <li><strong>Common name</strong>: Hillstream Loach</li> <li><strong>Family</strong>: Balitoridae</li> <li><strong>Origin</strong>: Asia</li> <li><strong>Adult length</strong>: 5 to 7 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Hillstream Loaches prefer a spacious tank with plenty of swimming space. A minimum tank size of 75L is recommended for a small school of these fish.</li> <li>Provide ample hiding places and areas with dense vegetation to mimic their natural habitat. They appreciate plants like Java Fern, Anubias, and floating plants like Amazon Frogbit.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Hillstream Loaches thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Hillstream Loaches are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and daphnia to provide essential nutrients and mimic their natural diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Hillstream Loaches are peaceful schooling fish and should be kept in groups of at least six individuals to prevent stress and encourage their natural behaviors.</li> <li>They are compatible with other peaceful community fish such as other tetras, rasboras, peaceful barbs, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Hillstream Loaches are active swimmers and display schooling behavior, so they feel more secure and exhibit their best colors when kept in a group.</li> <li>Avoid keeping them with aggressive or fin-nipping fish species that may intimidate or harass them.</li> </ul> </li> </ol>",
            "price": 7.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-12T18:53:16+00:00",
            "date_created": "2023-10-26T07:45:27+00:00"
      },
      {
            "id": 314,
            "name": "Polka Dot Loach (Botia kubotai)",
            "type": "physical",
            "sku": "232",
            "description": "<h3>Our Guide To Keeping Polka Dot Loach Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Botia kubotai</li> <li><strong>Common name</strong>: Polka Dot Loach</li> <li><strong>Family</strong>: Cobitidae</li> <li><strong>Origin</strong>: Thailand</li> <li><strong>Adult length</strong>: 10 - 12 cm</li> <li><strong>Lifespan</strong>: 8 to 12 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Polka Dot Loaches require a tank with hiding spots and sufficient space to swim. A tank size of at least 75 gallons is recommended.</li> <li>Decorate the tank with caves, driftwood, and rocks to create hiding places. They appreciate a substrate with smooth pebbles or sand.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a slightly acidic to neutral pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 25 to 30&deg;C (77 to 86&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter that provides a moderate water flow, ensuring good oxygenation without causing strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Polka Dot Loaches are omnivores; include high-quality sinking pellets or wafers in their diet. Supplement with live or frozen foods like bloodworms, brine shrimp, and small crustaceans.</li> <li>Offer a varied diet to meet their nutritional needs and promote natural behaviors.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Polka Dot Loaches are generally peaceful but can be territorial. Keep them in groups of at least three individuals.</li> <li>Choose tank mates that are peaceful and not aggressive, such as other loaches, peaceful barbs, and bottom-dwelling catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Polka Dot Loaches are active and social; they may display playful behavior. Avoid aggressive tank mates that may stress or harm them.</li> <li>Monitor their interactions to ensure compatibility and a harmonious tank environment.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:45:29+00:00"
      },
      {
            "id": 315,
            "name": "Dwarf Chain Loach (Ambastaia sidthimunki)",
            "type": "physical",
            "sku": "233",
            "description": "<h3>Our Guide To Keeping Dwarf Chain Loach Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Ambastaia sidthimunki</li> <li><strong>Common name</strong>: Dwarf Chain Loach</li> <li><strong>Family</strong>: Cobitidae</li> <li><strong>Origin</strong>: Southeast Asia, particularly Thailand and Cambodia</li> <li><strong>Adult length</strong>: 3 to 4 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Dwarf Chain Loaches prefer a well-planted aquarium with hiding spots and open swimming areas.</li> <li>Provide fine substrate like sand or smooth gravel to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water slightly acidic to neutral with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide gentle to moderate water flow with a filtration system suitable for the tank size.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Dwarf Chain Loaches are omnivores and will accept a variety of foods including high-quality flake or pellet food, frozen foods, and live foods like bloodworms and brine shrimp.</li> <li>Offer a varied diet to ensure they receive essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Dwarf Chain Loaches are peaceful community fish but may be shy if not kept in a group of at least six individuals.</li> <li>They are compatible with other small, peaceful fish such as tetras, rasboras, and dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Dwarf Chain Loaches are social fish and should be kept in groups to exhibit their natural behaviors.</li> <li>They are peaceful and suitable for community tanks, but avoid keeping them with aggressive or large species that may intimidate them.</li> </ul> </li> </ol>",
            "price": 7.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  38
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:45:32+00:00"
      },
      {
            "id": 316,
            "name": "Dwarf Gourami (Trichogaster fasciata)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Dwarf Gourami Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trichogaster fasciata</li> <li><strong>Common name</strong>: Dwarf Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: South Asia</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 4 to 6 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Dwarf Gouramis thrive in densely planted tanks with plenty of hiding spots. A minimum tank size of 75L is recommended for a single fish, but a larger tank is preferable for a community setup.</li> <li>Provide floating plants and decorations to create shaded areas in the tank.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5 for Dwarf Gouramis.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with gentle to moderate flow as Dwarf Gouramis prefer slow-moving water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Dwarf Gouramis are omnivores; include a variety of foods in their diet such as high-quality flakes, pellets, and live or frozen foods like brine shrimp and bloodworms.</li> <li>Ensure a balanced diet to promote their vibrant colors and overall health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Dwarf Gouramis are generally peaceful but may become territorial, especially during breeding. Keep them with other peaceful community fish such as tetras, rasboras, and other non-aggressive species.</li> <li>Avoid housing them with fin-nipping or aggressive fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Dwarf Gouramis exhibit interesting behaviors and may establish territories, especially during breeding.</li> <li>They can coexist with other community fish, but monitor their interactions and provide adequate hiding spaces.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:45:35+00:00"
      },
      {
            "id": 317,
            "name": "Red Robin Honey Gourami (Trichogaster chuna)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Red Robin Honey Gourami Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trichogaster chuna</li> <li><strong>Common name</strong>: Red Robin Honey Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: South Asia (India, Bangladesh)</li> <li><strong>Adult length</strong>: 5 to 6 cm</li> <li><strong>Lifespan</strong>: 4 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Robin Honey Gouramis prefer heavily planted tanks with plenty of hiding spots. Include floating plants like Indian Fern to diffuse lighting.</li> <li>Provide areas of still water as they enjoy slower currents.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system with minimal water flow is suitable.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality flakes, pellets, and live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> <li>Supplement their diet with vegetable matter like blanched spinach or cucumber slices.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Robin Honey Gouramis are peaceful and can be kept with other peaceful community fish like tetras, rasboras, and peaceful barbs.</li> <li>Avoid keeping them with aggressive or fin-nipping species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Robin Honey Gouramis are peaceful and can be kept in pairs or small groups.</li> <li>They are labyrinth fish and will occasionally come to the surface to breathe air.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 7,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:45:41+00:00"
      },
      {
            "id": 318,
            "name": "Black Paradise Fish (Macropodus spechti)",
            "type": "physical",
            "sku": "236",
            "description": "<h3>Our Guide To Keeping Black Paradise Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Macropodus spechti</li> <li><strong>Common name</strong>: Black Paradise Fish</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 6 to 7 cm</li> <li><strong>Lifespan</strong>: 4 to 6 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Paradise Fish prefer a well-planted tank with hiding spots and floating vegetation.</li> <li>Provide a tank size of at least 40 litres for a single fish or a larger tank for a small group.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable; use a filter with adjustable flow settings.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Black Paradise Fish are omnivores; feed them a varied diet of high-quality flakes, pellets, and live or frozen foods.</li> <li>Include occasional treats like brine shrimp, bloodworms, and daphnia to enhance their diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can coexist with peaceful community fish, but avoid aggressive or fin-nipping species.</li> <li>Compatible tank mates include tetras, rasboras, and other peaceful small to medium-sized fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Paradise Fish exhibit territorial behavior, especially during breeding. Provide hiding spots to reduce aggression.</li> <li>They are generally peaceful but may show aggression towards other male Black Paradise Fish.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:45:45+00:00"
      },
      {
            "id": 319,
            "name": "Sparkling Gourami (Trichopsis pumila)",
            "type": "physical",
            "sku": "116",
            "description": "<h3>Our Guide To Keeping Sparkling Gourami Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trichopsis pumila</li> <li><strong>Common name</strong>: Sparkling Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia, including Thailand, Malaysia, and Indonesia</li> <li><strong>Adult length</strong>: 3 cm</li> <li><strong>Lifespan</strong>: 3 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Sparkling Gouramis thrive in densely planted tanks with floating vegetation, simulating their natural habitat. A tank size of at least 20L is suitable for a small group.</li> <li>Provide hiding spots using driftwood, rocks, and plants like Java Moss and Water Sprite.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filter to provide a slow water flow, as Sparkling Gouramis prefer calm water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Sparkling Gouramis are omnivores; feed them a varied diet, including high-quality flakes, pellets, and live or frozen foods like brine shrimp and small insects.</li> <li>Offer small and frequent meals to mimic their natural feeding behavior.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Sparkling Gouramis are peaceful and should be kept in groups. They can coexist with other small, non-aggressive fish such as rasboras, small tetras, and peaceful dwarf shrimp.</li> <li>Avoid aggressive or fin-nipping tank mates that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Sparkling Gouramis are labyrinth fish and will occasionally gulp air from the water's surface. Provide access to the surface for this behavior.</li> <li>They may display vibrant colors and interesting behaviors when kept in a well-planted and appropriately decorated tank.</li> </ul> </li> </ol>",
            "price": 2,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-10T11:02:39+00:00",
            "date_created": "2023-10-26T07:45:48+00:00"
      },
      {
            "id": 320,
            "name": "Blue Paradise Fish (Macropodus opercularis)",
            "type": "physical",
            "sku": "237",
            "description": "<h3>Our Guide To Keeping Blue Paradise Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Macropodus opercularis</li> <li><strong>Common name</strong>: Blue Paradise Fish</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: East Asia, including China, Taiwan, Vietnam, and Laos</li> <li><strong>Adult length</strong>: 6 to 7.5 cm</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Blue Paradise Fish thrive in a well-planted aquarium with gentle water flow. A minimum tank size of 40L is suitable for a single fish.</li> <li>Provide hiding spots and floating plants to create a comfortable environment. They appreciate the presence of broad-leaved plants and floating vegetation.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Blue Paradise Fish prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish. Choose a filter that provides a mild to moderate flow, ensuring good water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blue Paradise Fish are carnivores and accept a variety of foods. Provide a diet consisting of high-quality pellets, flakes, and occasional live or frozen foods like brine shrimp and bloodworms.</li> <li>Ensure a varied diet to meet their nutritional needs and promote vibrant colors.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Blue Paradise Fish can be territorial, especially males. Keep them singly or in larger tanks with plenty of hiding places if kept with other fish.</li> <li>Compatible tank mates include peaceful community fish like tetras, rasboras, and other non-aggressive species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blue Paradise Fish are known for their territorial nature, especially during the breeding season. Males may display aggression towards each other.</li> <li>Exercise caution when keeping them with other territorial or fin-nipping species to avoid conflicts.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:45:50+00:00"
      },
      {
            "id": 321,
            "name": "Three Spot Gourami (Trichopodus trichopterus)",
            "type": "physical",
            "sku": "238",
            "description": "<h3>Our Guide To Keeping Three Spot Gourami</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trichopodus trichopterus</li> <li><strong>Common name</strong>: Three Spot Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: Up to 15 cm</li> <li><strong>Lifespan</strong>: 4 to 6 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Three Spot Gouramis prefer a well-planted aquarium with subdued lighting.</li> <li>Provide hiding spots with driftwood, rocks, and vegetation to create territories and reduce stress.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a temperature range of 22 to 28&deg;C (72 to 82&deg;F).</li> <li>Keep the pH between 6.0 and 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filter to avoid strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Three Spot Gouramis are omnivores and can be fed a varied diet including flakes, pellets, frozen foods, and live foods like bloodworms and brine shrimp.</li> <li>Offer a mix of plant matter, protein, and small invertebrates for a balanced diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and can be kept with other community fish such as tetras, rasboras, danios, and peaceful barbs.</li> <li>Avoid aggressive or fin-nipping species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Three Spot Gouramis are generally peaceful but can be territorial, especially during breeding.</li> <li>They may display aggression towards other gouramis, so it's best to keep them in larger tanks with plenty of hiding spots.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:45:58+00:00"
      },
      {
            "id": 322,
            "name": "Pearl Gourami (Trichopodus leerii) 6-7cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Pearl Gourami Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trichopodus leerii</li> <li><strong>Common name</strong>: Pearl Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia, including Malaysia, Thailand, and Indonesia</li> <li><strong>Adult length</strong>: 10 to 12 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Pearl Gouramis prefer a well-planted aquarium with floating vegetation to create shaded areas. A tank size of at least 75 litres is recommended.</li> <li>Include driftwood and rocks to provide hiding spots and simulate their natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Pearl Gouramis thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain a water temperature between 24 to 29&deg;C (75 to 84&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a gentle filtration system to avoid strong water currents, as Pearl Gouramis prefer calm or slow-flowing water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Pearl Gouramis are omnivores and enjoy a varied diet. Include high-quality flake or pellet food as well as live or frozen options like brine shrimp, bloodworms, and daphnia.</li> <li>Feed them multiple small meals throughout the day to mimic their natural feeding behavior.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Pearl Gouramis are generally peaceful and can be kept with other non-aggressive community fish such as tetras, rasboras, and other gourami species.</li> <li>Avoid aggressive or fin-nipping tank mates that may stress or harm them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Pearl Gouramis exhibit interesting behaviors, including bubble nest building by males. They can be kept in pairs or small groups.</li> <li>Provide floating plants for the males to build bubble nests, which is a part of their reproductive behavior.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 6,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-31T23:06:14+00:00",
            "date_created": "2023-10-26T07:46:01+00:00"
      },
      {
            "id": 323,
            "name": "Female Betta (Betta splendens)",
            "type": "physical",
            "sku": "240",
            "description": "<h3>Our Guide To Keeping Female Betta Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Betta splendens</li> <li><strong>Common name</strong>: Female Betta, Siamese Fighting Fish</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Female Bettas prefer a tank with plenty of hiding spots and minimal water flow. A minimum tank size of 5 gallons is recommended for a single Betta.</li> <li>Provide plants with broad leaves like Java Fern or Betta Bulbs for resting spots near the surface.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Female Bettas thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 27&deg;C (75 to 80&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with adjustable flow or baffles to reduce water flow as Betta Splendens prefer calm water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Female Bettas are carnivorous and prefer a diet high in protein. Offer them high-quality betta pellets or flakes as a staple.</li> <li>Occasionally supplement their diet with live or frozen foods like bloodworms, brine shrimp, or daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Female Bettas are solitary fish and may exhibit aggression towards other bettas, especially males. Avoid housing them with fin-nipping or aggressive fish.</li> <li>Consider tank mates like snails, ghost shrimp, or peaceful bottom-dwelling fish like Corydoras catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Female Bettas are known for their elaborate finnage and territorial behavior. Male Bettas should be housed alone to prevent aggression towards other fish.</li> <li>Female Bettas can sometimes be housed together in larger tanks with plenty of hiding spots, but monitor for signs of aggression.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  44
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:46:03+00:00"
      },
      {
            "id": 324,
            "name": "Albino Paradise Fish (Macropodus opercularis)",
            "type": "physical",
            "sku": "241",
            "description": "<h3>Our Guide To Keeping Albino Paradise Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Macropodus opercularis</li> <li><strong>Common name</strong>: Albino Paradise Fish</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: East Asia, including China, Taiwan, Vietnam, and Laos</li> <li><strong>Adult length</strong>: 6 to 7.5 cm</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Albino Paradise Fish thrive in a well-planted aquarium with gentle water flow. A minimum tank size of 40L is suitable for a single fish.</li> <li>Provide hiding spots and floating plants to create a comfortable environment. They appreciate the presence of broad-leaved plants and floating vegetation.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Albino Paradise Fish prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish. Choose a filter that provides a mild to moderate flow, ensuring good water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Albino Paradise Fish are carnivores and accept a variety of foods. Provide a diet consisting of high-quality pellets, flakes, and occasional live or frozen foods like brine shrimp and bloodworms.</li> <li>Ensure a varied diet to meet their nutritional needs and promote vibrant colors.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Albino Paradise Fish can be territorial, especially males. Keep them singly or in larger tanks with plenty of hiding places if kept with other fish.</li> <li>Compatible tank mates include peaceful community fish like tetras, rasboras, and other non-aggressive species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Albino Paradise Fish are known for their territorial nature, especially during the breeding season. Males may display aggression towards each other.</li> <li>Exercise caution when keeping them with other territorial or fin-nipping species to avoid conflicts.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:46:06+00:00"
      },
      {
            "id": 325,
            "name": "Chocolate Gourami (Sphaerichthys osphromenoides)",
            "type": "physical",
            "sku": "242",
            "description": "<h3>Our Guide To Keeping Chocolate Gourami Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Sphaerichthys osphromenoides</li> <li><strong>Common name</strong>: Chocolate Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia, specifically found in the peat swamp forests of Borneo and Sumatra</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Chocolate Gouramis require a heavily planted aquarium with dense vegetation and subdued lighting to mimic their natural habitat.</li> <li>They prefer soft, acidic water conditions, so adding driftwood and dried leaves (such as Indian almond leaves) can help achieve these conditions.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Chocolate Gouramis thrive in soft, acidic water with a pH range of 4.0 to 6.0.</li> <li>Maintain a water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for Chocolate Gouramis, so choose a filter that provides minimal disturbance to the water surface.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Chocolate Gouramis are carnivorous and prefer live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> <li>Offer them a variety of high-quality flake or pellet food as well to ensure a balanced diet.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Chocolate Gouramis are peaceful fish and should be kept with similarly sized, peaceful tank mates.</li> <li>They can be kept in a species-only tank or with other small, peaceful fish species such as small rasboras, tetras, and peaceful dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Chocolate Gouramis are shy and peaceful fish that prefer a calm environment.</li> <li>They may become stressed if housed with aggressive or boisterous tank mates, so choose tank mates carefully.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:46:12+00:00"
      },
      {
            "id": 326,
            "name": "Honey Gourami (Trichogaster chun)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Honey Gourami Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trichogaster chuna</li> <li><strong>Common name</strong>: Honey Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: South Asia (India, Bangladesh)</li> <li><strong>Adult length</strong>: 5 to 6 cm</li> <li><strong>Lifespan</strong>: 4 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Honey Gouramis prefer heavily planted tanks with plenty of hiding spots. Include floating plants like Indian Fern to diffuse lighting.</li> <li>Provide areas of still water as they enjoy slower currents.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water with a pH range of 6.0 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system with minimal water flow is suitable.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality flakes, pellets, and live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> <li>Supplement their diet with vegetable matter like blanched spinach or cucumber slices.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Honey Gouramis are peaceful and can be kept with other peaceful community fish like tetras, rasboras, and peaceful barbs.</li> <li>Avoid keeping them with aggressive or fin-nipping species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Honey Gouramis are peaceful and can be kept in pairs or small groups.</li> <li>They are labyrinth fish and will occasionally come to the surface to breathe air.</li> </ul> </li> </ol>",
            "price": 3.5,
            "sale_price": 0,
            "inventory_level": 15,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T19:37:53+00:00",
            "date_created": "2023-10-26T07:46:15+00:00"
      },
      {
            "id": 327,
            "name": "Red Crown Tail Betta (Betta splendens)",
            "type": "physical",
            "sku": "244",
            "description": "<h3>Our Guide To Keeping Red Crown Tail Betta Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Betta splendens</li> <li><strong>Common name</strong>: Red Crown Tail Betta, Siamese Fighting Fish</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Crown Tail Bettas prefer a tank with plenty of hiding spots and minimal water flow. A minimum tank size of 5 gallons is recommended for a single Betta.</li> <li>Provide plants with broad leaves like Java Fern or Betta Bulbs for resting spots near the surface.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Crown Tail Bettas thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 27&deg;C (75 to 80&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with adjustable flow or baffles to reduce water flow as Betta Splendens prefer calm water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Crown Tail Bettas are carnivorous and prefer a diet high in protein. Offer them high-quality betta pellets or flakes as a staple.</li> <li>Occasionally supplement their diet with live or frozen foods like bloodworms, brine shrimp, or daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Crown Tail Bettas are solitary fish and may exhibit aggression towards other bettas, especially males. Avoid housing them with fin-nipping or aggressive fish.</li> <li>Consider tank mates like snails, ghost shrimp, or peaceful bottom-dwelling fish like Corydoras catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Crown Tail Bettas are known for their elaborate finnage and territorial behavior. Male Bettas should be housed alone to prevent aggression towards other fish.</li> <li>Female Bettas can sometimes be housed together in larger tanks with plenty of hiding spots, but monitor for signs of aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 8,
            "is_visible": true,
            "categories": [
                  44
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-26T11:12:55+00:00",
            "date_created": "2023-10-26T07:46:20+00:00"
      },
      {
            "id": 328,
            "name": "Blue Crown Tail Betta (Betta splendens)",
            "type": "physical",
            "sku": "245",
            "description": "<h3>Our Guide To Keeping Blue Crown Tail Betta Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Betta splendens</li> <li><strong>Common name</strong>: Male Crown Tail Betta, Siamese Fighting Fish</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Blue Crown Tail Bettas prefer a tank with plenty of hiding spots and minimal water flow. A minimum tank size of 5 gallons is recommended for a single Betta.</li> <li>Provide plants with broad leaves like Java Fern or Betta Bulbs for resting spots near the surface.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Blue Crown Tail Bettas thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 27&deg;C (75 to 80&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with adjustable flow or baffles to reduce water flow as Betta Splendens prefer calm water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blue Crown Tail Bettas are carnivorous and prefer a diet high in protein. Offer them high-quality betta pellets or flakes as a staple.</li> <li>Occasionally supplement their diet with live or frozen foods like bloodworms, brine shrimp, or daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Blue Crown Tail Bettas are solitary fish and may exhibit aggression towards other bettas, especially males. Avoid housing them with fin-nipping or aggressive fish.</li> <li>Consider tank mates like snails, ghost shrimp, or peaceful bottom-dwelling fish like Corydoras catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blue Crown Tail Bettas are known for their elaborate finnage and territorial behavior. Male Bettas should be housed alone to prevent aggression towards other fish.</li> <li>Female Bettas can sometimes be housed together in larger tanks with plenty of hiding spots, but monitor for signs of aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 7,
            "is_visible": true,
            "categories": [
                  44
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-04T05:16:21+00:00",
            "date_created": "2023-10-26T07:46:23+00:00"
      },
      {
            "id": 329,
            "name": "Powder Blue Dwarf Gourami (Trichogaster fasciata)",
            "type": "physical",
            "sku": "246",
            "description": "<h3>Our Guide To Keeping Powder Blue Dwarf Gourami Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trichogaster fasciata</li> <li><strong>Common name</strong>: Powder Blue Dwarf Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: South Asia</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 4 to 6 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Powder Blue Dwarf Gouramis thrive in densely planted tanks with plenty of hiding spots. A minimum tank size of 75L is recommended for a single fish, but a larger tank is preferable for a community setup.</li> <li>Provide floating plants and decorations to create shaded areas in the tank.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5 for Dwarf Gouramis.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with gentle to moderate flow as Dwarf Gouramis prefer slow-moving water.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Powder Blue Dwarf Gouramis are omnivores; include a variety of foods in their diet such as high-quality flakes, pellets, and live or frozen foods like brine shrimp and bloodworms.</li> <li>Ensure a balanced diet to promote their vibrant colors and overall health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Powder Blue Dwarf Gouramis are generally peaceful but may become territorial, especially during breeding. Keep them with other peaceful community fish such as tetras, rasboras, and other non-aggressive species.</li> <li>Avoid housing them with fin-nipping or aggressive fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Powder Blue Dwarf Gouramis exhibit interesting behaviors and may establish territories, especially during breeding.</li> <li>They can coexist with other community fish, but monitor their interactions and provide adequate hiding spaces.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:46:28+00:00"
      },
      {
            "id": 330,
            "name": "Vaillant's Chocolate Gourami (Sphaerichthys vaillanti)",
            "type": "physical",
            "sku": "247",
            "description": "<h3>Our Guide To Keeping Vaillant's Chocolate Gourami Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Sphaerichthys vaillanti</li> <li><strong>Common name</strong>: Vaillant's Chocolate Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Vaillant's Chocolate Gouramis prefer a densely planted tank with subdued lighting to mimic their natural habitat. A minimum tank size of 40 litres is suitable for a small group of these fish.</li> <li>Include floating plants like Indian Fern and Java Moss to provide cover and create shaded areas in the tank.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>These gouramis thrive in soft, slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Opt for a gentle filtration system to maintain water quality without creating strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Vaillant's Chocolate Gouramis are omnivores and prefer small live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> <li>Offer them a varied diet including high-quality flake or pellet food supplemented with live or frozen foods to ensure proper nutrition.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>These gouramis are peaceful and should be kept in small groups of 3 to 5 individuals in a community tank.</li> <li>They are compatible with other small, peaceful fish species like rasboras, small tetras, and peaceful dwarf cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Vaillant's Chocolate Gouramis are shy and prefer peaceful tank mates. Avoid keeping them with larger or more aggressive fish that may intimidate them.</li> <li>Provide plenty of hiding spots and dense vegetation to help these fish feel secure and reduce stress.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:37+00:00",
            "date_created": "2023-10-26T07:46:31+00:00"
      },
      {
            "id": 331,
            "name": "Wild Caught Emerald Betta (Betta smaragdina)",
            "type": "physical",
            "sku": "248",
            "description": "<h3>Our Guide To Keeping Betta smaragdina Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Betta smaragdina</li> <li><strong>Common name</strong>: Emerald Betta</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia, specifically Thailand, Cambodia, and Vietnam</li> <li><strong>Adult length</strong>: 6 cm</li> <li><strong>Lifespan</strong>: 2 to 4 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Emerald Bettas prefer a tank with dense vegetation and hiding spots. A tank size of at least 20 litres is suitable for a single Betta.</li> <li>Include plants like Java moss, Anubias, and floating plants such as Indian Fern to create territories and resting places.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Emerald Bettas thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 24 to 28ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (75 to 82ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle filtration system is recommended to minimize water agitation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Emerald Bettas are carnivorous and prefer a diet of high-quality pellets or flakes specially formulated for Betta fish.</li> <li>Occasionally offer live or frozen foods like bloodworms and brine shrimp to supplement their diet and enhance coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Emerald Bettas are solitary and territorial, so they are best kept alone in their tank.</li> <li>Avoid placing them with fin-nipping or aggressive fish that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Emerald Bettas are known for their vibrant colors and territorial behavior, especially among males.</li> <li>Keep them in a quiet environment to reduce stress and promote their natural behaviors.</li> </ul> </li> </ul> </li> </ol>",
            "price": 10,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  44
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:46:34+00:00"
      },
      {
            "id": 332,
            "name": "Croaking Gourami (Trichopsis vittata)",
            "type": "physical",
            "sku": "249",
            "description": "<h3>Our Guide To Keeping Croaking Gourami</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Trichopsis vittata</li> <li><strong>Common name</strong>: Croaking Gourami</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: Southeast Asia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Croaking Gouramis thrive in a well-planted aquarium with subdued lighting. A tank size of at least 40L is suitable for a small group of these fish.</li> <li>Provide hiding spots using plants, driftwood, and caves to create a secure environment, as these fish appreciate areas with cover.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Croaking Gouramis prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for Croaking Gouramis, so choose a filter that provides a mild to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Croaking Gouramis are omnivores, and they can be fed a varied diet. Offer them high-quality flake or pellet food as a primary diet.</li> <li>Include live or frozen foods such as brine shrimp, daphnia, and small insects to enhance their nutritional intake.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Croaking Gouramis are generally peaceful and can be kept in pairs or small groups. Avoid housing them with aggressive or fin-nipping species.</li> <li>They are compatible with other peaceful community fish like rasboras, small tetras, and non-aggressive bottom dwellers.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Croaking Gouramis are known for their unique croaking sound produced by grinding their pharyngeal teeth. They are generally peaceful but may display territorial behavior, especially during breeding.</li> <li>Keep them away from aggressive tank mates to ensure their well-being and prevent stress.</li> </ul> </li> </ol>",
            "price": 3,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-03T14:46:41+00:00",
            "date_created": "2023-10-26T07:46:36+00:00"
      },
      {
            "id": 333,
            "name": "Roundtail Paradise Fish (Macropodus ocellatus)",
            "type": "physical",
            "sku": "250",
            "description": "<h3>Our Guide To Keeping Roundtail Paradise Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Macropodus opercularis</li> <li><strong>Common name</strong>: Roundtail Paradise Fish</li> <li><strong>Family</strong>: Osphronemidae</li> <li><strong>Origin</strong>: East Asia, including China, Taiwan, Vietnam, and Laos</li> <li><strong>Adult length</strong>: 6 to 7.5 cm</li> <li><strong>Lifespan</strong>: 5 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Roundtail Paradise Fish thrive in a well-planted aquarium with gentle water flow. A minimum tank size of 40L is suitable for a single fish.</li> <li>Provide hiding spots and floating plants to create a comfortable environment. They appreciate the presence of broad-leaved plants and floating vegetation.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Roundtail Paradise Fish prefer slightly acidic to neutral water conditions with a pH range of 6.0 to 7.5.</li> <li>Maintain the water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle water flow is suitable for these fish. Choose a filter that provides a mild to moderate flow, ensuring good water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Roundtail Paradise Fish are carnivores and accept a variety of foods. Provide a diet consisting of high-quality pellets, flakes, and occasional live or frozen foods like brine shrimp and bloodworms.</li> <li>Ensure a varied diet to meet their nutritional needs and promote vibrant colors.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Roundtail Paradise Fish can be territorial, especially males. Keep them singly or in larger tanks with plenty of hiding places if kept with other fish.</li> <li>Compatible tank mates include peaceful community fish like tetras, rasboras, and other non-aggressive species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Roundtail Paradise Fish are known for their territorial nature, especially during the breeding season. Males may display aggression towards each other.</li> <li>Exercise caution when keeping them with other territorial or fin-nipping species to avoid conflicts.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  39
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:46:41+00:00"
      },
      {
            "id": 334,
            "name": "Red Comet Goldfish (Carassius auratus)",
            "type": "physical",
            "sku": "251",
            "description": "<h3>Our Guide To Keeping Red Comet Goldfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Carassius auratus</li> <li><strong>Common name</strong>: Red Comet Goldfish</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Developed in the United States (descended from Common Goldfish)</li> <li><strong>Adult length</strong>: 15 to 30 cm</li> <li><strong>Lifespan</strong>: 10 to 20 years (some live even longer with proper care)</li> <li><strong>Diet</strong>: Omnivore</li> <li><strong>Care Level</strong>: Easy</li> <li><strong>Temperament</strong>: Peaceful and energetic</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Comet Goldfish require ample swimming space. Provide a minimum of 100L per fish in an aquarium or house them in large outdoor ponds.</li> <li>Use smooth gravel and sturdy, cold-water-tolerant plants like Anubias or Elodea. Ensure plenty of open areas for swimming.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH between 6.5 and 7.5.</li> <li>Ideal water temperature is 16 to 24&deg;C (60 to 75&deg;F). They are cold-hardy and thrive in outdoor environments.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a reliable filter to manage their waste and maintain clean, oxygenated water.</li> <li>Moderate water movement is best, supported by good aeration through air stones or surface agitation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Provide a staple diet of high-quality goldfish pellets or flakes.</li> <li>Enhance their diet with blanched vegetables (peas, spinach), live or frozen foods (bloodworms, brine shrimp), and the occasional fruit slice.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Comets are peaceful and do well with other single-tail goldfish such as commons, other comets, and shubunkins.</li> <li>Avoid mixing them with slow-moving fancy goldfish or tropical fish with different temperature needs.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Comet Goldfish are active, fast swimmers that enjoy open space and companionship. Their striking red coloration adds vibrancy to ponds and tanks alike.</li> <li>They thrive in groups and are known for their hardy, low-maintenance nature&mdash;ideal for beginners and experienced keepers alike.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 20,
            "is_visible": true,
            "categories": [
                  77,
                  241
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-09T12:20:28+00:00",
            "date_created": "2023-10-26T07:46:44+00:00"
      },
      {
            "id": 335,
            "name": "Canary Yellow Comet Goldfish (Carassius auratus) 3\"",
            "type": "physical",
            "sku": "253",
            "description": "<h3>Our Guide To Keeping Canary Yellow Comet Goldfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Carassius auratus</li> <li><strong>Common name</strong>: Canary Yellow Comet Goldfish</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Bred from Common Goldfish, originally native to East Asia</li> <li><strong>Adult length</strong>: 15 to 30 cm</li> <li><strong>Lifespan</strong>: 10 to 20 years (can exceed 20 years with excellent care)</li> <li><strong>Diet</strong>: Omnivore</li> <li><strong>Care Level</strong>: Easy</li> <li><strong>Temperament</strong>: Peaceful and active</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Canary Yellow Comets need a spacious aquarium (minimum 100L per fish) or outdoor pond to accommodate their energetic swimming behavior.</li> <li>Decorate with smooth gravel, driftwood, and hardy aquatic plants such as Anubias or Hornwort that can tolerate cooler water conditions.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH between 6.5 and 7.5.</li> <li>Preferred water temperature is 16 to 24&deg;C (60 to 75&deg;F). They can tolerate cooler temperatures and are suitable for outdoor ponds.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a reliable filter to manage their moderate waste production and keep water clean.</li> <li>Moderate water flow is best, with surface agitation or air stones for adequate oxygenation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Feed high-quality goldfish flakes or pellets as the main diet.</li> <li>Supplement with vegetables (peas, spinach), live or frozen foods (bloodworms, brine shrimp), and occasional fruits (such as orange slices).</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Best kept with other single-tail goldfish such as common, comet, and shubunkin goldfish.</li> <li>Avoid slow fancy goldfish or tropical species that require different environmental conditions.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Canary Yellow Comets are lively, sociable, and graceful swimmers that thrive in groups. Their bright yellow coloration adds vivid contrast to any pond or tank.</li> <li>They are peaceful and do not exhibit aggressive behavior, making them excellent community pond fish.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 15,
            "is_visible": true,
            "categories": [
                  77,
                  241
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-07T13:08:04+00:00",
            "date_created": "2023-10-26T07:46:47+00:00"
      },
      {
            "id": 336,
            "name": "Sarasa Comet Goldfish (Carassius auratus) 3\"",
            "type": "physical",
            "sku": "252",
            "description": "<h3>Our Guide To Keeping Sarasa Comet Goldfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Carassius auratus</li> <li><strong>Common name</strong>: Sarasa Comet Goldfish</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Japan (descended from Common Goldfish)</li> <li><strong>Adult length</strong>: 15 to 30 cm</li> <li><strong>Lifespan</strong>: 10 to 20 years (can live longer with excellent care)</li> <li><strong>Diet</strong>: Omnivore</li> <li><strong>Care Level</strong>: Easy</li> <li><strong>Temperament</strong>: Peaceful and active</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Sarasa Comets require ample swimming space. A minimum of 100L per fish in an aquarium is ideal, or they can be housed in large outdoor ponds.</li> <li>Decorate with smooth substrates and hardy aquatic plants like Anubias or Hornwort. They are known to uproot delicate plants while foraging.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH between 6.5 and 7.5.</li> <li>Preferred temperature range is 16 to 24&deg;C (60 to 75&deg;F). They are cold-hardy and ideal for outdoor environments in temperate climates.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a good-quality filter suitable for goldfish, as they produce significant waste.</li> <li>Moderate water movement is recommended, with good surface agitation to ensure oxygenation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Provide a staple diet of high-quality goldfish flakes or pellets.</li> <li>Supplement with blanched vegetables (peas, spinach), live or frozen foods (bloodworms, daphnia), and occasional fruit like orange slices.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Compatible with other single-tail goldfish varieties such as common and comet goldfish.</li> <li>Avoid mixing with slow-moving fancy goldfish or tropical species due to different temperature and care requirements.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Sarasa Comet Goldfish are fast, energetic swimmers with a peaceful temperament. Their vibrant red and white coloration makes them a standout in ponds and tanks.</li> <li>They are social and thrive in groups, showing playful behavior and active foraging throughout the day.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 27,
            "is_visible": true,
            "categories": [
                  77,
                  241
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-31T14:56:46+00:00",
            "date_created": "2023-10-26T07:46:50+00:00"
      },
      {
            "id": 337,
            "name": "Black Comet Goldfish (Carassius auratus) 3\"",
            "type": "physical",
            "sku": "254",
            "description": "<h3>Our Guide To Keeping Black Comet Goldfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Carassius auratus</li> <li><strong>Common name</strong>: Black Comet Goldfish</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Bred from the Common Goldfish, originally native to East Asia</li> <li><strong>Adult length</strong>: 15 to 30 cm</li> <li><strong>Lifespan</strong>: 10 to 20 years (can exceed 20 with proper care)</li> <li><strong>Diet</strong>: Omnivore</li> <li><strong>Care Level</strong>: Easy</li> <li><strong>Temperament</strong>: Peaceful and active</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Comet Goldfish need spacious environments. A minimum of 100L per fish is recommended in an aquarium, or they can be kept in outdoor ponds.</li> <li>They appreciate open swimming areas, smooth decorations, and hardy plants such as Anubias or Hornwort that can tolerate cool water.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH between 6.5 and 7.5.</li> <li>Optimal temperature range is 16 to 24&deg;C (60 to 75&deg;F). They are cold-tolerant and suitable for temperate outdoor ponds.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a good-quality filter to manage waste and maintain clean water, as goldfish produce a moderate bioload.</li> <li>Moderate water flow is ideal, with adequate oxygenation provided by surface agitation or air stones.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Feed high-quality goldfish flakes or pellets as a staple diet.</li> <li>Supplement with vegetables (blanched peas, spinach), live or frozen foods (bloodworms, daphnia), and occasional fruit treats.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Black Comets are peaceful and do well with other single-tail goldfish varieties like common or comet goldfish.</li> <li>Avoid slow-moving fancy goldfish and tropical species with incompatible care needs.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Comet Goldfish are lively, fast swimmers that enjoy open space and social interaction with their own kind.</li> <li>They are non-aggressive and thrive in groups, making them a great addition to peaceful community ponds or aquariums.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  77,
                  241
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-09T12:19:43+00:00",
            "date_created": "2023-10-26T07:46:55+00:00"
      },
      {
            "id": 338,
            "name": "Black Moor Goldfish (Carassius auratus)",
            "type": "physical",
            "sku": "255",
            "description": "<h3>Our Guide To Keeping Black Moor Goldfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Carassius auratus</li> <li><strong>Common name</strong>: Black Moor Goldfish</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Selectively bred from the common goldfish, native to East Asia</li> <li><strong>Adult length</strong>: Up to 15 cm, but commonly around 10-12 cm in captivity</li> <li><strong>Lifespan</strong>: 10 to 15 years, with proper care can live longer</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Black Moor Goldfish require a spacious tank with at least 40 litres per fish to thrive.</li> <li>Provide ample swimming space and consider the potential adult size when selecting the tank.</li> <li>Include soft plants and smooth decorations to prevent damage to their delicate fins and eyes.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water temperature between 18 to 22ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (64 to 72ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> <li>They tolerate a pH range of 6.0 to 8.0, but stability is crucial for their health.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter with a low to moderate flow rate to avoid stressing the fish.</li> <li>Regular water changes are essential to keep ammonia and nitrate levels low.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Black Moor Goldfish are omnivores and should be fed a varied diet including high-quality flakes, pellets, and fresh vegetables like peas and blanched spinach.</li> <li>Occasional treats of live or frozen foods such as bloodworms and brine shrimp can be offered for enrichment.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and do well with other fancy goldfish varieties such as Orandas, Ryukins, and telescopes.</li> <li>Avoid keeping them with more active or fin-nipping species that may stress or harm them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Black Moor Goldfish are gentle and slow-moving, preferring a calm environment.</li> <li>Provide them with gentle filtration and avoid strong currents that could affect their swimming ability.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  62
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:46:58+00:00"
      },
      {
            "id": 339,
            "name": "Calico Fantail Goldfish (Carassius auratus)",
            "type": "physical",
            "sku": "256",
            "description": "<h3>Our Guide To Keeping Calico Fantail Goldfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Carassius auratus</li> <li><strong>Common name</strong>: Calico Fantail Goldfish</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Selectively bred from the common goldfish, native to East Asia</li> <li><strong>Adult length</strong>: Up to 15 cm, but commonly around 10-12 cm in captivity</li> <li><strong>Lifespan</strong>: 10 to 15 years, with proper care can live longer</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Calico Fantail Goldfish require a spacious tank with at least 40 litres per fish to thrive.</li> <li>Provide ample swimming space and consider the potential adult size when selecting the tank.</li> <li>Include soft plants and smooth decorations to prevent damage to their delicate fins.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water temperature between 18 to 22ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (64 to 72ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> <li>They tolerate a pH range of 6.0 to 8.0, but stability is crucial for their health.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter with a low to moderate flow rate to avoid stressing the fish.</li> <li>Regular water changes are essential to keep ammonia and nitrate levels low.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Calico Fantail Goldfish are omnivores and should be fed a varied diet including high-quality flakes, pellets, and fresh vegetables like peas and blanched spinach.</li> <li>Occasional treats of live or frozen foods such as bloodworms and brine shrimp can be offered for enrichment.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and do well with other fancy goldfish varieties such as Orandas, Ryukins, and telescopes.</li> <li>Avoid keeping them with more active or fin-nipping species that may stress or harm them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Calico Fantail Goldfish are known for their graceful swimming and attractive color patterns.</li> <li>Provide them with gentle filtration and a calm environment to thrive and display their natural behaviors.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  62
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:47:00+00:00"
      },
      {
            "id": 340,
            "name": "Assorted Oranda Goldfish (Carassius auratus) 7-8cm",
            "type": "physical",
            "sku": "257",
            "description": "<h3>Our Guide To Keeping Oranda Goldfish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Carassius auratus</li> <li><strong>Common name</strong>: Oranda Goldfish</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Selectively bred from the common goldfish, native to East Asia</li> <li><strong>Adult length</strong>: Up to 20-31 cm, but commonly around 15-20 cm in captivity</li> <li><strong>Lifespan</strong>: 10 to 15 years, with proper care can live longer</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Oranda Goldfish require a spacious tank with at least 75 litres per fish to thrive.</li> <li>Provide ample swimming space and consider the potential adult size when selecting the tank.</li> <li>Include soft plants and smooth decorations to prevent damage to their delicate fins and wen (head growth).</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water temperature between 18 to 22ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°C (64 to 72ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€Â ÃƒÂ¢Ã¢Â‚Â¬Ã¢Â„Â¢ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ¢Â€Â¦ÃƒÂ‚Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ…Ã‚Â¡ÃƒÂƒÃ†Â’ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡Â°F).</li> <li>They tolerate a pH range of 6.5 to 7.5, but stability is crucial for their health.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a filter with a low to moderate flow rate to avoid stressing the fish.</li> <li>Orandas are messy eaters and produce more waste, so efficient filtration and regular water changes are crucial.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Oranda Goldfish are omnivores and should be fed a varied diet including high-quality flakes, pellets, and fresh vegetables like peas and blanched spinach.</li> <li>Supplement their diet with occasional treats of live or frozen foods such as bloodworms, brine shrimp, and daphnia to promote optimal health and coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Orandas are generally peaceful but avoid keeping them with species that may nip their long fins or compete aggressively for food.</li> <li>They do well with other fancy goldfish varieties like Ryukins, Ranchus, and telescopes.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Orandas are active and curious fish that appreciate a well-decorated tank with places to explore.</li> <li>Provide them with a calm environment to thrive and showcase their distinctive appearance and behaviors.</li> </ul> </li> </ol>",
            "price": 10,
            "sale_price": 0,
            "inventory_level": 18,
            "is_visible": true,
            "categories": [
                  62
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-02T18:33:58+00:00",
            "date_created": "2023-10-26T07:47:03+00:00"
      },
      {
            "id": 341,
            "name": "Gudgeon (Gobio gobio)",
            "type": "physical",
            "sku": "258",
            "description": "<h3>Our Guide To Keeping Gudgeon Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Gobio gobio</li> <li><strong>Common name</strong>: Gudgeon</li> <li><strong>Family</strong>: Gobionidae</li> <li><strong>Origin</strong>: Various freshwater habitats in Europe and Asia</li> <li><strong>Adult length</strong>: Up to 15 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Gudgeons prefer a well-aerated tank with moderate water flow. A minimum tank size of 80L is suitable for a small group of these fish.</li> <li>Provide hiding spots with rocks, driftwood, and artificial caves to create a comfortable environment resembling their natural habitat.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Gudgeons thrive in cool to slightly warm water conditions with a temperature range of 10 to 20&deg;C (50 to 68&deg;F).</li> <li>Maintain a neutral to slightly alkaline pH level between 7.0 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter that provides gentle to moderate water flow, ensuring proper oxygenation and water quality.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Gudgeons are opportunistic feeders and accept a varied diet. Offer them high-quality sinking pellets or granules as a staple, supplemented with live or frozen foods like brine shrimp, bloodworms, and daphnia.</li> <li>Feed them small amounts multiple times a day to accommodate their feeding habits in the wild.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Gudgeons are peaceful community fish, and they should be kept in groups of at least five individuals for social interactions.</li> <li>Compatible tank mates include other peaceful species like small tetras, rasboras, and non-aggressive bottom dwellers.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Gudgeons are bottom-dwelling fish and may display territorial behavior, so provide adequate hiding spots to reduce aggression.</li> <li>Avoid keeping them with larger or aggressive fish that may intimidate or outcompete them for food.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  36
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:47:08+00:00"
      },
      {
            "id": 342,
            "name": "Rainbow Shiner (Notropis chrosomus)",
            "type": "physical",
            "sku": "259",
            "description": "<h3>Our Guide To Keeping Rainbow Shiner Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Notropis chrosomus</li> <li><strong>Common name</strong>: Rainbow Shiner</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: Eastern United States</li> <li><strong>Adult length</strong>: 5 to 8 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rainbow Shiners require a tank with ample swimming space and a well-oxygenated environment. A tank size of at least 75L is recommended for a small group of these fish.</li> <li>Decorate the tank with smooth gravel substrate and provide plenty of hiding places among rocks, driftwood, and artificial plants.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Rainbow Shiners thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Maintain the water temperature between 18 to 24&deg;C (65 to 75&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Ensure efficient filtration to maintain water quality, and provide gentle to moderate water flow to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rainbow Shiners are omnivores and will readily accept a varied diet. Offer them high-quality flake or pellet food supplemented with live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> <li>Feed them multiple small meals throughout the day to accommodate their high metabolism.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Rainbow Shiners are peaceful and sociable fish that thrive in the company of their own species and other small, peaceful community fish.</li> <li>They can be kept with other similarly sized fish such as tetras, rasboras, danios, and small catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rainbow Shiners are active and playful swimmers, especially in a group setting.</li> <li>They should not be housed with aggressive or territorial fish species that may stress or bully them.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:47:11+00:00"
      },
      {
            "id": 343,
            "name": "Male Red Shiner (Cyprinella lutrensis)",
            "type": "physical",
            "sku": "260",
            "description": "<h3>Our Guide To Keeping Red Shiner Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Cyprinella lutrensis</li> <li><strong>Common name</strong>: Red Shiner</li> <li><strong>Family</strong>: Cyprinidae</li> <li><strong>Origin</strong>: North America</li> <li><strong>Adult length</strong>: 5 to 7 cm</li> <li><strong>Lifespan</strong>: 3 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Shiners are active swimmers, so provide a tank with plenty of open swimming space. A minimum tank size of 75L is recommended for a small group.</li> <li>Include rocks, driftwood, and artificial plants to create hiding spots and mimic their natural environment. They appreciate a substrate with a mix of fine sand and gravel.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH range of 6.5 to 7.5 and a temperature between 18 to 24&deg;C (64 to 75&deg;F).</li> <li>Provide good filtration to keep the water clean and well-oxygenated.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Red Shiners prefer a gentle water flow, so choose a filter that provides mild to moderate circulation.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Shiners are omnivores and will accept a varied diet. Offer them high-quality flake or pellet food as a primary diet, supplemented with live or frozen foods like brine shrimp, bloodworms, and daphnia.</li> <li>Feed them in small portions multiple times a day to mimic their natural feeding behavior.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Shiners are peaceful community fish and can be kept with other non-aggressive species that share similar water parameter requirements.</li> <li>They are compatible with other small and peaceful fish such as danios, tetras, and rasboras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Shiners exhibit schooling behavior, so it's advisable to keep them in groups of at least six individuals to promote natural behavior and reduce stress.</li> <li>Avoid housing them with larger or aggressive species that may intimidate or prey on them.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  46
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:47:14+00:00"
      },
      {
            "id": 344,
            "name": "German Ram Dwarf Cichlid (Mikrogeophagus ramirezi)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping German Ram Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Mikrogeophagus ramirezi</li> <li><strong>Common name</strong>: German Ram Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Orinoco River basin in Venezuela and Colombia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>German Ram Dwarf Cichlids prefer a tank with plenty of hiding places and subdued lighting. A tank size of at least 75 litres is recommended.</li> <li>Provide sandy substrate and include driftwood, rocks, and caves as hiding spots.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>German Ram Dwarf Cichlids thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with gentle to moderate flow as German Ram Dwarf Cichlids prefer calmer waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>German Ram Dwarf Cichlids are omnivores and accept a variety of foods. Offer them a balanced diet of high-quality flakes, pellets, and live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>German Ram Dwarf Cichlids are peaceful fish but can be territorial during breeding. They are best kept with other peaceful fish such as tetras, rasboras, and small catfish species.</li> <li>Avoid keeping them with aggressive or fin-nipping species that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>German Ram Dwarf Cichlids are relatively peaceful but can become territorial when breeding. They form monogamous pairs and may become aggressive towards other fish during spawning.</li> <li>Provide plenty of hiding places to reduce aggression and monitor their behavior closely during breeding periods.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 15,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-09T12:07:41+00:00",
            "date_created": "2023-10-26T07:47:17+00:00"
      },
      {
            "id": 345,
            "name": "Rainbow Cichlid (Herotilapia multispinosa) 5cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Rainbow Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Herotilapia multispinosa</li> <li><strong>Common name</strong>: Rainbow Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America, specifically Honduras, Nicaragua, and Costa Rica</li> <li><strong>Adult length</strong>: 10 to 15 cm (4 to 6 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Rainbow Cichlids thrive in tanks with ample swimming space. A minimum tank size of 75 gallons is recommended for a pair or small group.</li> <li>Provide hiding spots using rocks, driftwood, or artificial caves. They appreciate a sandy substrate with some smooth rocks and plants.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Rainbow Cichlids prefer slightly alkaline water with a pH range of 7.0 to 8.0.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A powerful filtration system is essential to maintain water quality, as Rainbow Cichlids are messy eaters and produce a significant amount of waste.</li> <li>Provide moderate water flow, but avoid strong currents that may stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Rainbow Cichlids are omnivores and require a varied diet.</li> <li>Offer them high-quality cichlid pellets or flakes as a staple diet.</li> <li>Supplement their diet with occasional live or frozen foods like bloodworms, brine shrimp, and chopped vegetables.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Rainbow Cichlids can be territorial, especially during breeding, so choose tank mates carefully.</li> <li>Compatible tank mates include other medium-sized peaceful cichlids and robust community fish like larger tetras, barbs, and catfish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Rainbow Cichlids are generally peaceful but can become aggressive during breeding or when defending their territory.</li> <li>Provide plenty of hiding places and territories to reduce aggression.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-07T13:42:47+00:00",
            "date_created": "2023-10-26T07:47:23+00:00"
      },
      {
            "id": 346,
            "name": "Bolivian Ram Dwarf Cichlid (Mikrogeophagus altispinosus)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Bolivian Ram Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Mikrogeophagus altispinosus</li> <li><strong>Common name</strong>: Bolivian Ram Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America, specifically Bolivia and Brazil</li> <li><strong>Adult length</strong>: 6 to 8 cm</li> <li><strong>Lifespan</strong>: 4 to 5 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Bolivian Ram Dwarf Cichlids prefer a tank with fine substrate and plenty of hiding places such as caves, rocks, and driftwood.</li> <li>They also appreciate areas with dense vegetation, so consider adding plants like Java Fern, Amazon Sword, and Anubias.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Keep the pH level around 6.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide moderate filtration and water flow in the tank.</li> <li>Consider using a filter that won't create strong currents.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Bolivian Ram Dwarf Cichlids are omnivores and accept a variety of foods including high-quality flakes, pellets, and live or frozen foods like bloodworms, brine shrimp, and daphnia.</li> <li>Offer a balanced diet to ensure their nutritional needs are met.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are peaceful and can be kept with other peaceful fish species such as tetras, rasboras, peaceful barbs, and other small South American cichlids.</li> <li>Avoid keeping them with aggressive or large species that may intimidate them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Bolivian Ram Dwarf Cichlids are generally peaceful but can be territorial, especially during breeding.</li> <li>They may form pairs and exhibit breeding behaviors, so provide suitable tank conditions if breeding is desired.</li> </ul> </li> </ol>",
            "price": 5.5,
            "sale_price": 0,
            "inventory_level": 8,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-04T16:12:45+00:00",
            "date_created": "2023-10-26T07:47:28+00:00"
      },
      {
            "id": 347,
            "name": "Keyhole Cichlid (Cleithracara maronii) 3-4cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Keyhole Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Cleithracara maronii</li> <li><strong>Common name</strong>: Keyhole Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America (Amazon River basin)</li> <li><strong>Adult length</strong>: 10 cm (4 inches)</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Keyhole Cichlids prefer a tank with plenty of hiding spots like caves, driftwood, and plants. A tank size of at least 75 gallons is recommended.</li> <li>They appreciate a substrate of fine sand and prefer subdued lighting.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keyhole Cichlids thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 26&deg;C (75 to 79&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A gentle to moderate water flow is suitable for Keyhole Cichlids, so choose a filter that provides this.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Keyhole Cichlids are omnivores and accept a variety of foods including high-quality pellets, flakes, and live or frozen foods like bloodworms and brine shrimp.</li> <li>Offer them a varied diet to ensure their nutritional needs are met.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Keyhole Cichlids are peaceful community fish and can be kept with other peaceful species like tetras, rasboras, and other cichlids of similar size and temperament.</li> <li>Avoid keeping them with aggressive or overly territorial fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Keyhole Cichlids are relatively peaceful and can be kept in community tanks.</li> <li>They may display some territorial behavior, especially during breeding, but are generally well-behaved.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 6,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-22T08:41:55+00:00",
            "date_created": "2023-10-26T07:47:31+00:00"
      },
      {
            "id": 348,
            "name": "Flowerhorn Cichlid (Hybrid)",
            "type": "physical",
            "sku": "265",
            "description": "<h3>Our Guide To Keeping Flowerhorn Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Amphilophus labiatus, Amphilophus trimaculatum, hybrid blood parrot cichlid</li> <li><strong>Common name</strong>: Flowerhorn Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America (thought to be a hybrid)</li> <li><strong>Adult length</strong>: Up to 30 cm (12 inches)</li> <li><strong>Lifespan</strong>: 10 to 12 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Flowerhorn Cichlids require a spacious tank with plenty of hiding spots and territories. A minimum tank size of 200L is recommended for a single fish.</li> <li>Provide caves, rocks, and driftwood for shelter and to establish territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Flowerhorn Cichlids prefer slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 26 to 30&deg;C (79 to 86&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Efficient filtration is essential to maintain water quality as Flowerhorn Cichlids are messy eaters. A powerful filter with adequate biological and mechanical filtration is recommended.</li> <li>Provide moderate water flow, but avoid strong currents that may stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Flowerhorn Cichlids are omnivorous and have a hearty appetite. Offer them a varied diet consisting of high-quality pellets, flakes, and occasional live or frozen foods like bloodworms, brine shrimp, and small feeder fish.</li> <li>Ensure a balanced diet to promote vibrant coloration and overall health.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Flowerhorn Cichlids are territorial and aggressive towards other fish, especially during breeding or when establishing territories.</li> <li>It's best to keep them alone in the tank or with larger, robust fish that can hold their own against the Flowerhorn's aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Flowerhorn Cichlids are known for their unique personalities and can exhibit aggressive behavior, especially towards tank mates or intruders in their territory.</li> <li>Monitor their behavior closely and be prepared to provide adequate space and hiding spots to minimize aggression.</li> </ul> </li> </ol>",
            "price": 15,
            "sale_price": 0,
            "inventory_level": 4,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-25T04:41:21+00:00",
            "date_created": "2023-10-26T07:47:36+00:00"
      },
      {
            "id": 349,
            "name": "T-Bar Cichlid (Amatitlania sajica) 4-5cm",
            "type": "physical",
            "sku": "266",
            "description": "<h3>Our Guide To Keeping T-Bar Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Amatitlania sajica</li> <li><strong>Common name</strong>: T-Bar Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America, particularly Costa Rica and Nicaragua</li> <li><strong>Adult length</strong>: Approximately 10 cm (4 inches)</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>T-Bar Cichlids appreciate a tank with plenty of hiding spots such as caves, driftwood, and plants like Anubias and Java Fern.</li> <li>Provide a sandy substrate to mimic their natural habitat and consider adding rocks to create territories within the tank.</li> <li>A minimum tank size of 75 gallons is recommended for a pair of T-Bar Cichlids.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water conditions with a pH range of 6.5 to 7.5.</li> <li>Water temperature should be kept between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Ensure good water quality with regular water changes and proper filtration.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Provide efficient filtration to maintain water quality, but avoid strong water flow that may stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>T-Bar Cichlids are omnivores and will accept a variety of foods including high-quality cichlid pellets, flakes, and live or frozen foods like bloodworms, brine shrimp, and chopped earthworms.</li> <li>Offer a balanced diet to ensure their nutritional needs are met and supplement occasionally with fresh vegetables like blanched zucchini or cucumber.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Compatible tank mates include other peaceful cichlid species of similar size, such as other Central American cichlids like Convict Cichlids or Firemouth Cichlids.</li> <li>Avoid keeping them with aggressive or territorial fish that may lead to conflicts.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>T-Bar Cichlids are generally peaceful but can become territorial, especially during breeding.</li> <li>They may exhibit aggression towards conspecifics or other tank mates if not provided with enough space and hiding spots.</li> <li>Monitor their behavior closely and provide adequate tank size and decor to minimize aggression.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 1,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-01T14:10:49+00:00",
            "date_created": "2023-10-26T07:47:41+00:00"
      },
      {
            "id": 350,
            "name": "Salvini Cichlid (Cichlasoma tenue)",
            "type": "physical",
            "sku": "267",
            "description": "<h3>Our Guide To Keeping Salvini Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Cichlasoma tenue</li> <li><strong>Common name</strong>: Salvini Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America (Mexico, Guatemala)</li> <li><strong>Adult length</strong>: Up to 15 cm (6 inches)</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Salvini Cichlids require a tank of at least 75 gallons to provide ample swimming space.</li> <li>Decorate the tank with rocks, driftwood, and caves to create hiding spots and territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Maintain a pH level between 6.5 to 7.5.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A powerful filtration system is necessary to handle the waste produced by Salvini Cichlids.</li> <li>Provide moderate water flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Salvini Cichlids are omnivores and should be fed a varied diet including high-quality pellets, flakes, and live or frozen foods such as bloodworms, brine shrimp, and small crustaceans.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Salvini Cichlids can be territorial and aggressive, especially during breeding. Compatible tank mates include robust cichlid species and large, fast-swimming fish.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Salvini Cichlids are known for their vibrant colors and territorial behavior. They may become aggressive when defending their territory or breeding.</li> <li>Avoid keeping them with small or timid fish that may be intimidated by their behavior.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:47:44+00:00"
      },
      {
            "id": 351,
            "name": "Electric Blue Ram Dwarf Cichlid (Mikrogeophagus ramirezi) 3cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Electric Blue Ram Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Mikrogeophagus ramirezi</li> <li><strong>Common name</strong>: Electric Blue Ram Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Orinoco River basin in Venezuela and Colombia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Electric Blue Ram Dwarf Cichlids prefer a tank with plenty of hiding places and subdued lighting. A tank size of at least 75 litres is recommended.</li> <li>Provide sandy substrate and include driftwood, rocks, and caves as hiding spots.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Electric Blue Ram Dwarf Cichlids thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with gentle to moderate flow as Electric Blue Ram Dwarf Cichlids prefer calmer waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Electric Blue Ram Dwarf Cichlids are omnivores and accept a variety of foods. Offer them a balanced diet of high-quality flakes, pellets, and live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Electric Blue Ram Dwarf Cichlids are peaceful fish but can be territorial during breeding. They are best kept with other peaceful fish such as tetras, rasboras, and small catfish species.</li> <li>Avoid keeping them with aggressive or fin-nipping species that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Electric Blue Ram Dwarf Cichlids are relatively peaceful but can become territorial when breeding. They form monogamous pairs and may become aggressive towards other fish during spawning.</li> <li>Provide plenty of hiding places to reduce aggression and monitor their behavior closely during breeding periods.</li> </ul> </li> </ol>",
            "price": 6,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-30T19:48:13+00:00",
            "date_created": "2023-10-26T07:47:47+00:00"
      },
      {
            "id": 352,
            "name": "Red Oscar Cichlid (Astronotus ocellatus) 5cm",
            "type": "physical",
            "sku": "269",
            "description": "<h3>Our Guide To Keeping Red Oscar Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Astronotus ocellatus</li> <li><strong>Common name</strong>: Red Oscar Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America, specifically the Amazon River basin</li> <li><strong>Adult length</strong>: Up to 35 cm (14 inches)</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Oscar Cichlids require a large tank with a minimum capacity of 200 litres, preferably larger as they can grow quite large.</li> <li>Provide plenty of hiding spots and caves with rocks and driftwood as they enjoy exploring and having territories.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Oscar Cichlids thrive in tropical water conditions with a temperature range of 24 to 27&deg;C (75 to 80&deg;F).</li> <li>Maintain a pH level between 6.5 and 7.5.</li> <li>They are sensitive to water quality, so regular water changes are essential.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Efficient filtration is crucial for Red Oscar Cichlids as they produce a significant amount of waste. Use a powerful filter and perform regular maintenance to keep the water clean.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Oscar Cichlids are carnivorous and enjoy a varied diet. Offer them high-quality pellets, flakes, and occasional live or frozen foods like bloodworms, brine shrimp, and earthworms.</li> <li>Feed them small amounts multiple times a day to mimic their natural feeding behavior.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>While Red Oscar Cichlids can be aggressive, they can coexist with certain tank mates. Avoid small fish that can be seen as prey.</li> <li>Compatible tank mates include large peaceful fish such as other cichlids of similar size, large catfish, and some larger tetras.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Oscar Cichlids are intelligent and have distinct personalities. They may show aggression, especially during breeding or if they feel threatened.</li> <li>Provide plenty of space and hiding spots to minimize aggression. Monitor tank mates for signs of bullying.</li> </ul> </li> </ol>",
            "price": 10,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:47:50+00:00"
      },
      {
            "id": 353,
            "name": "Jaguar Cichlid (Parachromis managuensis)",
            "type": "physical",
            "sku": "270",
            "description": "<h3>Our Guide To Keeping Jaguar Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Parachromis managuensis</li> <li><strong>Common name</strong>: Jaguar Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America, specifically Nicaragua and Costa Rica</li> <li><strong>Adult length</strong>: Up to 35 cm (14 inches)</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Jaguar Cichlids require a spacious tank with a minimum size of 200 litres for a single fish.</li> <li>Provide plenty of hiding spots and caves using rocks and driftwood. They also appreciate a sandy substrate.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH range between 7.0 to 8.0.</li> <li>Keep the water temperature between 25 to 28&deg;C (77 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system to maintain water quality as Jaguar Cichlids are messy eaters.</li> <li>Ensure good water flow to mimic their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Jaguar Cichlids are carnivorous and prefer live foods such as small fish, insects, and crustaceans.</li> <li>Offer them a variety of high-quality pellets, flakes, and frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Jaguar Cichlids are aggressive and territorial, so they are best kept alone or with large, robust tank mates.</li> <li>Avoid keeping them with smaller or more passive fish that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Jaguar Cichlids are highly territorial and can be aggressive, especially during breeding periods.</li> <li>They may exhibit aggressive behavior towards tank mates, so choose companions carefully.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:38+00:00",
            "date_created": "2023-10-26T07:47:55+00:00"
      },
      {
            "id": 354,
            "name": "Wolf Cichlid (Parachromis dovii)",
            "type": "physical",
            "sku": "271",
            "description": "<h3>Our Guide To Keeping Wolf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Parachromis dovii</li> <li><strong>Common name</strong>: Wolf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America, specifically Honduras, Nicaragua, and Costa Rica</li> <li><strong>Adult length</strong>: Up to 30 cm (12 inches)</li> <li><strong>Lifespan</strong>: Approximately 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Wolf Cichlids require a spacious tank with a minimum size of 150 gallons for a single adult.</li> <li>Provide ample hiding spots with rocks, caves, and driftwood, as they are territorial and appreciate having their own space.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Maintain a pH level between 7.0 to 8.0.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Utilize a powerful filtration system to maintain water quality, as Wolf Cichlids are messy eaters and produce a lot of waste.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet consisting of high-quality pellets, flakes, and occasional live or frozen foods such as bloodworms, brine shrimp, and small fish.</li> <li>Ensure a balanced diet to support their health and vibrant coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Due to their aggressive nature, Wolf Cichlids are best kept alone or with large, robust tank mates that can withstand their aggression.</li> <li>Avoid keeping them with smaller or more passive fish, as they may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Wolf Cichlids are highly territorial and can be aggressive, especially during breeding periods.</li> <li>They exhibit interesting behaviors such as digging and rearranging the tank substrate.</li> </ul> </li> </ol>",
            "price": 10,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:39+00:00",
            "date_created": "2023-10-26T07:47:58+00:00"
      },
      {
            "id": 355,
            "name": "Green Severum Cichlid (Heros efasciatus)",
            "type": "physical",
            "sku": "272",
            "description": "<h3>Our Guide To Keeping Green Severum Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Heros efasciatus</li> <li><strong>Common name</strong>: Green Severum Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America (Amazon River Basin)</li> <li><strong>Adult length</strong>: 20-25 cm</li> <li><strong>Lifespan</strong>: 10-15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Green Severum Cichlids prefer a spacious tank with plenty of hiding places and areas for exploration. A minimum tank size of 75 gallons is recommended for a pair of these fish.</li> <li>Provide a substrate of fine sand or small gravel and include driftwood, rocks, and caves for shelter.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> <li>Maintain a pH level between 6.5 to 7.5.</li> <li>Water hardness should be kept between 5 to 15 dGH.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A powerful filtration system is necessary to maintain water quality, as Green Severum Cichlids can be messy eaters.</li> <li>Ensure good water flow but avoid strong currents that may stress the fish.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Green Severum Cichlids are omnivores and should be fed a varied diet consisting of high-quality pellets or flakes, supplemented with occasional live or frozen foods like bloodworms, brine shrimp, and earthworms.</li> <li>Include plenty of vegetable matter in their diet, such as blanched spinach, zucchini, and peas.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They can be kept with other peaceful community fish of similar size and temperament, such as other South American cichlids, tetras, catfish, and peaceful barbs.</li> <li>Avoid housing them with aggressive or territorial species that may provoke aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Green Severum Cichlids are generally peaceful but can become territorial during breeding or if they feel threatened.</li> <li>They may form pairs and exhibit breeding behavior, so provide plenty of hiding spots for potential spawning sites.</li> </ul> </li> </ol>",
            "price": 8,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:39+00:00",
            "date_created": "2023-10-26T07:48:00+00:00"
      },
      {
            "id": 356,
            "name": "Red Breast Acara Cichlid (Laetacara dorsigera)",
            "type": "physical",
            "sku": "273",
            "description": "<h3>Our Guide To Keeping Red Breast Acara Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Laetacara dorsigera</li> <li><strong>Common name</strong>: Red Breast Acara Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America</li> <li><strong>Adult length</strong>: 10 cm</li> <li><strong>Lifespan</strong>: 5 to 8 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Red Breast Acara Cichlids prefer a tank with plenty of hiding spots and caves. Provide a sandy substrate with rocks and driftwood to mimic their natural habitat.</li> <li>They appreciate planted areas with robust plants like Java Fern, Vallisneria, and Amazon Sword.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Red Breast Acara Cichlids thrive in slightly acidic to neutral water conditions with a pH range of 6.5 to 7.5.</li> <li>Keep the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>A moderate water flow is suitable for these fish, so choose a filter that provides gentle to moderate flow.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Red Breast Acara Cichlids are omnivores and will accept a variety of foods. Offer them a balanced diet consisting of high-quality flake or pellet food as a staple.</li> <li>Supplement their diet with live or frozen foods like bloodworms, brine shrimp, and small insects to provide essential nutrients.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Red Breast Acara Cichlids are generally peaceful but may show aggression during breeding. They are compatible with other peaceful community fish such as tetras, rasboras, and peaceful cichlids.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Red Breast Acara Cichlids are relatively peaceful cichlids but can be territorial, especially when breeding. Provide ample space and hiding spots to reduce aggression.</li> </ul> </li> </ol>",
            "price": 7,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:39+00:00",
            "date_created": "2023-10-26T07:48:03+00:00"
      },
      {
            "id": 357,
            "name": "Jack Dempsey Cichlid (Rocio octofasciata)",
            "type": "physical",
            "sku": "274",
            "description": "<h3>Our Guide To Keeping Jack Dempsey Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Rocio octofasciata</li> <li><strong>Common name</strong>: Jack Dempsey Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America, specifically Mexico and Honduras</li> <li><strong>Adult length</strong>: 10 to 15 inches</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a tank of at least 55 gallons with hiding spots and caves created using rocks and driftwood.</li> <li>Substrate should be fine sand or gravel, and include some artificial plants for additional cover.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH level between 6.5 and 7.5.</li> <li>Water temperature should be kept between 75 to 80&deg;F (24 to 27&deg;C).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filter to maintain clean water conditions, and ensure a moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Provide a balanced diet with high-quality pellets or flakes, and supplement with live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Jack Dempsey Cichlids can be kept with other semi-aggressive to aggressive cichlid species of similar size.</li> <li>Avoid keeping them with very passive or small fish that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are known for their territorial behavior, especially during breeding.</li> <li>Keep them in a mated pair or in a larger tank with ample hiding spaces to reduce aggression.</li> </ul> </li> </ol>",
            "price": 4.5,
            "sale_price": 0,
            "inventory_level": 0,
            "is_visible": false,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:39+00:00",
            "date_created": "2023-10-26T07:48:09+00:00"
      },
      {
            "id": 358,
            "name": "Electric Blue Jack Dempsey Cichlid (Rocio octofasciata) 4cm",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Electric Blue Jack Dempsey Cichlid</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Rocio octofasciata</li> <li><strong>Common name</strong>: Electric Blue Jack Dempsey Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America, specifically Mexico and Honduras</li> <li><strong>Adult length</strong>: 12 to 15 inches</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a tank of at least 75 gallons with hiding spots and caves created using rocks and driftwood.</li> <li>Substrate should be fine sand or gravel, and include some artificial plants for additional cover.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain a pH level between 6.5 and 7.5.</li> <li>Water temperature should be kept between 78 to 82&deg;F (25 to 28&deg;C).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filter to maintain clean water conditions, and ensure a moderate water flow in the tank.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Provide a balanced diet with high-quality pellets or flakes, and supplement with live or frozen foods like bloodworms and brine shrimp.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Electric Blue Jack Dempsey Cichlids can be kept with other semi-aggressive to aggressive cichlid species of similar size.</li> <li>Avoid keeping them with very passive or small fish that may become targets of aggression.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>They are known for their territorial behavior, especially during breeding.</li> <li>Keep them in a mated pair or in a larger tank with ample hiding spaces to reduce aggression.</li> </ul> </li> </ol>",
            "price": 10,
            "sale_price": 0,
            "inventory_level": 9,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-28T16:08:49+00:00",
            "date_created": "2023-10-26T07:48:11+00:00"
      },
      {
            "id": 359,
            "name": "Gold Ram Dwarf Cichlid (Mikrogeophagus ramirezi)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Gold Ram Dwarf Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Mikrogeophagus ramirezi</li> <li><strong>Common name</strong>: Gold Ram Dwarf Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Orinoco River basin in Venezuela and Colombia</li> <li><strong>Adult length</strong>: 5 cm</li> <li><strong>Lifespan</strong>: 2 to 3 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Gold Ram Dwarf Cichlids prefer a tank with plenty of hiding places and subdued lighting. A tank size of at least 75 litres is recommended.</li> <li>Provide sandy substrate and include driftwood, rocks, and caves as hiding spots.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Gold Ram Dwarf Cichlids thrive in slightly acidic to neutral water conditions with a pH range of 6.0 to 7.0.</li> <li>Maintain the water temperature between 24 to 28&deg;C (75 to 82&deg;F).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Choose a filter with gentle to moderate flow as Gold Ram Dwarf Cichlids prefer calmer waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Gold Ram Dwarf Cichlids are omnivores and accept a variety of foods. Offer them a balanced diet of high-quality flakes, pellets, and live or frozen foods such as bloodworms, brine shrimp, and daphnia.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Gold Ram Dwarf Cichlids are peaceful fish but can be territorial during breeding. They are best kept with other peaceful fish such as tetras, rasboras, and small catfish species.</li> <li>Avoid keeping them with aggressive or fin-nipping species that may stress them.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Gold Ram Dwarf Cichlids are relatively peaceful but can become territorial when breeding. They form monogamous pairs and may become aggressive towards other fish during spawning.</li> <li>Provide plenty of hiding places to reduce aggression and monitor their behavior closely during breeding periods.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 13,
            "is_visible": true,
            "categories": [
                  55
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-21T15:38:29+00:00",
            "date_created": "2023-10-26T07:48:14+00:00"
      },
      {
            "id": 360,
            "name": "Convict Cichlid (Amatitlania nigrofasciata)",
            "type": "physical",
            "sku": "",
            "description": "<h3>Our Guide To Keeping Convict Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Amatitlania nigrofasciata</li> <li><strong>Common name</strong>: Convict Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: Central America, from Costa Rica to Panama</li> <li><strong>Adult length</strong>: 10 cm (4 inches)</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Convict Cichlids can thrive in tanks as small as 20 gallons, but a larger tank is recommended for a breeding pair or community setup.</li> <li>Provide plenty of hiding spots with rocks, caves, and driftwood. They appreciate a well-decorated tank with plants, but they may uproot them, so choose hardy plants like Java Fern and Anubias.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Convict Cichlids prefer slightly alkaline water with a pH range between 6.5 to 8.0.</li> <li>Maintain the water temperature between 72 to 82&deg;F (22 to 28&deg;C).</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Efficient filtration is essential to maintain water quality, but avoid strong currents as Convict Cichlids prefer calmer waters.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Convict Cichlids are omnivores and will accept a variety of foods including high-quality pellets, flakes, and live or frozen foods like bloodworms, brine shrimp, and small insects.</li> <li>Offer a varied diet to ensure they receive proper nutrition and supplement with occasional vegetable matter.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Convict Cichlids can be aggressive, especially when breeding, so choose tank mates carefully. Avoid keeping them with slow-moving or long-finned fish.</li> <li>Compatible tank mates include other semi-aggressive fish of similar size and temperament, such as other Central American cichlids or robust catfish species.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Convict Cichlids are known for their territorial behavior, especially during breeding. Provide adequate hiding spots and territories to reduce aggression.</li> <li>They are generally not suitable for community tanks with passive or smaller fish, as they may harass them.</li> </ul> </li> </ol>",
            "price": 4,
            "sale_price": 0,
            "inventory_level": 1,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-05T21:26:59+00:00",
            "date_created": "2023-10-26T07:48:17+00:00"
      },
      {
            "id": 361,
            "name": "Blue Acara Cichlid (Andinoacara pulcher) 4-5cm",
            "type": "physical",
            "sku": "278",
            "description": "<h3>Our Guide To Keeping Blue Acara Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Andinoacara pulcher</li> <li><strong>Common name</strong>: Blue Acara Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America, specifically in rivers and lakes in Panama and Costa Rica</li> <li><strong>Adult length</strong>: 15 to 20 cm</li> <li><strong>Lifespan</strong>: 8 to 10 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Blue Acara Cichlids prefer a spacious tank with plenty of hiding places such as caves, driftwood, and plants.</li> <li>Provide a substrate of sand or fine gravel to mimic their natural environment.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Maintain water temperature between 22 to 28&deg;C (72 to 82&deg;F).</li> <li>Keep the pH level around 6.5 to 7.5.</li> <li>Water hardness should be moderate, between 5 to 15 dGH.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a good quality filtration system to maintain water quality.</li> <li>A moderate water flow is suitable for Blue Acara Cichlids.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Blue Acara Cichlids are omnivorous and will accept a variety of foods including high-quality cichlid pellets, flakes, and live or frozen foods such as bloodworms, brine shrimp, and small insects.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>They are generally peaceful and can be kept with other medium-sized, peaceful fish such as tetras, barbs, and rasboras.</li> <li>Avoid keeping them with aggressive or very small tank mates.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>Blue Acara Cichlids are known for their peaceful temperament but can be territorial, especially during breeding.</li> <li>They are good parents and may become aggressive when protecting their fry.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 2,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-09-08T13:34:29+00:00",
            "date_created": "2023-10-26T07:48:23+00:00"
      },
      {
            "id": 362,
            "name": "Green Terror Cichlid (Andinoacara rivulatus)",
            "type": "physical",
            "sku": "279",
            "description": "<h3>Our Guide To Keeping Green Terror Cichlid Fish</h3> <ol> <li> <p><strong>About Fish Species</strong>:</p> <ul> <li><strong>Scientific name</strong>: Andinoacara rivulatus</li> <li><strong>Common name</strong>: Green Terror Cichlid, Gold Saum Cichlid</li> <li><strong>Family</strong>: Cichlidae</li> <li><strong>Origin</strong>: South America (Peru, Ecuador)</li> <li><strong>Adult length</strong>: Up to 30 cm (12 inches)</li> <li><strong>Lifespan</strong>: 10 to 15 years</li> </ul> </li> <li> <p><strong>Tank Setup</strong>:</p> <ul> <li>Provide a tank size of at least 75 gallons for a single Green Terror Cichlid.</li> <li>Offer caves, rocks, and driftwood for hiding places and territory establishment.</li> <li>Include hardy plants, but be prepared for them to be uprooted as the fish may rearrange the tank.</li> </ul> </li> <li> <p><strong>Water Parameters</strong>:</p> <ul> <li>Keep the water temperature between 22 to 26&deg;C (72 to 79&deg;F).</li> <li>Maintain a pH level between 6.5 to 8.0.</li> <li>Water hardness (dH): 5 to 20 dH.</li> </ul> </li> <li> <p><strong>Filtration and Water Flow</strong>:</p> <ul> <li>Use a powerful filtration system as Green Terror Cichlids produce a lot of waste.</li> <li>Provide moderate water flow to simulate their natural habitat.</li> </ul> </li> <li> <p><strong>Diet</strong>:</p> <ul> <li>Offer a varied diet including high-quality pellets, flakes, and live or frozen foods such as bloodworms, brine shrimp, and small fish.</li> <li>Ensure a balance of proteins, vegetables, and supplements to support their health and coloration.</li> </ul> </li> <li> <p><strong>Tank mates</strong>:</p> <ul> <li>Green Terror Cichlids are territorial and aggressive, especially during breeding.</li> <li>Choose tank mates carefully, avoiding other aggressive fish or those that resemble Cichlid territory markers.</li> <li>Suitable tank mates include robust fish like other large Cichlids, large catfish, and Plecos.</li> </ul> </li> <li> <p><strong>Behavior and Compatibility</strong>:</p> <ul> <li>These Cichlids are known for their bold behavior and can be aggressive, particularly when breeding.</li> <li>Provide ample space and hiding spots to reduce aggression.</li> <li>Monitor tank dynamics closely, especially during breeding, as aggression levels can rise.</li> </ul> </li> </ol>",
            "price": 5,
            "sale_price": 0,
            "inventory_level": 10,
            "is_visible": true,
            "categories": [
                  45
            ],
            "brand_id": 53,
            "images": [],
            "primary_image": null,
            "date_modified": "2025-08-05T23:05:39+00:00",
            "date_created": "2023-10-26T07:48:26+00:00"
      }
];
    
    return realProducts;
  }

  static async getBigCommerceCategories(): Promise<BigCommerceCategory[]> {
    // Real BigCommerce category data - replace this with actual JSON data from BigCommerce
    const realCategories: BigCommerceCategory[] = [
      {
            "id": 84,
            "parent_id": 0,
            "name": "Freshwater Livestock",
            "description": "<p>Create a vibrant, balanced <strong>tropical aquarium</strong> with our stunning selection of <strong>freshwater fish</strong>, <strong>invertebrates</strong>, <strong>amphibians</strong>, and more. From peaceful <strong>tetras</strong> and <strong>algae-eating snails</strong> to bold <strong>African cichlids</strong> and quirky unusual species, each organism plays a role in a thriving aquatic ecosystem. Perfect for beginners and advanced aquarists alike, our ethically sourced livestock enhances your tank&rsquo;s beauty, activity, and health.</p>",
            "is_visible": true,
            "sort_order": 2,
            "children": [
                  {
                        "id": 24,
                        "parent_id": 84,
                        "name": "Freshwater Snails",
                        "description": "<p>Freshwater Snails are essential for maintaining a clean and balanced aquarium. Known for their algae-eating abilities and peaceful nature, these snails help keep your tank tidy while adding a unique, decorative touch. With species like Mystery Snails, Nerite Snails, and Malaysian Trumpet Snails, they are the perfect companions for both beginner and experienced aquarists looking to enhance the beauty and health of their aquatic environment.</p>",
                        "is_visible": true,
                        "sort_order": 17,
                        "children": []
                  },
                  {
                        "id": 25,
                        "parent_id": 84,
                        "name": "Killifish",
                        "description": "<p>Discover the captivating beauty of Killifish, known for their vibrant colors and diverse patterns. These small, hardy fish are perfect for adding a splash of brilliance to both species-specific and community aquariums. Easy to care for and full of personality, Killifish are an excellent choice for aquarists looking to bring unique charm and activity to their tanks.</p>",
                        "is_visible": true,
                        "sort_order": 19,
                        "children": []
                  },
                  {
                        "id": 29,
                        "parent_id": 84,
                        "name": "Catfish",
                        "description": "<p>Explore our diverse selection of Catfish, the perfect bottom dwellers for any freshwater aquarium. Known for their scavenging habits and peaceful nature, Catfish help maintain a clean tank while adding unique personality and charm. From small Corydoras to larger Plecos, these hardy fish are ideal for aquarists looking for efficient cleaners and fascinating companions.</p>",
                        "is_visible": true,
                        "sort_order": 8,
                        "children": []
                  },
                  {
                        "id": 32,
                        "parent_id": 84,
                        "name": "Corydoras",
                        "description": "<p>Corydoras are beloved for their peaceful nature and playful behaviour, making them ideal bottom-dwellers for community aquariums. Known for their armoured bodies and active personalities, these hardy freshwater catfish help keep your tank clean while adding charm and movement. Browse our selection of Corydoras, from the popular Peppered Cory to the elegant Bronze Cory, and find the perfect addition to your aquarium.</p>",
                        "is_visible": true,
                        "sort_order": 10,
                        "children": []
                  },
                  {
                        "id": 33,
                        "parent_id": 84,
                        "name": "Tetras",
                        "description": "<p>Tetras are small, colourful fish that are perfect for brightening up any freshwater aquarium. Known for their peaceful nature and schooling behaviour, these fish thrive in community tanks, adding vibrant energy and movement. From the iconic Neon Tetra to the striking Cardinal and Ember Tetras, our selection offers a variety of species that will bring colour and life to your aquatic setup.</p>",
                        "is_visible": true,
                        "sort_order": 26,
                        "children": []
                  },
                  {
                        "id": 37,
                        "parent_id": 84,
                        "name": "Livebearers",
                        "description": "<p>Livebearers are a favourite among aquarists for their ease of care and fascinating breeding behaviour. Popular species like Guppies, Mollies, Platies, and Swordtails bring vibrant colours and activity to any aquarium. These peaceful fish thrive in community tanks and are perfect for beginners and seasoned fish keepers alike, adding beauty and life to your aquatic setup.</p>",
                        "is_visible": true,
                        "sort_order": 21,
                        "children": []
                  },
                  {
                        "id": 38,
                        "parent_id": 84,
                        "name": "Loaches and Sharks",
                        "description": "<p>Add a touch of uniqueness to your aquarium with our selection of Loaches and Sharks. Loaches are known for their playful, bottom-dwelling behaviour and are great for keeping your tank clean, while Freshwater Sharks, like the Red Tail or Bala Shark, bring boldness and striking looks to your setup. Both species are perfect for aquarists seeking active, fascinating fish that add diversity and energy to their tank.</p>",
                        "is_visible": true,
                        "sort_order": 22,
                        "children": []
                  },
                  {
                        "id": 39,
                        "parent_id": 84,
                        "name": "Gourami & Paradise Fish",
                        "description": "<p>Enhance your aquarium with the vibrant colours and graceful movements of Gourami and Paradise Fish. Known for their striking appearance and peaceful nature, these freshwater fish are ideal for community tanks. From the tranquil Dwarf Gourami to the bold Paradise Fish, these species bring beauty and harmony to your aquatic setup, making them a popular choice for aquarists of all levels.</p>",
                        "is_visible": true,
                        "sort_order": 18,
                        "children": []
                  },
                  {
                        "id": 41,
                        "parent_id": 84,
                        "name": "Barbs",
                        "description": "<p>Add energy and colour to your aquarium with our lively selection of Barbs. These active freshwater fish are known for their striking patterns and playful behaviour, making them a popular choice for community tanks. Whether you're looking for Cherry Barbs, Tiger Barbs, or other varieties, you'll find the perfect fit to create a vibrant, dynamic aquatic display.</p>",
                        "is_visible": true,
                        "sort_order": 6,
                        "children": []
                  },
                  {
                        "id": 42,
                        "parent_id": 84,
                        "name": "Rainbowfish",
                        "description": "<p>Rainbowfish are prized for their vibrant colours and peaceful nature, making them a beautiful addition to any freshwater aquarium. Known for their shimmering, iridescent scales, these lively fish are perfect for community tanks and thrive in well-maintained environments. From the popular Boesemani Rainbowfish to the colourful Neon Dwarf, our selection offers a variety of species that will bring brightness and activity to your tank.</p>",
                        "is_visible": true,
                        "sort_order": 25,
                        "children": []
                  },
                  {
                        "id": 44,
                        "parent_id": 84,
                        "name": "Bettas (Siamese Fighting Fish)",
                        "description": "<p>Known for their dazzling colours and flowing fins, Bettas (Siamese Fighting Fish) are a striking addition to any aquarium. These hardy, low-maintenance fish are perfect for both beginners and experienced aquarists. With their bold personalities and vibrant appearance, Bettas bring beauty and intrigue to your aquatic setup.</p>",
                        "is_visible": true,
                        "sort_order": 7,
                        "children": []
                  },
                  {
                        "id": 45,
                        "parent_id": 84,
                        "name": "Central & South American Cichlids",
                        "description": "<p>Dive into the vibrant world of Central and South American Cichlids, renowned for their stunning colours and bold personalities. These freshwater fish bring dynamic behaviour and striking beauty to any aquarium, making them perfect for aquarists who enjoy a lively, engaging tank. With popular species like the majestic Oscar, colourful Jack Dempsey, and the vibrant Firemouth, our selection offers a variety of choices to suit your aquarium's needs, whether you're looking for peaceful community fish or bold, territorial species.</p>",
                        "is_visible": true,
                        "sort_order": 9,
                        "children": []
                  },
                  {
                        "id": 46,
                        "parent_id": 84,
                        "name": "Danio, Minnow and Rasbora",
                        "description": "<p>Add vibrant movement and colour to your aquarium with our lively selection of Danio, Minnow, and Rasbora species. These small, active fish are perfect for community tanks, known for their hardiness and peaceful nature. Whether you're looking for the striking Zebra Danio, the shimmering White Cloud Minnow, or the colourful Harlequin Rasbora, you'll find the ideal school to enhance your freshwater setup.</p>",
                        "is_visible": true,
                        "sort_order": 11,
                        "children": []
                  },
                  {
                        "id": 48,
                        "parent_id": 84,
                        "name": "Miscellaneous & Unusual Fish",
                        "description": "<p>Explore the extraordinary with our collection of Miscellaneous and Unusual Fish. From rare species to unique-looking fish, this selection is perfect for aquarists looking to add something truly distinctive to their tanks. Whether you&rsquo;re seeking oddball species or quirky companions, these fish bring a sense of wonder and diversity to any aquatic environment.</p>",
                        "is_visible": true,
                        "sort_order": 23,
                        "children": [
                              {
                                    "id": 27,
                                    "parent_id": 48,
                                    "name": "Bichir",
                                    "description": "<p>Bichirs are ancient, prehistoric-looking fish that bring a unique and exotic appeal to larger aquariums. Known for their elongated, snake-like bodies and primitive features, these fascinating freshwater predators are perfect for experienced aquarists looking for something truly extraordinary. With their captivating appearance and slow, graceful movements, Bichirs make a striking addition to any well-maintained tank.</p>",
                                    "is_visible": false,
                                    "sort_order": 3,
                                    "children": []
                              },
                              {
                                    "id": 30,
                                    "parent_id": 48,
                                    "name": "Pufferfish",
                                    "description": "<p>Freshwater Pufferfish are full of personality, known for their curious nature and unique ability to inflate when threatened. These fascinating fish come in a variety of species, from the playful Dwarf Puffer to the larger Fahaka Puffer, and bring a sense of excitement to any aquarium. Perfect for experienced aquarists, Freshwater Pufferfish are best kept in specialized setups where their quirky behaviour can truly shine.</p>",
                                    "is_visible": true,
                                    "sort_order": 9,
                                    "children": []
                              },
                              {
                                    "id": 31,
                                    "parent_id": 48,
                                    "name": "Knifefish",
                                    "description": "<p>Knifefish are mysterious and graceful creatures, known for their elongated, blade-like bodies and smooth, fluid movements. Perfect for larger, well-maintained tanks, these fascinating freshwater fish bring a sense of elegance and intrigue to any aquarium. With species like the popular Black Ghost Knifefish, they are a favourite among experienced aquarists looking to add a unique and captivating species to their collection.</p>",
                                    "is_visible": false,
                                    "sort_order": 6,
                                    "children": []
                              },
                              {
                                    "id": 35,
                                    "parent_id": 48,
                                    "name": "Freshwater Eels",
                                    "description": "<p>Freshwater Eels are captivating, snake-like fish that add a sense of mystery and intrigue to any aquarium. Known for their elongated bodies and burrowing behaviour, these eels thrive in well-structured tanks with plenty of hiding spots. Ideal for experienced aquarists, Freshwater Eels are fascinating to observe and bring a unique, exotic touch to your aquatic setup.</p>",
                                    "is_visible": true,
                                    "sort_order": 4,
                                    "children": []
                              },
                              {
                                    "id": 36,
                                    "parent_id": 48,
                                    "name": "Gobies and Gudgeons",
                                    "description": "<p>Gobies and Gudgeons are small, fascinating fish known for their unique behaviours and adaptability. Whether you're looking for the bottom-dwelling antics of Gobies or the peaceful charm of Gudgeons, these fish make excellent additions to both freshwater and brackish tanks. Their vibrant colours and playful personalities bring life and character to any aquarium setup.</p>",
                                    "is_visible": true,
                                    "sort_order": 5,
                                    "children": []
                              },
                              {
                                    "id": 60,
                                    "parent_id": 48,
                                    "name": "Badis and Dario",
                                    "description": "<p>Badis and Dario fish are small, colourful, and full of personality, making them a captivating addition to any freshwater aquarium. Known for their vibrant hues and fascinating behaviours, these shy yet active fish thrive in well-planted tanks. Perfect for aquarists looking for unique, peaceful species, Badis and Dario bring a touch of elegance and charm to any aquatic environment.</p>",
                                    "is_visible": true,
                                    "sort_order": 2,
                                    "children": []
                              },
                              {
                                    "id": 115,
                                    "parent_id": 48,
                                    "name": "Archerfish",
                                    "description": "<p>Famous for their unique hunting technique, Archerfish are fascinating additions to any aquarium. These remarkable fish can shoot jets of water to catch prey, making them a true spectacle to observe. Ideal for brackish water setups, Archerfish add excitement and intrigue to your tank with their sharp aim and striking appearance.</p>",
                                    "is_visible": true,
                                    "sort_order": 1,
                                    "children": []
                              },
                              {
                                    "id": 116,
                                    "parent_id": 48,
                                    "name": "Ropefish",
                                    "description": "<p>Ropefish are exotic, eel-like creatures known for their long, slender bodies and snake-like movements. These fascinating freshwater fish are perfect for aquarists looking to add a unique, prehistoric touch to their aquarium. With their peaceful nature and intriguing behaviour, Ropefish thrive in larger tanks with plenty of hiding spots, offering both beauty and mystery to your aquatic setup.</p>",
                                    "is_visible": true,
                                    "sort_order": 10,
                                    "children": []
                              },
                              {
                                    "id": 117,
                                    "parent_id": 48,
                                    "name": "Snakehead",
                                    "description": "<p>Snakeheads are powerful, predatory fish known for their striking appearance and bold personality. With their elongated bodies and sharp instincts, these freshwater fish are perfect for experienced aquarists looking to add a commanding presence to their tank. Snakeheads thrive in larger setups with plenty of space, bringing excitement and an exotic flair to any well-maintained aquarium.</p>",
                                    "is_visible": true,
                                    "sort_order": 12,
                                    "children": []
                              },
                              {
                                    "id": 118,
                                    "parent_id": 48,
                                    "name": "Sticklebacks",
                                    "description": "<p>Sticklebacks are small, hardy fish known for their fascinating behaviour and unique spiny appearance. These active freshwater fish are a great addition to coldwater or temperate aquariums, bringing lively energy and adaptability. With their distinctive look and peaceful nature, Sticklebacks are perfect for aquarists looking for something different and easy to care for.</p>",
                                    "is_visible": true,
                                    "sort_order": 11,
                                    "children": []
                              },
                              {
                                    "id": 119,
                                    "parent_id": 48,
                                    "name": "Sunfish",
                                    "description": "<p>Sunfish are colourful, active freshwater fish that bring a vibrant touch to any aquarium or pond. Known for their wide, sun-like bodies and bold patterns, these fish are popular among aquarists and outdoor enthusiasts alike. With species ranging from Bluegills to Pumpkinseeds, Sunfish are perfect for those looking to add dynamic beauty and energy to their aquatic environments.</p>",
                                    "is_visible": true,
                                    "sort_order": 13,
                                    "children": []
                              },
                              {
                                    "id": 120,
                                    "parent_id": 48,
                                    "name": "Leporinus",
                                    "description": "<p>Leporinus are striking freshwater fish, known for their bold patterns and active behaviour. With their distinctive stripes and sleek bodies, these fish bring a dynamic energy to larger aquariums. Ideal for experienced aquarists, Leporinus thrive in well-maintained tanks with plenty of swimming space, making them a captivating addition to any setup.</p>",
                                    "is_visible": true,
                                    "sort_order": 7,
                                    "children": []
                              },
                              {
                                    "id": 185,
                                    "parent_id": 48,
                                    "name": "Leaf Fish",
                                    "description": "<p>Leaf Fish are masters of disguise, known for their incredible ability to blend in with aquatic plants. With their leaf-like appearance and stealthy hunting skills, these fascinating fish are perfect for aquarists looking for something unique and unusual. Ideal for well-planted tanks, Leaf Fish add intrigue and natural beauty to any freshwater setup.</p>",
                                    "is_visible": true,
                                    "sort_order": 0,
                                    "children": []
                              }
                        ]
                  },
                  {
                        "id": 51,
                        "parent_id": 84,
                        "name": "Freshwater Shrimps",
                        "description": "<p>Freshwater Shrimps are popular for their algae-eating abilities and vibrant colours, making them both functional and beautiful additions to any aquarium. These peaceful, small crustaceans, like the Cherry Shrimp and Amano Shrimp, help maintain a clean, balanced tank while adding a touch of activity and charm. Ideal for aquarists of all levels, freshwater shrimps thrive in well-maintained community tanks and are perfect for creating a lively, natural ecosystem.</p>",
                        "is_visible": true,
                        "sort_order": 16,
                        "children": []
                  },
                  {
                        "id": 52,
                        "parent_id": 84,
                        "name": "Freshwater Crabs",
                        "description": "<p>Freshwater Crabs bring a unique and fascinating element to your aquarium with their intriguing behaviour and scavenging habits. These small, hardy crustaceans are perfect for adding diversity to your tank, helping to keep it clean while offering a striking visual presence. With species like the popular Red Claw Crab and Fiddler Crab, freshwater crabs are ideal for aquarists seeking something different to enhance their aquatic setup.</p>",
                        "is_visible": true,
                        "sort_order": 15,
                        "children": []
                  },
                  {
                        "id": 55,
                        "parent_id": 84,
                        "name": "Dwarf Cichlids",
                        "description": "<p>Dwarf Cichlids are perfect for aquarists seeking colourful, lively fish that thrive in smaller tanks. Known for their vibrant patterns and manageable size, these freshwater fish offer big personality in a compact package. Popular species like Apistogramma and Ram Cichlids are great for community aquariums, adding beauty and energy to your setup without overwhelming the space.</p>",
                        "is_visible": true,
                        "sort_order": 13,
                        "children": []
                  },
                  {
                        "id": 57,
                        "parent_id": 84,
                        "name": "Angelfish",
                        "description": "<p>Angelfish are prized for their graceful appearance and striking, triangular fins, making them a stunning centrepiece in any freshwater aquarium. Known for their elegant swimming and calm demeanour, these freshwater beauties thrive in community tanks and add a sense of sophistication to your aquatic setup. Whether you&rsquo;re drawn to the classic Silver Angelfish or the vibrant colours of the Marble or Koi Angelfish, these captivating fish are perfect for both beginners and experienced aquarists.</p>",
                        "is_visible": true,
                        "sort_order": 5,
                        "children": []
                  },
                  {
                        "id": 58,
                        "parent_id": 84,
                        "name": "Discus",
                        "description": "<p>Known as the \"kings of the aquarium,\" Discus are prized for their breathtaking colours and graceful presence. These stunning freshwater fish bring elegance and beauty to any tank, making them a favourite among experienced aquarists. With their vibrant hues and calm demeanour, Discus fish thrive in well-maintained aquariums, adding a touch of sophistication to your aquatic environment.</p>",
                        "is_visible": true,
                        "sort_order": 12,
                        "children": []
                  },
                  {
                        "id": 62,
                        "parent_id": 84,
                        "name": "Fancy Goldfish",
                        "description": "<p>Discover a stunning collection of Fancy Goldfish, perfect for adding elegance and vibrant color to your aquarium. Known for their flowing fins, unique shapes, and dazzling patterns, these goldfish varieties are ideal for both beginner and experienced fish enthusiasts. Browse our selection and find the perfect Fancy Goldfish to enhance your aquatic environment.</p>",
                        "is_visible": true,
                        "sort_order": 14,
                        "children": []
                  },
                  {
                        "id": 73,
                        "parent_id": 84,
                        "name": "Plecos",
                        "description": "<p>Plecos, or Plecostomus, are popular freshwater fish known for their algae-eating abilities and unique, armoured appearance. These hardy bottom-dwellers are perfect for keeping your tank clean while adding a distinctive look to your aquarium. With species ranging from the small Bristlenose Pleco to the larger Sailfin Pleco, these peaceful fish make a great addition to both community tanks and larger setups.</p>",
                        "is_visible": true,
                        "sort_order": 24,
                        "children": []
                  },
                  {
                        "id": 77,
                        "parent_id": 84,
                        "name": "Pond Fish",
                        "description": "<p>Koi and Coldwater Fish are perfect for outdoor ponds and larger aquariums, known for their hardiness and striking beauty. From the vibrant colours of Koi to the peaceful grace of Goldfish, these species thrive in cooler water environments, making them ideal for garden ponds and spacious tanks. Whether you're an experienced pond keeper or just starting out, Koi and Coldwater Fish bring elegance and serenity to your aquatic setup.</p>",
                        "is_visible": true,
                        "sort_order": 20,
                        "children": []
                  },
                  {
                        "id": 80,
                        "parent_id": 84,
                        "name": "Pre-order fish",
                        "description": "<p>Species of fish that we do not have in our regular stock but have access to within 2 weeks.</p>",
                        "is_visible": false,
                        "sort_order": 28,
                        "children": []
                  },
                  {
                        "id": 121,
                        "parent_id": 84,
                        "name": "African Cichlids",
                        "description": "<p>Discover the vibrant beauty and bold personalities of African Cichlids, perfect for creating a colourful and dynamic freshwater aquarium. Known for their striking patterns and territorial behaviour, these hardy fish are ideal for experienced aquarists looking to add excitement to their tanks. From the brilliant hues of Peacock Cichlids to the fascinating behaviours of Mbunas, our selection of African Cichlids offers a variety of species that will thrive in your well-maintained aquarium.</p>",
                        "is_visible": true,
                        "sort_order": 4,
                        "children": [
                              {
                                    "id": 53,
                                    "parent_id": 121,
                                    "name": "Lake Tanganyika Cichlids",
                                    "description": "<p>Lake Tanganyika Cichlids are prized for their unique behaviours, stunning colours, and fascinating shapes, making them a standout choice for freshwater aquariums. Originating from Africa&rsquo;s Lake Tanganyika, these cichlids thrive in hard, alkaline water and rocky environments that mimic their natural habitat. Ideal for experienced aquarists, Lake Tanganyika Cichlids bring both beauty and dynamic interaction to species-specific tanks.</p>",
                                    "is_visible": true,
                                    "sort_order": 2,
                                    "children": []
                              },
                              {
                                    "id": 54,
                                    "parent_id": 121,
                                    "name": "Lake Malawi Cichlids",
                                    "description": "<p>Lake Malawi Cichlids are renowned for their vibrant colours and energetic personalities, making them a popular choice for freshwater aquariums. Native to Africa's Lake Malawi, these cichlids display a stunning range of hues and fascinating behaviours. Perfect for experienced aquarists, these hardy fish thrive in species-specific tanks with rocky environments that mimic their natural habitat, adding both beauty and excitement to your setup.</p>",
                                    "is_visible": true,
                                    "sort_order": 1,
                                    "children": []
                              },
                              {
                                    "id": 56,
                                    "parent_id": 121,
                                    "name": "Other African Cichlids",
                                    "description": "<p>Explore the diverse world of Other African Cichlids, known for their vibrant colours, territorial behaviour, and fascinating variety. From species found in lesser-known African lakes and rivers, these cichlids thrive in well-structured tanks with rock formations and plenty of space. Ideal for experienced aquarists, these hardy fish add beauty, personality, and dynamic interaction to your freshwater setup.</p>",
                                    "is_visible": true,
                                    "sort_order": 3,
                                    "children": []
                              }
                        ]
                  },
                  {
                        "id": 193,
                        "parent_id": 84,
                        "name": "Other Livestock",
                        "description": "<p>Explore our unique selection of other livestock, including fascinating amphibians that bring a dynamic and diverse touch to your aquarium or terrarium. From aquatic frogs and newts to other specialized species, these animals offer something different for those looking to create a more varied and engaging environment. Perfect for experienced keepers, amphibians and other livestock add intrigue and life to your aquatic or semi-aquatic setup.</p>",
                        "is_visible": true,
                        "sort_order": 27,
                        "children": [
                              {
                                    "id": 34,
                                    "parent_id": 193,
                                    "name": "Aquatic Frogs",
                                    "description": "<p>Aquatic Frogs, like the popular African Dwarf Frog, are lively and intriguing creatures that bring unique charm to any freshwater aquarium. These fully aquatic amphibians are easy to care for and perfect for community tanks, where they add activity and personality. Ideal for both beginners and experienced aquarists, Aquatic Frogs thrive in well-maintained environments with plenty of hiding spots and gentle filtration.</p>",
                                    "is_visible": true,
                                    "sort_order": 2,
                                    "children": []
                              },
                              {
                                    "id": 63,
                                    "parent_id": 193,
                                    "name": "Amphibians",
                                    "description": "<p>Amphibians bring a unique blend of land and water to your tank, making them fascinating additions to any aquatic or terrarium setup. From African Dwarf Frogs to Salamanders and Newts, these creatures thrive in well-maintained environments that cater to their semi-aquatic nature. Perfect for experienced hobbyists, amphibians add a sense of wonder and biodiversity to your collection.</p>",
                                    "is_visible": true,
                                    "sort_order": 1,
                                    "children": []
                              },
                              {
                                    "id": 78,
                                    "parent_id": 193,
                                    "name": "Reptiles",
                                    "description": "<p>Reptiles bring a fascinating, exotic presence to any terrarium or vivarium setup. From colourful lizards to unique turtles and snakes, these cold-blooded creatures are perfect for hobbyists looking to create a diverse, engaging environment. With species like Bearded Dragons, Leopard Geckos, and aquatic turtles, our selection offers a wide range of reptiles that will captivate and intrigue both beginners and experienced reptile keepers alike.<br /><strong>Our reptiles available for in-store collection only.</strong></p>",
                                    "is_visible": true,
                                    "sort_order": 3,
                                    "children": []
                              }
                        ]
                  },
                  {
                        "id": 196,
                        "parent_id": 84,
                        "name": "Axolotls",
                        "description": "<p>Axolotls are fascinating, aquatic amphibians known for their unique appearance and regenerative abilities. With their cute, smile-like faces and feathery gills, these captivating creatures make a one-of-a-kind addition to any freshwater setup. Perfect for experienced aquarists, Axolotls thrive in cool, well-maintained tanks with plenty of hiding spots, adding charm and intrigue to your aquarium.</p>",
                        "is_visible": true,
                        "sort_order": 3,
                        "children": []
                  },
                  {
                        "id": 198,
                        "parent_id": 84,
                        "name": "Algae Eaters",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 1,
                        "children": []
                  },
                  {
                        "id": 202,
                        "parent_id": 84,
                        "name": "Nano Fish",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 2,
                        "children": []
                  }
            ]
      },
      {
            "id": 85,
            "parent_id": 0,
            "name": "Reptile Supplies",
            "description": "<p>Find everything you need to keep your reptiles healthy and thriving with our wide range of Reptile Supplies. From high-quality terrariums and heating equipment to nutritious food and habitat accessories, we have all the essentials to create a comfortable and stimulating environment for your reptiles. Whether you're caring for a Bearded Dragon, Gecko, or Snake, our reptile supplies ensure your pets receive the best care.</p>",
            "is_visible": true,
            "sort_order": 10,
            "children": [
                  {
                        "id": 74,
                        "parent_id": 85,
                        "name": "Reptile Kits",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 3,
                        "children": []
                  },
                  {
                        "id": 76,
                        "parent_id": 85,
                        "name": "Thermostats",
                        "description": " ",
                        "is_visible": true,
                        "sort_order": 5,
                        "children": []
                  },
                  {
                        "id": 79,
                        "parent_id": 85,
                        "name": "Reptile Foods and Supplements",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 4,
                        "children": []
                  },
                  {
                        "id": 81,
                        "parent_id": 85,
                        "name": "Reptile Accessories",
                        "description": "<p>Complete your reptile&rsquo;s habitat with our wide range of Reptile Accessories, designed to enhance comfort, health, and enrichment. From climbing branches and basking platforms to hideaways and decour, these accessories help create a stimulating and natural environment for your reptiles. Whether you&rsquo;re caring for a Gecko, Snake, or Tortoise, our selection of reptile accessories ensures your pets thrive in a well-equipped and engaging setup.</p>",
                        "is_visible": true,
                        "sort_order": 6,
                        "children": []
                  },
                  {
                        "id": 192,
                        "parent_id": 85,
                        "name": "Reptile Lighting",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 2,
                        "children": []
                  },
                  {
                        "id": 197,
                        "parent_id": 85,
                        "name": "Reptile Substrates",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 1,
                        "children": []
                  },
                  {
                        "id": 199,
                        "parent_id": 85,
                        "name": "Reptile Water Conditioners",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 0,
                        "children": []
                  },
                  {
                        "id": 200,
                        "parent_id": 85,
                        "name": "Reptile Treatments",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 0,
                        "children": []
                  }
            ]
      },
      {
            "id": 89,
            "parent_id": 0,
            "name": "Live Aquarium Plants",
            "description": "<p>Bring your aquarium to life with our vibrant selection of Live Aquarium Plants. From lush foreground carpets to tall, elegant background plants, these living additions help create a natural, balanced ecosystem. Not only do aquatic plants enhance the beauty of your tank, but they also improve water quality by absorbing excess nutrients and providing oxygen. Whether you're designing a planted aquarium or adding greenery to your community tank, our selection of live plants offers a variety of species to suit any setup.</p>",
            "is_visible": true,
            "sort_order": 6,
            "children": [
                  {
                        "id": 101,
                        "parent_id": 89,
                        "name": "Aquarium Potted Plants",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 8,
                        "children": []
                  },
                  {
                        "id": 102,
                        "parent_id": 89,
                        "name": "Moss",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 1,
                        "children": []
                  },
                  {
                        "id": 123,
                        "parent_id": 89,
                        "name": "Aquarium Plant Bunches",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 9,
                        "children": []
                  },
                  {
                        "id": 187,
                        "parent_id": 89,
                        "name": "Plant Care",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 10,
                        "children": []
                  },
                  {
                        "id": 195,
                        "parent_id": 89,
                        "name": "Tropica 1-2-Grow!",
                        "description": "<p>Elevate your aquascaping with Tropica 1-2-Grow!, renowned for their exceptional quality and vibrant beauty. Whether you're setting up a lush, planted aquarium or looking to enhance your current tank, Tropica offers a wide range of aquatic plants suitable for beginners and experts alike. From hardy species that thrive in various conditions to advanced plants for more specialized setups, Tropica plants help create a thriving, natural ecosystem that supports the health and beauty of your aquarium.</p>",
                        "is_visible": true,
                        "sort_order": 7,
                        "children": []
                  },
                  {
                        "id": 216,
                        "parent_id": 89,
                        "name": "Background Plants",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 4,
                        "children": []
                  },
                  {
                        "id": 218,
                        "parent_id": 89,
                        "name": "Foreground Plants",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 2,
                        "children": []
                  },
                  {
                        "id": 230,
                        "parent_id": 89,
                        "name": "Midground Plants",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 3,
                        "children": []
                  },
                  {
                        "id": 232,
                        "parent_id": 89,
                        "name": "Floating Plants",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 5,
                        "children": []
                  }
            ]
      },
      {
            "id": 90,
            "parent_id": 0,
            "name": "Aquarium Supplies",
            "description": "<p>Ensure your aquarium is a thriving, healthy habitat with our complete range of Aquarium Supplies. From essential filtration systems and water treatments to aquarium lighting, heaters, and decorations, we offer everything you need to create a balanced and beautiful environment for your fish and plants. Whether you're maintaining a freshwater, tropical, or planted tank, our supplies will help you keep your aquatic ecosystem clean, vibrant, and well-cared for.</p>",
            "is_visible": true,
            "sort_order": 4,
            "children": [
                  {
                        "id": 206,
                        "parent_id": 90,
                        "name": "Aquarium Additives",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 1,
                        "children": [
                              {
                                    "id": 68,
                                    "parent_id": 206,
                                    "name": "Freshwater Test Kits",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 3,
                                    "children": []
                              },
                              {
                                    "id": 207,
                                    "parent_id": 206,
                                    "name": "Freshwater Supplements & Conditioners",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 2,
                                    "children": []
                              },
                              {
                                    "id": 208,
                                    "parent_id": 206,
                                    "name": "Freshwater Medications",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 1,
                                    "children": []
                              }
                        ]
                  },
                  {
                        "id": 210,
                        "parent_id": 90,
                        "name": "Aquarium Accessories",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 4,
                        "children": [
                              {
                                    "id": 211,
                                    "parent_id": 210,
                                    "name": "Cleaning Equipment",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 0,
                                    "children": []
                              }
                        ]
                  },
                  {
                        "id": 212,
                        "parent_id": 90,
                        "name": "Filtration",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 2,
                        "children": [
                              {
                                    "id": 66,
                                    "parent_id": 212,
                                    "name": "External Filters",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 2,
                                    "children": []
                              },
                              {
                                    "id": 98,
                                    "parent_id": 212,
                                    "name": "Internal Filters",
                                    "description": "<p>Maintain crystal-clear water and a healthy environment with our efficient Internal Filters. Designed to fit discreetly inside your aquarium, these filters provide powerful filtration by removing debris, waste, and harmful toxins, ensuring optimal water quality for your fish and plants. Ideal for freshwater tanks, our internal filters are easy to install and maintain, making them a perfect choice for aquarists of all levels.</p>",
                                    "is_visible": true,
                                    "sort_order": 1,
                                    "children": []
                              },
                              {
                                    "id": 169,
                                    "parent_id": 212,
                                    "name": "Filter Media",
                                    "description": "",
                                    "is_visible": false,
                                    "sort_order": 3,
                                    "children": []
                              },
                              {
                                    "id": 186,
                                    "parent_id": 212,
                                    "name": "Filter Pumps",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 4,
                                    "children": []
                              },
                              {
                                    "id": 209,
                                    "parent_id": 212,
                                    "name": "Protein Skimmers",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 5,
                                    "children": []
                              }
                        ]
                  },
                  {
                        "id": 214,
                        "parent_id": 90,
                        "name": "Aquatic Equipment",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 3,
                        "children": [
                              {
                                    "id": 65,
                                    "parent_id": 214,
                                    "name": "Aquarium Heaters",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 3,
                                    "children": []
                              },
                              {
                                    "id": 67,
                                    "parent_id": 214,
                                    "name": "Air Pumps",
                                    "description": "<p>Keep your aquarium well-oxygenated and healthy with our reliable Air Pumps. Essential for promoting water circulation and ensuring your fish and plants get the oxygen they need, our selection of air pumps is perfect for freshwater tanks. From quiet, energy-efficient models to powerful pumps for larger aquariums, you'll find the perfect solution to maintain a balanced and thriving aquatic environment.</p>",
                                    "is_visible": true,
                                    "sort_order": 1,
                                    "children": []
                              },
                              {
                                    "id": 75,
                                    "parent_id": 214,
                                    "name": "LED Lighting",
                                    "description": "",
                                    "is_visible": true,
                                    "sort_order": 2,
                                    "children": []
                              }
                        ]
                  }
            ]
      },
      {
            "id": 91,
            "parent_id": 0,
            "name": "Freshwater Fish Food",
            "description": "<p>Keep your fish healthy and thriving with our high-quality Fish Food. From flakes and pellets to freeze-dried and frozen options, we offer a wide range of nutritious foods to meet the dietary needs of all freshwater species. Whether you're feeding herbivores, carnivores, or omnivores, our selection ensures your fish receive balanced, essential nutrition for vibrant colours, energy, and overall well-being.</p>",
            "is_visible": true,
            "sort_order": 5,
            "children": [
                  {
                        "id": 215,
                        "parent_id": 91,
                        "name": "Brine Shrimp (Artemia)",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 4,
                        "children": []
                  },
                  {
                        "id": 220,
                        "parent_id": 91,
                        "name": "Tropical Fish Food",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 3,
                        "children": []
                  },
                  {
                        "id": 224,
                        "parent_id": 91,
                        "name": "Frozen Food",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 5,
                        "children": []
                  },
                  {
                        "id": 225,
                        "parent_id": 91,
                        "name": "Live Food",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 6,
                        "children": []
                  },
                  {
                        "id": 233,
                        "parent_id": 91,
                        "name": "Holiday Food",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 8,
                        "children": []
                  },
                  {
                        "id": 238,
                        "parent_id": 91,
                        "name": "Freshwater Flake Food",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 1,
                        "children": []
                  },
                  {
                        "id": 239,
                        "parent_id": 91,
                        "name": "Goldfish Food",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 7,
                        "children": []
                  },
                  {
                        "id": 240,
                        "parent_id": 91,
                        "name": "Freshwater Pellet Food",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 2,
                        "children": []
                  }
            ]
      },
      {
            "id": 194,
            "parent_id": 0,
            "name": "Aquarium Decor",
            "description": "<p>Transform your aquarium into a stunning underwater landscape with our wide range of Aquascaping supplies. From natural rocks and driftwood to aquatic plants and substrate, we offer everything you need to create a beautiful, balanced ecosystem. Whether you're designing a lush planted tank or a minimalist hardscape, our aquascaping tools and decour will help you achieve your creative vision while providing a healthy environment for your fish and plants.</p>",
            "is_visible": true,
            "sort_order": 9,
            "children": [
                  {
                        "id": 189,
                        "parent_id": 194,
                        "name": "Aquarium Ornaments",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 5,
                        "children": []
                  },
                  {
                        "id": 222,
                        "parent_id": 194,
                        "name": "Gravel And Sand",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 3,
                        "children": []
                  },
                  {
                        "id": 223,
                        "parent_id": 194,
                        "name": "Rock And Wood",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 1,
                        "children": []
                  },
                  {
                        "id": 228,
                        "parent_id": 194,
                        "name": "Botanicals",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 4,
                        "children": []
                  },
                  {
                        "id": 229,
                        "parent_id": 194,
                        "name": "Soil and Substrate",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 2,
                        "children": []
                  }
            ]
      },
      {
            "id": 204,
            "parent_id": 0,
            "name": "Pond",
            "description": "",
            "is_visible": true,
            "sort_order": 3,
            "children": [
                  {
                        "id": 203,
                        "parent_id": 204,
                        "name": "Pond Additives & Treatments",
                        "description": "",
                        "is_visible": false,
                        "sort_order": 1,
                        "children": []
                  },
                  {
                        "id": 226,
                        "parent_id": 204,
                        "name": "Pond Plants",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 3,
                        "children": []
                  },
                  {
                        "id": 227,
                        "parent_id": 204,
                        "name": "Pond Food",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 2,
                        "children": []
                  },
                  {
                        "id": 241,
                        "parent_id": 204,
                        "name": "Pond Fish",
                        "description": "",
                        "is_visible": true,
                        "sort_order": 0,
                        "children": []
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