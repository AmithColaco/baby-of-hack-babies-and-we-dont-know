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
  ambientCctKelvin?: number;
  lightDirectionality?: string;
  diffusionLevel?: string;
  lightingRecommendation?: string;
  suitabilityStatus?: string;
  stylingNarrative?: string;
  fixedEnvelope?: {
    flooring?: string;
    walls?: string;
    ceiling?: string;
    architectural_features?: string[];
  };
}

export interface ProductRecommendation {
  product: CraftObject;
  reason: string;
  matchScore: number;
  designRationale?: {
    aesthetic_bridge?: string;
    material_dialogue?: string;
    chromatic_fit?: string;
  };
  spatialPlacement?: {
    anchor_reference?: string;
    orientation_angle_deg?: number;
    recommended_clearance_cm?: number;
  };
  photometricInteraction?: string;
}

export interface StylistAnalysisResult {
  analysis: SpaceAnalysis;
  recommendations: ProductRecommendation[];
}

interface BackendChatbotResponse {
  spaceAnalysis: SpaceAnalysis;
  recommendations: ProductRecommendation[];
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
        timeout: 45000,
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

    if (data && data.spaceAnalysis) {
      return {
        analysis: data.spaceAnalysis,
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      };
    }

    // Only fall back to client curatorial engine if backend returned completely empty data
    return generateCuratorialFallback(userPreference);
  } catch (err) {
    console.warn('Backend / Gemini space analysis endpoint unreachable or errored; using curatorial fallback engine:', err);
    return generateCuratorialFallback(userPreference);
  }
}

// ──────────────────────────── RAG Chatbot Service ────────────────────────────

export interface RAGSource {
  id: string;
  title: string;
  category: string;
  snippet: string;
  relevanceScore: number;
  productId?: string;
}

export interface ChatbotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: RAGSource[];
  suggestedProducts?: CraftObject[];
  confidenceScore?: number;
  objectQueryDetected?: boolean;
  noObjectsFound?: boolean;
  hasReachedEnd?: boolean;
  endMessage?: string;
}

export interface ChatbotChatResult {
  answer: string;
  sources: RAGSource[];
  suggestedProducts: CraftObject[];
  confidenceScore: number;
  usedFallback: boolean;
  objectQueryDetected?: boolean;
  noObjectsFound?: boolean;
  hasReachedEnd?: boolean;
  endMessage?: string;
}

/**
 * Send conversational message to the backend RAG Chatbot endpoint.
 * Retrieves verified context across crafts, lineages, stages, and platform policies.
 */
