export interface SpeciesData {
  id: string;
  productId: string;
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
  content: Record<string, unknown>;
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