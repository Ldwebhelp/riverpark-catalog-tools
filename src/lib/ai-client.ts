/**
 * AI Client for connecting catalog-tools to riverpark-catalyst-fresh AI system
 * Handles species data generation, batch processing, and file management
 */

export interface AISpeciesRequest {
  productId: string;
  name: string;
  scientificName?: string;
  commonName?: string;
  provider?: 'openai' | 'mock';
  availableProducts?: any[];
  includeProductRecommendations?: boolean;
}

export interface AISpeciesResponse {
  productId: string;
  type: string;
  scientificName: string;
  commonName: string;
  specifications: {
    'Min Tank Size': string;
    'Temperature': string;
    'pH Range': string;
    'Max Size': string;
    'Diet': string;
    'Group Size': string;
    'Difficulty': string;
    'Temperament': string;
  };
  species: {
    family: string;
    habitat: string;
    origin: string;
    lifespan: string;
    waterType: string;
    description: string;
  };
  generatedAt: string;
  aiProvider: string;
}

export interface AIGenerationStatus {
  success: boolean;
  productId: string;
  fileName?: string;
  filePath?: string;
  error?: string;
  duration?: number;
}

export interface BatchGenerationProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: AIGenerationStatus[];
}

export class AIClient {
  private baseUrl: string;
  private timeout: number;

  constructor(options: { baseUrl?: string; timeout?: number } = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3002'; // Default to riverpark-catalyst-fresh
    this.timeout = options.timeout || 30000; // 30 second timeout
  }

