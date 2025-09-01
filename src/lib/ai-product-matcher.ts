import { SpeciesData, ProductRecommendation, CareEcosystem, SmartBundle } from '@/types/catalog';
import { BigCommerceDiscovery } from './bigcommerce-discovery';

/**
 * AI Product Matching Engine
 * Intelligently matches products to fish species based on care requirements
 */
export class AIProductMatcher {
  
  /**
   * Generate complete care ecosystem for a species
   */
  static async generateCareEcosystem(speciesData: SpeciesData): Promise<CareEcosystem> {
    // Ensure products are loaded
    await BigCommerceDiscovery.syncProducts();

    const specs = speciesData.specifications;
    const commonName = speciesData.commonName || '';
    const scientificName = speciesData.scientificName || '';
    
    // Extract care requirements
    const tankSizeL = this.extractTankSize(specs.minTankSize || specs.tankSize);
    const temperatureRange = specs.temperatureRange || specs.temperature || '24-26°C';
    const phRange = specs.phRange || specs.pH || '7.0';
    const diet = specs.diet || 'Omnivore';
    const fishType = this.identifyFishType(commonName, scientificName);

    return {
      setup: {
        filtration: await this.getFiltrationRecommendations(tankSizeL, fishType),
        substrate: await this.getSubstrateRecommendations(fishType, phRange),
        decoration: await this.getDecorationRecommendations(fishType, tankSizeL),
        lighting: await this.getLightingRecommendations(fishType, tankSizeL),
        heating: await this.getHeatingRecommendations(tankSizeL, temperatureRange)
      },
      maintenance: {
        waterTreatment: await this.getWaterTreatmentRecommendations(fishType, phRange),
        cleaning: await this.getCleaningRecommendations(tankSizeL),
        testing: await this.getTestingRecommendations(fishType)
      },
      nutrition: {
        food: await this.getFoodRecommendations(fishType, diet),
        supplements: await this.getSupplementRecommendations(fishType, diet)
      },
      health: {
        medication: await this.getHealthRecommendations(fishType),
        quarantine: await this.getQuarantineRecommendations()
      }
    };
  }

  /**
   * Generate smart bundles based on species requirements
   */
  static async generateSmartBundles(speciesData: SpeciesData, careEcosystem: CareEcosystem): Promise<SmartBundle[]> {
    const bundles: SmartBundle[] = [];
    const commonName = speciesData.commonName || '';

    // Starter Bundle - Essentials only
    const starterProducts = [
      ...careEcosystem.setup.filtration.filter(p => p.importance === 'essential').slice(0, 1),
      ...careEcosystem.setup.heating.filter(p => p.importance === 'essential').slice(0, 1),
      ...careEcosystem.nutrition.food.filter(p => p.importance === 'essential').slice(0, 1),
      ...careEcosystem.maintenance.waterTreatment.filter(p => p.importance === 'essential').slice(0, 1),
      ...careEcosystem.maintenance.testing.filter(p => p.importance === 'essential').slice(0, 1)
    ];

    if (starterProducts.length > 0) {
      bundles.push({
        id: `${speciesData.productId}-starter`,
        name: `${commonName} Starter Kit`,
        description: `Everything you need to get started with ${commonName}. Includes essential equipment for immediate success.`,
        products: starterProducts,
        totalValue: starterProducts.reduce((sum, p) => sum + (p.price || 0), 0),
        bundlePrice: starterProducts.reduce((sum, p) => sum + (p.price || 0), 0) * 0.90, // 10% bundle discount
        savings: starterProducts.reduce((sum, p) => sum + (p.price || 0), 0) * 0.10,
        successRate: 85,
        suitableFor: [commonName],
        category: 'starter'
      });
    }

    // Complete Bundle - Essential + Recommended
    const completeProducts = [
      ...careEcosystem.setup.filtration.filter(p => ['essential', 'recommended'].includes(p.importance)).slice(0, 1),
      ...careEcosystem.setup.substrate.filter(p => ['essential', 'recommended'].includes(p.importance)).slice(0, 1),
      ...careEcosystem.setup.decoration.filter(p => ['essential', 'recommended'].includes(p.importance)).slice(0, 2),
      ...careEcosystem.setup.heating.filter(p => p.importance === 'essential').slice(0, 1),
      ...careEcosystem.nutrition.food.filter(p => ['essential', 'recommended'].includes(p.importance)).slice(0, 2),
      ...careEcosystem.maintenance.waterTreatment.filter(p => ['essential', 'recommended'].includes(p.importance)),
      ...careEcosystem.maintenance.testing.filter(p => p.importance === 'essential').slice(0, 1)
    ];

    if (completeProducts.length > 0) {
      bundles.push({
        id: `${speciesData.productId}-complete`,
        name: `Complete ${commonName} Setup`,
        description: `Professional-grade setup for ${commonName} success. Includes everything for optimal care and thriving fish.`,
        products: completeProducts,
        totalValue: completeProducts.reduce((sum, p) => sum + (p.price || 0), 0),
        bundlePrice: completeProducts.reduce((sum, p) => sum + (p.price || 0), 0) * 0.85, // 15% bundle discount
        savings: completeProducts.reduce((sum, p) => sum + (p.price || 0), 0) * 0.15,
        successRate: 94,
        suitableFor: [commonName],
        category: 'complete'
      });
    }

    return bundles;
  }

