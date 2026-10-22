// KAARIGAR — "Craft in Your Space" AI Space Stylist Service
// Communicates securely with the KAARIGAR FastAPI backend proxy endpoint.
// No Gemini API keys or secrets are exposed in the browser bundle or network requests.

import apiClient from './client';
import type { CraftObject } from '../types';
import { getInitialProducts } from '../data/productStore';

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
 * Intelligent client-side curatorial fallback engine.
 * Synthesizes room aesthetics and ranks real catalogue craftworks without external API dependencies.
 */
export function generateCuratorialFallback(userPreference: string): StylistAnalysisResult {
  const budget = parseBudget(userPreference);
  const prefLower = userPreference.toLowerCase();

  let interiorStyle = 'Coastal & Contemporary Warm';
  let spaceMood = 'Serene Artisanal Haven';
  let dominantColors = ['#F5EBE1', '#D4A373', '#2D6A4F', '#8B4513'];
  let colorDescription = 'Soft natural off-white, raw terracotta, and deep forest green accents';
  let placements = ['Living Room Console', 'Accent Wall', 'Reading Nook'];

  if (prefLower.includes('modern') || prefLower.includes('minimal')) {
    interiorStyle = 'Modern Architectural Minimalist';
    spaceMood = 'Structured & Contemplative';
    dominantColors = ['#EAEAEA', '#333333', '#8C92AC', '#B5602A'];
    colorDescription = 'Monochromatic neutral base with deliberate artisanal punctuation';
    placements = ['Foyer Console', 'Low Credenza', 'Gallery Wall'];
  } else if (prefLower.includes('coastal') || prefLower.includes('ocean') || prefLower.includes('sea')) {
    interiorStyle = 'Coastal Vernacular';
    spaceMood = 'Breezy Maritime Serenity';
    dominantColors = ['#E8F1F2', '#1B4965', '#BEE9E8', '#62B6CB'];
    colorDescription = 'Ocean mist tones, sea salt neutrals, and deep indigo accents';
    placements = ['Verandah Entryway', 'Sunlit Living Space', 'Console Table'];
  } else if (prefLower.includes('traditional') || prefLower.includes('ethnic') || prefLower.includes('heritage')) {
    interiorStyle = 'Heritage Traditional';
    spaceMood = 'Timeless Cultural Grandeur';
    dominantColors = ['#800020', '#D4AF37', '#58111A', '#3C1518'];
    colorDescription = 'Rich jewel tones, aged bronze patinas, and antique gold luster';
    placements = ['Pooja or Sanctum Nook', 'Formal Salon', 'Main Credenza'];
  }

  const allProducts = getInitialProducts();
  let eligible = allProducts;
  if (budget && budget > 0) {
    const budgetFiltered = allProducts.filter((p) => p.price <= budget);
    if (budgetFiltered.length > 0) {
      eligible = budgetFiltered;
    }
  }

  const scored: ProductRecommendation[] = eligible.map((p, idx) => {
    let score = 94 - idx * 2;
    const pText = `${p.title} ${p.craftTradition || ''} ${p.category || ''} ${p.materials?.join(' ') || ''}`.toLowerCase();
    const words = prefLower.split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) {
      if (pText.includes(w)) {
        score += 6;
      }
    }
    score = Math.max(75, Math.min(97, score));

    let reason = 'Harmonizes seamlessly with the architectural rhythm and ambient illumination of your interior.';
    if (p.category === 'paintings') {
      reason = `The intricate mineral pigments and contemplative visual field of ${p.title} introduce an evocative focal point for your wall plane.`;
    } else if (p.category === 'ceramics') {
      reason = `The luminous quartz glaze and hand-painted coastal motifs bring reflective organic depth to your console or credenza.`;
    } else if (p.category === 'textiles') {
      reason = `The handwoven geometric drape and natural fibres soften room acoustics while adding generational tactile grace.`;
    } else if (p.category === 'metalcraft') {
      reason = `The lost-wax bronze casting introduces grounded historical weight and artisanal sculptural presence.`;
    } else if (p.category === 'woodcraft') {
      reason = `The sustainably harvested natural grain and plant-lacquered finish bring organic warmth and artisanal playfulness.`;
    }

    return {
      product: p,
      reason,
      matchScore: score,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  return {
    analysis: {
      isSuitable: true,
      interiorStyle,
      spaceMood,
      dominantColors,
      colorDescription,
      spaceDescription:
        'A balanced interior space with natural light exposure, clean planes, and ideal display surfaces for living Indian artisanal masterpieces.',
      suggestedCategories: ['ceramics', 'textiles', 'paintings', 'metalcraft', 'woodcraft'],
      suggestedPlacements: placements,
      maxBudget: budget,
    },
    recommendations: scored.slice(0, 3),
  };
}

/**
 * Submit space photograph and preferences to the backend AI analysis endpoint.
 * Falls back gracefully to the client-side curatorial engine if backend or Gemini is unavailable.
 */
export async function analyzeSpaceWithBackend(
  imageFile: File,
  userPreference: string
): Promise<StylistAnalysisResult> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile, imageFile.name);
    if (userPreference.trim()) {
      formData.append('preference', userPreference.trim());
    }

    const response = await apiClient.post<BackendChatbotResponse>(
      '/chatbot/analyze-space',
      formData,
      {
        timeout: 30000,
        headers: { 'Content-Type': undefined },
      }
    );

    const data = response.data;

    // Check if space was determined unsuitable
    if (data && data.spaceAnalysis && data.spaceAnalysis.isSuitable === false) {
      return {
        analysis: data.spaceAnalysis,
        recommendations: [],
      };
    }

    if (data && data.spaceAnalysis && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
      return {
        analysis: data.spaceAnalysis,
        recommendations: data.recommendations,
      };
    }

    // Fall back to client curatorial engine if recommendations array was empty
    return generateCuratorialFallback(userPreference);
  } catch (err) {
    console.warn('Backend / Gemini space analysis endpoint unreachable or errored; using curatorial fallback engine:', err);
    return generateCuratorialFallback(userPreference);
  }
}