  /**
   * Generate species data for a single product
   */
  async generateSpeciesData(request: AISpeciesRequest): Promise<AISpeciesResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/generate-species`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Generated species data for product ${request.productId} in ${Date.now() - startTime}ms`);
      
      return data;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to generate species data for product ${request.productId} (${duration}ms):`, error);
      throw error;
    }
  }

  /**
   * Generate enhanced ecosystem with product recommendations
   */
  async generateEcosystem(request: AISpeciesRequest): Promise<any> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/generate-ecosystem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI ecosystem generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Generated ecosystem for product ${request.productId} in ${Date.now() - startTime}ms`);
      
      return data;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to generate ecosystem for product ${request.productId} (${duration}ms):`, error);
      throw error;
    }
  }

  /**
   * Save generated species data to file system
   */
  async saveSpeciesData(speciesData: AISpeciesResponse): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/save-species`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(speciesData),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return { success: true, filePath: result.filePath };

    } catch (error) {
      console.error(`❌ Failed to save species data for product ${speciesData.productId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown save error' 
      };
    }
  }

  /**
   * Load existing species data from file system
   */
  async loadExistingSpeciesData(productId: string): Promise<AISpeciesResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/load-species/${productId}`, {
        signal: AbortSignal.timeout(this.timeout),
      });

      if (response.status === 404) {
        return null; // File doesn't exist
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Load failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();

    } catch (error) {
      console.error(`❌ Failed to load existing species data for product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Generate species data for a single product with automatic save
   */
  async generateAndSave(request: AISpeciesRequest): Promise<AIGenerationStatus> {
    const startTime = Date.now();
    
    try {
      // Generate the species data
      const speciesData = await this.generateSpeciesData(request);
      
      // Save to file system
      const saveResult = await this.saveSpeciesData(speciesData);
      
      const duration = Date.now() - startTime;
      
      if (saveResult.success) {
        return {
          success: true,
          productId: request.productId,
          fileName: `${request.productId}-species.json`,
          filePath: saveResult.filePath,
          duration
        };
      } else {
        return {
          success: false,
          productId: request.productId,
          error: `Generation succeeded but save failed: ${saveResult.error}`,
          duration
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        productId: request.productId,
        error: error instanceof Error ? error.message : 'Unknown generation error',
        duration
      };
    }
  }

  /**
   * Batch generate species data for multiple products
   */
  async batchGenerate(
    requests: AISpeciesRequest[],
    options: {
      concurrency?: number;
      onProgress?: (progress: BatchGenerationProgress) => void;
      skipExisting?: boolean;
    } = {}
  ): Promise<BatchGenerationProgress> {
    const { concurrency = 3, onProgress, skipExisting = true } = options;
    
    const progress: BatchGenerationProgress = {
      total: requests.length,
      completed: 0,
      failed: 0,
      status: 'running',
      results: []
    };

    // Filter out existing files if skipExisting is true
    let filteredRequests = requests;
    if (skipExisting) {
      console.log('🔍 Checking for existing species files...');
      const existingChecks = await Promise.allSettled(
        requests.map(async (req) => {
          const existing = await this.loadExistingSpeciesData(req.productId);
          return { request: req, exists: existing !== null };
        })
      );

      filteredRequests = existingChecks
        .filter(result => result.status === 'fulfilled' && !result.value.exists)
        .map(result => (result as PromiseFulfilledResult<any>).value.request);

      const skippedCount = requests.length - filteredRequests.length;
      if (skippedCount > 0) {
        console.log(`⏭️  Skipping ${skippedCount} products that already have species data`);
      }

      progress.total = filteredRequests.length;
    }

    if (filteredRequests.length === 0) {
      progress.status = 'completed';
      return progress;
    }

    console.log(`🚀 Starting batch generation of ${filteredRequests.length} species files with concurrency ${concurrency}`);

    // Process requests in batches with concurrency limit
    for (let i = 0; i < filteredRequests.length; i += concurrency) {
      const batch = filteredRequests.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (request) => {
          progress.current = `${request.commonName || request.name} (${request.productId})`;
          onProgress?.(progress);
          
          return this.generateAndSave(request);
        })
      );

      // Process batch results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          const status = result.value;
          progress.results.push(status);
          
          if (status.success) {
            progress.completed++;
            console.log(`✅ Generated: ${status.productId} - ${status.fileName}`);
          } else {
            progress.failed++;
            console.error(`❌ Failed: ${status.productId} - ${status.error}`);
          }
        } else {
          progress.failed++;
          console.error(`❌ Batch item failed:`, result.reason);
        }
      }

      onProgress?.(progress);

      // Small delay between batches to avoid overwhelming the server
      if (i + concurrency < filteredRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    progress.status = progress.failed === 0 ? 'completed' : 'completed';
    progress.current = undefined;

    console.log(`🎉 Batch generation completed: ${progress.completed} successful, ${progress.failed} failed`);

    return progress;
  }

  /**
   * Check if the AI service is available
   */
  async healthCheck(): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return { 
          available: false, 
          error: `Health check failed: ${response.status} ${response.statusText}` 
        };
      }

      return { available: true };

    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Get statistics about generated species files
   */
  async getGenerationStats(): Promise<{
    totalGenerated: number;
    successfulGenerations: number;
    failedGenerations: number;
    lastGeneration?: string;
  }> {
    // This would require an endpoint in the AI system to track stats
    // For now, return basic info
    return {
      totalGenerated: 0,
      successfulGenerations: 0,
      failedGenerations: 0
    };
  }
}

/**
 * Default AI client instance
 * Can be configured via environment variables
 */
export const aiClient = new AIClient({
  baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:3002',
  timeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000')
});

/**
 * Utility function to extract species info from product data
 */
export function extractSpeciesInfo(product: any): {
  scientificName?: string;
  commonName?: string;
} {
  const productName = product.name || product.productName || '';
  
  // Extract scientific name from parentheses
  const scientificMatch = productName.match(/\(([A-Z][a-z]+\s+[a-z]+)\)/);
  const scientificName = scientificMatch ? scientificMatch[1] : undefined;
  
  // Extract common name (everything before parentheses)
  let commonName = productName
    .replace(/\([^)]+\)/g, '') // Remove parentheses content
    .replace(/\d+cm/g, '') // Remove size info
    .replace(/\d+L/g, '') // Remove volume info
    .trim()
    .replace(/\s+/g, ' '); // Clean up whitespace
  
  if (!commonName) {
    commonName = undefined;
  }
  
  return { scientificName, commonName };
}

/**
 * Create AI species request from product data
 */
export function createSpeciesRequest(
  product: any, 
  provider: 'openai' | 'mock' = 'mock'
): AISpeciesRequest {
  const { scientificName, commonName } = extractSpeciesInfo(product);
  
  return {
    productId: String(product.productId || product.id || product.entityId),
    name: product.name || product.productName || 'Unknown Product',
    scientificName,
    commonName,
    provider
  };
}