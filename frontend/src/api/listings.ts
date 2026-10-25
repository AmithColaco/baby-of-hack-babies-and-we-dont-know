import apiClient from './client';

export interface ListingImage {
  id: string;
  url: string;
  position: number;
}

export interface StoryRecord {
  id: string;
  origin_text: string;
  process_text: string;
  price_rationale_json: string;
  qr_code_url: string;
}

export interface ListingRecord {
  id: string;
  artisan_id: string;
  title: string;
  description: string;
  craft_type: string;
  materials: string;
  technique: string;
  dimensions: string;
  hours_to_make: number;
  price_inr: number;
  stock: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  gallery_wing: string;
  created_at: string;
  images: ListingImage[];
  story?: StoryRecord | null;
  artisan_name?: string;
  artisan_village?: string;
  is_women_shg?: boolean;
  shg_name?: string;
  material_cost?: number;
  skill_rate_per_hour?: number;
  heritage_premium?: number;
  machine_lookalike_price?: number;
  machine_lookalike_notes?: string;
  voice_clip_url?: string;
}

export interface CraftReferenceRecord {
  craft_type: string;
  origin_text: string;
  premium_multiplier: number;
  notes: string;
}

export interface PriceSuggestionInput {
  craft_type: string;
  hours_to_make: number;
  materials_cost: number;
  technique_complexity: 'low' | 'medium' | 'high' | 'very_high';
}

export interface PriceBreakdownResponse {
  materials_cost: number;
  labour_cost: number;
  fair_hourly_wage: number;
  hours: number;
  craft_premium_multiplier: number;
  craft_premium_amount: number;
  platform_fee: number;
  suggested_price: number;
  suggested_range: { min: number; max: number };
  reasoning: string;
}

export interface AIDraftResponse {
  title: string;
  description: string;
  materials: string[];
  technique: string;
  story: string;
  tags: string[];
  suggested_price_range: { min: number; max: number };
}

export interface ListingCreateInput {
  title: string;
  description?: string;
  craft_type: string;
  materials?: string;
  technique?: string;
  dimensions?: string;
  hours_to_make?: number;
  price_inr: number;
  stock?: number;
}

export interface ListingUpdateInput {
  title?: string;
  description?: string;
  craft_type?: string;
  materials?: string;
  technique?: string;
  dimensions?: string;
  hours_to_make?: number;
  price_inr?: number;
  stock?: number;
  story_origin_text?: string;
  story_process_text?: string;
  story_price_rationale_json?: string;
}

export interface FilterListingsParams {
  craft?: string;
  q?: string;
  min?: number;
  max?: number;
  status?: string;
  artisan_id?: string;
  limit?: number;
  offset?: number;
}

export async function getListings(params?: FilterListingsParams): Promise<ListingRecord[]> {
  const { data } = await apiClient.get<ListingRecord[]>('/listings', { params });
  return data;
}

export async function getListingById(id: string): Promise<ListingRecord> {
  const { data } = await apiClient.get<ListingRecord>(`/listings/${id}`);
  return data;
}

export async function createListing(input: ListingCreateInput): Promise<ListingRecord> {
  const { data } = await apiClient.post<ListingRecord>('/listings', input);
  return data;
}

export async function updateListing(id: string, input: ListingUpdateInput): Promise<ListingRecord> {
  const { data } = await apiClient.patch<ListingRecord>(`/listings/${id}`, input);
  return data;
}

export async function publishListing(id: string): Promise<ListingRecord> {
  const { data } = await apiClient.post<ListingRecord>(`/listings/${id}/publish`);
  return data;
}

export async function archiveListing(id: string): Promise<ListingRecord> {
  const { data } = await apiClient.post<ListingRecord>(`/listings/${id}/archive`);
  return data;
}

export async function uploadListingImages(id: string, files: File[]): Promise<ListingRecord> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { data } = await apiClient.post<ListingRecord>(`/listings/${id}/images`, formData);
  return data;
}

export async function getPriceSuggestion(input: PriceSuggestionInput): Promise<PriceBreakdownResponse> {
  const { data } = await apiClient.post<PriceBreakdownResponse>('/listings/price-suggestion', input);
  return data;
}

export async function generateAIDraft(
  files: File[],
  craftType?: string,
  transcript?: string
): Promise<AIDraftResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { data } = await apiClient.post<AIDraftResponse>('/listings/ai-draft', formData, {
    params: { craft_type: craftType || '', transcript: transcript || '' },
    headers: { 'Content-Type': undefined }, // Let browser auto-set correct multipart boundary
  });
  return data;
}

export async function getCraftReferences(): Promise<CraftReferenceRecord[]> {
  const { data } = await apiClient.get<CraftReferenceRecord[]>('/crafts');
  return data;
}

export const getCrafts = getCraftReferences;

