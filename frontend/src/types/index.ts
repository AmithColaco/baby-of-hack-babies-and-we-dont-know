// KAARIGAR — Core TypeScript Type Definitions

export type CraftCategory = 
  | 'all'
  | 'paintings'
  | 'ceramics'
  | 'textiles'
  | 'metalcraft'
  | 'woodcraft'
  | 'jewellery';

export interface CraftObject {
  id: string;
  accessionNo: string;
  romanNumeral: string;
  title: string;
  vernacularTitle?: string;
  craftTradition: string;
  category: 'paintings' | 'ceramics' | 'textiles' | 'metalcraft' | 'woodcraft' | 'jewellery';
  artisan: string;
  artisanTitle: string;
  atelier: string;
  region: string;
  state: string;
  period: string;
  price: number;
  currency: string;
  availability: 'Available' | 'Reserved' | 'Museum Archival Edition';
  dimensions: string;
  weight: string;
  materials: string[];
  technique: string;
  image: string;
  makingStory: {
    summary: string;
    stages: Array<{
      step: string;
      title: string;
      description: string;
    }>;
  };
  artisanBio: string;
  artisanQuote: string;
  artisanImage?: string;
  voiceClipUrl?: string;
  directArtisanSharePercent: number;
  position3D?: [number, number, number];
  rotation3D?: [number, number, number];
  scale3D?: [number, number, number];
  modelType?: 'painting' | 'pottery' | 'textile' | 'brass' | 'woodcraft' | 'jewellery';
  colorPalette?: string[];
  // Scannable Provenance & Story-Backed Pricing
  isWomenSHG?: boolean;
  shgName?: string;
  materialCost?: number;
  laborHours?: number;
  skillRatePerHour?: number;
  heritagePremium?: number;
  machineLookalikePrice?: number;
  machineLookalikeNotes?: string;
  processPhotos?: string[];
}

export interface CartItem {
  object: CraftObject;
  quantity: number;
  addedAt: number;
  customEngraving?: string;
}

export interface StoryArticle {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  craftTradition: string;
  artisan: string;
  region: string;
  coverImage: string;
  excerpt: string;
  paragraphs: string[];
  quote: string;
}

export interface CommissionQuote {
  id: string;
  request_id: string;
  artisan_id: string;
  artisan_name: string;
  artisan_phone?: string;
  estimated_price: number;
  estimated_days: number;
  material_breakdown?: string;
  quote_notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  created_at?: string;
}

export interface CommissionRequest {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  craft_tradition: string;
  description: string;
  reference_images?: string[];
  target_budget?: number;
  deadline?: string;
  status: 'OPEN' | 'QUOTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'FULFILLED' | 'CANCELLED';
  created_at?: string;
  quotes?: CommissionQuote[];
}

export interface OrderTimelineUpdate {
  id: string;
  stage_name: string;
  description?: string;
  photo_url?: string;
  created_at?: string;
}
