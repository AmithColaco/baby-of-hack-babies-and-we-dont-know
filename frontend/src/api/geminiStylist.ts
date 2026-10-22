// KAARIGAR — "Craft in Your Space" AI Space Stylist Service
// Communicates securely with the KAARIGAR FastAPI backend proxy endpoint.
// No Gemini API keys or secrets are exposed in the browser bundle or network requests.

import apiClient from './client';
import type { CraftObject } from '../types';

export interface SpaceAnalysis {
  isSuitable?: boolean;
  unsuitableMessage?: string;
  dominantColors: string[];
  interiorStyle: string;
  spaceMood: string;
  suggestedCategories: string[];
  suggestedPlacements: string[];
  colorDescription: string;
  spaceDescription: string;
  maxBudget?: number;
}

export interface ProductRecommendation {
  product: CraftObject;
  reason: string;
  matchScore: number;
}

export interface StylistAnalysisResult {
  analysis: SpaceAnalysis;
  recommendations: ProductRecommendation[];
}

interface BackendChatbotResponse {
  spaceAnalysis: SpaceAnalysis;
  recommendations: Array<{
    product: CraftObject;
    reason: string;
    matchScore: number;
  }>;
}

// Parse budget from user preference string (e.g. "budget ₹25000" or "under 30000")
export function parseBudget(preference: string): number | undefined {
  const match = preference.match(/[₹]?\s*(\d[\d,]*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return undefined;
}

/**
 * Submit space photograph and preferences to the backend AI analysis endpoint.
 * The backend proxies the request to Gemini Vision securely using the server's GEMINI_API_KEY.
 * The browser automatically sets the multipart boundary header with FormData.
 */
export async function analyzeSpaceWithBackend(
  imageFile: File,
  userPreference: string
): Promise<StylistAnalysisResult> {
  const formData = new FormData();
  formData.append('image', imageFile, imageFile.name);
  if (userPreference.trim()) {
    formData.append('preference', userPreference.trim());
  }

  // Explicitly delete any inherited Content-Type so Axios lets the browser
  // generate the correct 'multipart/form-data; boundary=...' header automatically.
  // Setting 'multipart/form-data' manually without a boundary is also invalid.
  const response = await apiClient.post<BackendChatbotResponse>(
    '/chatbot/analyze-space',
    formData,
    {
      timeout: 60000, // 60 seconds for multimodal AI vision processing
      headers: { 'Content-Type': undefined },
    }
  );

  const data = response.data;

  return {
    analysis: data.spaceAnalysis,
    recommendations: data.recommendations || [],
  };
}