  // Helper methods for specific product categories

  private static async getFiltrationRecommendations(tankSizeL: number, fishType: string): Promise<ProductRecommendation[]> {
    const filterProducts = BigCommerceDiscovery.getProductsByCategory('Filtration');
    const suitableFilters = BigCommerceDiscovery.getProductsByTankSize(tankSizeL);
    
    const recommendations: ProductRecommendation[] = [];
    
    // Find filters suitable for tank size
    const matchingFilters = filterProducts.filter(product => 
      suitableFilters.some(suitable => suitable.id === product.id)
    );

    matchingFilters.slice(0, 2).forEach((product, index) => {
      recommendations.push({
        id: product.id.toString(),
        name: product.name,
        category: 'Filtration',
        price: product.price,
        bigCommerceId: product.id,
        reason: `Perfect for ${tankSizeL}L tanks. ${this.getFilterReasonByFishType(fishType)}`,
        importance: index === 0 ? 'essential' : 'recommended',
        stage: 'setup'
      });
    });

    return recommendations;
  }

  private static async getSubstrateRecommendations(fishType: string, _phRange: string): Promise<ProductRecommendation[]> {
    const substrateProducts = BigCommerceDiscovery.getProductsByCategory('Substrates');
    const recommendations: ProductRecommendation[] = [];

    substrateProducts.slice(0, 2).forEach((product, index) => {
      const suitable = true;
      let reason = '';

      // Check pH compatibility
      const phEffect = product.custom_fields?.find(f => f.name === 'ph_effect')?.value || '';
      const suitableFor = product.custom_fields?.find(f => f.name === 'suitable_for')?.value || '';

      if (fishType === 'cichlid' && phEffect.includes('raises pH')) {
        reason = 'Raises pH naturally - perfect for African Cichlids';
      } else if (fishType === 'tetra' && phEffect.includes('lowers pH')) {
        reason = 'Maintains soft water conditions ideal for tetras';
      } else if (suitableFor.toLowerCase().includes(fishType)) {
        reason = `Specially designed for ${fishType}s`;
      } else {
        reason = 'Neutral substrate suitable for community setups';
      }

      if (suitable) {
        recommendations.push({
          id: product.id.toString(),
          name: product.name,
          category: 'Substrate',
          price: product.price,
          bigCommerceId: product.id,
          reason,
          importance: index === 0 ? 'essential' : 'recommended',
          stage: 'setup'
        });
      }
    });

    return recommendations;
  }

