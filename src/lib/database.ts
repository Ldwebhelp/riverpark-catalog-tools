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
}