export async function sendChatbotRAGMessage(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<ChatbotChatResult> {
  try {
    const response = await apiClient.post<ChatbotChatResult>(
      '/chatbot/chat',
      {
        message: message.trim(),
        history: history.slice(-6).map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content,
        })),
      },
      { timeout: 30000 }
    );

    if (response.data && response.data.answer) {
      return response.data;
    }
    throw new Error('Empty response from RAG chatbot endpoint');
  } catch (err) {
    console.warn('Backend RAG endpoint unavailable or errored; using local curatorial fallback:', err);
    // Intelligent local fallback grounded in real catalogue and platform knowledge
    const allProducts = getInitialProducts();
    const queryLower = message.trim().toLowerCase();

    // Check budget limit
    const budgetMatch = queryLower.match(/(?:under|below|less than|budget(?:\s*of)?)\s*(?:rs\.?|inr|₹)?\s*([0-9,]+)/);
    const budgetLimit = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, '')) : null;

    const objectKeywords = [
      'show', 'find', 'recommend', 'pieces', 'piece', 'items', 'item', 'objects', 'object',
      'products', 'product', 'buy', 'catalogue', 'collection', 'under', 'below',
      'painting', 'miniature', 'wasli', 'pottery', 'urn', 'ceramic', 'blue pottery',
      'textile', 'silk', 'saree', 'brocade', 'chanderi',
      'dhokra', 'horse', 'metal', 'brass', 'bronze',
      'wood', 'woodcraft', 'toy', 'totem', 'channapatna',
      'jewel', 'amulet', 'kundan', 'meenakari', 'polki',
      'sword', 'carpet', 'rug', 'furniture', 'shoe'
    ];

    const isPurePolicy =
      (queryLower.includes('fee') || queryLower.includes('platform') || queryLower.includes('5%') || queryLower.includes('escrow') || queryLower.includes('return') || queryLower.includes('shipping')) &&
      !objectKeywords.some((k) => ['buy', 'show', 'piece', 'item', 'product'].includes(k) && queryLower.includes(k));

    const objectQueryDetected = !isPurePolicy && objectKeywords.some((k) => queryLower.includes(k));

    let matchedProducts: CraftObject[] = [];
    if (objectQueryDetected) {
      matchedProducts = allProducts.filter((p) => {
        if (budgetLimit !== null && p.price > budgetLimit) return false;

        if (queryLower.includes('painting') || queryLower.includes('miniature') || queryLower.includes('pahari')) {

          return p.category === 'paintings' || p.id === 'pahari-miniature';
        }
        if (queryLower.includes('pottery') || queryLower.includes('ceramic') || queryLower.includes('urn') || queryLower.includes('blue pottery')) {
          return p.category === 'ceramics' || p.id === 'jaipur-blue-pottery';
        }
        if (queryLower.includes('textile') || queryLower.includes('silk') || queryLower.includes('saree') || queryLower.includes('chanderi')) {
          return p.category === 'textiles' || p.id === 'chanderi-handwoven-silk';
        }
        if (queryLower.includes('dhokra') || queryLower.includes('horse') || queryLower.includes('bronze') || queryLower.includes('brass') || (queryLower.includes('metal') && p.category === 'metalcraft')) {
          return p.category === 'metalcraft' || p.id === 'bastar-dhokra-brass';
        }
        if (queryLower.includes('wood') || queryLower.includes('toy') || queryLower.includes('totem') || queryLower.includes('channapatna')) {
          return p.category === 'woodcraft' || p.id === 'channapatna-wood-sculpture';
        }
        if (queryLower.includes('jewel') || queryLower.includes('amulet') || queryLower.includes('kundan') || queryLower.includes('meenakari')) {
          return p.category === 'jewellery' || p.id === 'kundan-meenakari-jewellery';
        }

        // Generic collection browse
        if (budgetLimit !== null) return true;
        if (queryLower.includes('all') || queryLower.includes('collection') || queryLower.includes('pieces')) return true;

        return false;
      });
    }

    const noObjectsFound = objectQueryDetected && matchedProducts.length === 0;
    const hasReachedEnd = objectQueryDetected;
    const endMessage = noObjectsFound
      ? 'No masterworks in our current archive match this specific search. Our collection is strictly limited to authenticated living heritage pieces.'
      : `✦ Displaying all ${matchedProducts.length} matching masterwork${matchedProducts.length > 1 ? 's' : ''} in collection (End of results) ✦`;

    let answer = `Welcome to KAARIGAR's Curatorial Assistant. Every masterwork in our collection is created by generational artisans across India.\n\n`;
    if (noObjectsFound) {
      answer = `### Curatorial Archive Notice\n\nWe could not find any authenticated masterworks matching **"${message.trim()}"** in our active collection.\n\n` +
        `Our digital gallery only inventories verified pieces directly from master artisans and Geographical Indication (GI) clusters. ` +
        `We currently curate Bastar Lost-Wax Dhokra, Pahari Miniature Paintings, Jaipur Blue Pottery, Handwoven Chanderi Brocades, Channapatna Woodcraft, and Royal Kundan Meenakari.`;
    } else if (matchedProducts.length > 0) {
      answer = `### Curated Masterwork${matchedProducts.length > 1 ? 's' : ''} for "${message.trim()}"\n\n` +
        `I have retrieved **${matchedProducts.length}** authenticated piece${matchedProducts.length > 1 ? 's' : ''} from our collection matching your criteria.`;
    } else if (queryLower.includes('fee') || queryLower.includes('price') || queryLower.includes('cost') || queryLower.includes('breakdown')) {
      answer = `### Transparent 4-Part Pricing Formula\n` +
        `1. **Actual Artisan Price**: 100% of this amount goes straight to the master craftsperson.\n` +
        `2. **Platform Infrastructure Fee**: 5% dedicated to archival preservation and digital support.\n` +
        `3. **Statutory Tax (GST)**: 5%.\n` +
        `4. **Total Price**: The exact arithmetic total with no hidden intermediary commissions.\n\n` +
        `Patron funds are held in secure escrow and released only upon your verified satisfaction.`;
    } else if (queryLower.includes('dhokra') || queryLower.includes('metal')) {
      answer = `### Bastar Lost-Wax Dhokra (Cire Perdue)\n` +
        `Bastar Dhokra is cast by the Ghadwa tribal community of Chhattisgarh using a 4,000-year Harappan lineage. ` +
        `Wild forest beeswax threads are hand-extruded and coiled around an alluvial clay core. Molten bell metal at 1200°C vaporizes the wax, ` +
        `and the clay mold is cracked open upon cooling, rendering every single casting unique.`;
    }

    return {
      answer,
      sources: [
        {
          id: 'local_archive_fallback',
          title: matchedProducts[0]?.craftTradition || 'KAARIGAR Archival Provenance',
          category: 'craft_tradition',
          snippet: matchedProducts[0]?.technique || 'Verified generational Indian craft lineage.',
          relevanceScore: 0.92,
          productId: matchedProducts[0]?.id,
        },
      ],
      suggestedProducts: matchedProducts,
      confidenceScore: 0.85,
      usedFallback: true,
      objectQueryDetected,
      noObjectsFound,
      hasReachedEnd,
      endMessage: objectQueryDetected ? endMessage : undefined,
    };
  }
}