  private static async getDecorationRecommendations(fishType: string, tankSizeL: number): Promise<ProductRecommendation[]> {
    const decorationProducts = BigCommerceDiscovery.getProductsByCategory('Decoration');
    const recommendations: ProductRecommendation[] = [];

    decorationProducts.forEach((product, index) => {
      let reason = '';
      const suitable = true;

      if (fishType === 'cichlid' && product.name.toLowerCase().includes('rock')) {
        reason = 'Provides territories and caves - essential for cichlid well-being';
      } else if (fishType === 'pleco' && product.name.toLowerCase().includes('driftwood')) {
        reason = 'Plecos rasp driftwood for nutrition and it provides natural tannins';
      } else if (product.name.toLowerCase().includes('cave')) {
        reason = 'Provides hiding spots reducing stress and territorial disputes';
      } else {
        reason = 'Adds natural aesthetics and fish enrichment';
      }

      if (suitable && index < 3) {
        recommendations.push({
          id: product.id.toString(),
          name: product.name,
          category: 'Decoration',
          price: product.price,
          bigCommerceId: product.id,
          reason,
          importance: index === 0 ? 'recommended' : 'advanced',
          stage: 'setup'
        });
      }
    });

    return recommendations;
  }

  private static async getFoodRecommendations(fishType: string, diet: string): Promise<ProductRecommendation[]> {
    const foodProducts = BigCommerceDiscovery.getProductsByCategory('Food');
    const recommendations: ProductRecommendation[] = [];

    // Filter foods by fish type
    const suitableFoods = foodProducts.filter(product => {
      const fishTypeField = product.custom_fields?.find(f => f.name === 'fish_type')?.value || '';
      return fishTypeField.toLowerCase().includes(fishType) || 
             product.name.toLowerCase().includes(fishType);
    });

    suitableFoods.slice(0, 3).forEach((product, index) => {
      recommendations.push({
        id: product.id.toString(),
        name: product.name,
        category: 'Food',
        price: product.price,
        bigCommerceId: product.id,
        reason: `Specially formulated for ${fishType}s. ${this.getFoodReasonByDiet(diet)}`,
        importance: index === 0 ? 'essential' : 'recommended',
        stage: 'nutrition'
      });
    });

    return recommendations;
  }

  private static async getWaterTreatmentRecommendations(fishType: string, _phRange: string): Promise<ProductRecommendation[]> {
    const treatmentProducts = BigCommerceDiscovery.getProductsByCategory('Water Treatment');
    const recommendations: ProductRecommendation[] = [];

    treatmentProducts.forEach((product, _index) => {
      let reason = '';
      let importance: 'essential' | 'recommended' | 'advanced' = 'recommended';

      if (product.name.toLowerCase().includes('prime') || product.name.toLowerCase().includes('conditioner')) {
        reason = 'Essential for removing chlorine and chloramines from tap water';
        importance = 'essential';
      } else if (fishType === 'cichlid' && product.name.toLowerCase().includes('ph 8')) {
        reason = 'Maintains ideal alkaline pH for African Cichlids';
        importance = 'recommended';
      } else if (product.name.toLowerCase().includes('buffer')) {
        reason = 'Stabilizes pH and prevents dangerous fluctuations';
      } else {
        reason = 'Improves water quality and fish health';
      }

      recommendations.push({
        id: product.id.toString(),
        name: product.name,
        category: 'Water Treatment',
        price: product.price,
        bigCommerceId: product.id,
        reason,
        importance,
        stage: 'maintenance'
      });
    });

    return recommendations.slice(0, 3);
  }

