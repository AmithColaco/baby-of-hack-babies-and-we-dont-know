import apiClient from './client';

export interface GalleryItemRecord {
  id: string;
  title: string;
  price_inr: number;
  craft_type: string;
  image_url: string;
  artisan_name: string;
  gallery_wing: string;
  position_hint: number;
}

export interface NarrateInput {
  listing_id: string;
  language?: string;
}

export interface NarrateResponse {
  narration: string;
  listing_id: string;
}

export async function getGalleryItems(craft?: string): Promise<GalleryItemRecord[]> {
  const { data } = await apiClient.get<GalleryItemRecord[]>('/gallery', {
    params: craft ? { craft } : undefined,
  });
  return data;
}

export async function getGuideNarration(listingId: string, language: string = 'en'): Promise<NarrateResponse> {
  const { data } = await apiClient.post<NarrateResponse>('/guide/narrate', {
    listing_id: listingId,
    language,
  });
  return data;
}
