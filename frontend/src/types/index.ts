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
  directArtisanSharePercent: number;
  position3D?: [number, number, number];
  rotation3D?: [number, number, number];
  scale3D?: [number, number, number];
  modelType?: 'painting' | 'pottery' | 'textile' | 'brass' | 'woodcraft' | 'jewellery';
  colorPalette?: string[];
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