  private static async getHeatingRecommendations(tankSizeL: number, temperatureRange: string): Promise<ProductRecommendation[]> {
    const heatingProducts = BigCommerceDiscovery.getProductsByCategory('Heating');
    const suitableHeaters = BigCommerceDiscovery.getProductsByTankSize(tankSizeL);
    
    const matchingHeaters = heatingProducts.filter(product => 
      suitableHeaters.some(suitable => suitable.id === product.id)
    );

    return matchingHeaters.slice(0, 1).map(product => ({
      id: product.id.toString(),
      name: product.name,
      category: 'Heating',
      price: product.price,
      bigCommerceId: product.id,
      reason: `Properly sized for ${tankSizeL}L tank. Maintains stable ${temperatureRange} temperature.`,
      importance: 'essential' as const,
      stage: 'setup' as const
    }));
  }

  private static async getLightingRecommendations(_fishType: string, _tankSizeL: number): Promise<ProductRecommendation[]> {
    // Basic lighting recommendation - could be expanded with actual lighting products
    return [];
  }

  private static async getCleaningRecommendations(_tankSizeL: number): Promise<ProductRecommendation[]> {
    return [];
  }

  private static async getTestingRecommendations(_fishType: string): Promise<ProductRecommendation[]> {
    const testingProducts = BigCommerceDiscovery.getProductsByCategory('Testing');
    
    return testingProducts.slice(0, 1).map(product => ({
      id: product.id.toString(),
      name: product.name,
      category: 'Testing',
      price: product.price,
      bigCommerceId: product.id,
      reason: 'Essential for monitoring water quality and preventing fish health issues',
      importance: 'essential' as const,
      stage: 'maintenance' as const
    }));
  }

  private static async getSupplementRecommendations(_fishType: string, _diet: string): Promise<ProductRecommendation[]> {
    return [];
  }

  private static async getHealthRecommendations(_fishType: string): Promise<ProductRecommendation[]> {
    return [];
  }

  private static async getQuarantineRecommendations(): Promise<ProductRecommendation[]> {
    return [];
  }

  // Helper utility methods

  private static extractTankSize(tankSizeStr: string): number {
    const match = tankSizeStr.match(/(\d+)L?/);
    return match ? parseInt(match[1]) : 100; // Default to 100L
  }

  private static identifyFishType(commonName: string, scientificName: string): string {
    const name = `${commonName} ${scientificName}`.toLowerCase();
    
    if (name.includes('cichlid') || name.includes('labidochromis') || name.includes('pseudotropheus')) return 'cichlid';
    if (name.includes('tetra') || name.includes('paracheirodon')) return 'tetra';
    if (name.includes('betta') || name.includes('siamese fighting')) return 'betta';
    if (name.includes('goldfish') || name.includes('carassius')) return 'goldfish';
    if (name.includes('guppy') || name.includes('poecilia reticulata')) return 'guppy';
    if (name.includes('pleco') || name.includes('ancistrus')) return 'pleco';
    if (name.includes('angelfish') || name.includes('pterophyllum')) return 'angelfish';
    if (name.includes('discus') || name.includes('symphysodon')) return 'discus';
    
    return 'community';
  }

  private static getFilterReasonByFishType(fishType: string): string {
    const reasons: Record<string, string> = {
      'cichlid': 'African Cichlids produce significant waste and need excellent biological filtration.',
      'goldfish': 'Goldfish are messy and need powerful mechanical and biological filtration.',
      'pleco': 'Large catfish need strong current and excellent filtration capacity.',
      'discus': 'Discus require pristine water quality with gentle flow.',
      'community': 'Provides excellent biological and mechanical filtration for community tanks.'
    };
    
    return reasons[fishType] || reasons['community'];
  }

  private static getFoodReasonByDiet(diet: string): string {
    const reasons: Record<string, string> = {
      'Omnivore': 'Balanced nutrition with both plant and animal proteins.',
      'Carnivore': 'High protein content for optimal growth and health.',
      'Herbivore': 'Plant-based nutrition with essential vitamins and minerals.'
    };
    
    return reasons[diet] || reasons['Omnivore'];
  }
}