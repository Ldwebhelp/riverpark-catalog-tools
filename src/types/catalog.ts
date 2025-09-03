export interface SpeciesData {
  id: string;
  productId: string;
  type?: string;
  scientificName?: string;
  commonName?: string;
  specifications: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GuideData {
  id: string;
  title: string;
  slug: string;
  species: string;
  content: any;
  createdAt: string;
}

export interface GuideSection {
  title: string;
  content: string;
}

export interface GeneratedGuide {
  id: string;
  title: string;
  slug: string;
  species: string;
  productId?: string;
  type?: string;
  sections: GuideSection[];
  createdAt: string;
}

export interface GenerationStats {
  totalProcessed: number;
  enhanced: number;
  fallbackUsed: number;
  errors: number;
  [key: string]: number;
}

export interface SessionData {
  id: string;
  userId?: string;
  data: any[];
  stats: Record<string, number>;
  timestamp: string;
  type: 'species' | 'guides';
}

export interface DownloadHistory {
  sessionId: string;
  fileName: string;
  downloadedAt: string;
  fileType: 'species' | 'guide';
}

// AI Product Recommendation System Types
export interface ProductRecommendation {
  id: string;
  name: string;
  category: string;
  price?: number;
  bigCommerceId?: number;
  reason: string;
  importance: 'essential' | 'recommended' | 'advanced';
  stage: 'setup' | 'maintenance' | 'nutrition' | 'decoration' | 'health';
}

export interface CareEcosystem {
  setup: {
    filtration: ProductRecommendation[];
    substrate: ProductRecommendation[];
    decoration: ProductRecommendation[];
    lighting: ProductRecommendation[];
    heating: ProductRecommendation[];
  };
  maintenance: {
    waterTreatment: ProductRecommendation[];
    cleaning: ProductRecommendation[];
    testing: ProductRecommendation[];
  };
  nutrition: {
    food: ProductRecommendation[];
    supplements: ProductRecommendation[];
  };
  health: {
    medication: ProductRecommendation[];
    quarantine: ProductRecommendation[];
  };
}

export interface SmartBundle {
  id: string;
  name: string;
  description: string;
  products: ProductRecommendation[];
  totalValue: number;
  bundlePrice: number;
  savings: number;
  successRate?: number;
  suitableFor: string[];
  category: 'starter' | 'complete' | 'advanced' | 'maintenance';
}

export interface AIEnhancedGuide extends GeneratedGuide {
  careEcosystem: CareEcosystem;
  smartBundles: SmartBundle[];
  aiMetadata: {
    searchKeywords: string[];
    commonQuestions: Array<{ question: string; answer: string }>;
    compatibleSpecies: string[];
    avoidWith: string[];
    ukSpecific: {
      energyCost: string;
      waterHardness: string;
      seasonalCare: string[];
    };
  };
}

export interface BigCommerceProduct {
  id: number;
  name: string;
  type: string;
  sku?: string;
  description?: string;
  price: number;
  categories: string[];
  inventory_level?: number;
  weight?: number;
  brand?: string;
  custom_fields?: Array<{ name: string; value: string }>;
}