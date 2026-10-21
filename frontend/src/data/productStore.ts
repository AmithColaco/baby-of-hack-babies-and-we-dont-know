import { useState, useEffect } from 'react';
import { CRAFT_OBJECTS } from './craftsData';
import type { CraftObject } from '../types';
import { getListings, type ListingRecord } from '../api/listings';

const PRODUCTS_STORAGE_KEY = 'kaarigar_products_catalog_v2';
const WISHLIST_STORAGE_KEY = 'kaarigar_wishlist_v1';
const ARTISAN_PROFILE_KEY = 'kaarigar_artisan_profile_v1';

export function listingToCraftObject(listing: ListingRecord): CraftObject {
  let category: CraftObject['category'] = 'textiles';
  const ct = listing.craft_type.toLowerCase();
  if (ct.includes('kasuti') || ct.includes('embroidery') || ct.includes('weaving') || ct.includes('beedu') || ct.includes('mat')) {
    category = 'textiles';
  } else if (ct.includes('shell') || ct.includes('terracotta') || ct.includes('pottery') || ct.includes('ceramic')) {
    category = 'ceramics';
  } else if (ct.includes('wood') || ct.includes('channapatna') || ct.includes('driftwood')) {
    category = 'woodcraft';
  } else if (ct.includes('metal') || ct.includes('brass') || ct.includes('dhokra') || ct.includes('bidri')) {
    category = 'metalcraft';
  } else if (ct.includes('painting') || ct.includes('miniature')) {
    category = 'paintings';
  }

  const materials = listing.materials
    ? listing.materials.split(',').map((m) => m.trim()).filter(Boolean)
    : ['Authentic Coastal Materials'];

  let imageUrl = '/images/textile.jpg';
  if (listing.images && listing.images.length > 0) {
    const rawUrl = listing.images[0].url;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      imageUrl = rawUrl;
    } else if (rawUrl.startsWith('/uploads')) {
      imageUrl = `http://localhost:8000${rawUrl}`;
    } else {
      imageUrl = rawUrl;
    }
  } else if (category === 'ceramics') {
    imageUrl = '/images/bluepottery.jpg';
  } else if (category === 'metalcraft') {
    imageUrl = '/images/dhokra.jpg';
  } else if (category === 'woodcraft') {
    imageUrl = '/images/woodcraft.jpg';
  }

  return {
    id: listing.id,
    accessionNo: `KH-${listing.id.slice(0, 6).toUpperCase()}`,
    romanNumeral: 'I',
    title: listing.title,
    vernacularTitle: listing.craft_type,
    craftTradition: listing.craft_type,
    category,
    artisan: listing.artisan_name || 'Coastal Master Artisan',
    artisanTitle: 'Master Artisan · Traditional Coastal Heritage Custodian',
    atelier: listing.artisan_village ? `${listing.artisan_village} Artisan Atelier` : 'Coastal Karnataka Guild',
    region: listing.artisan_village || 'Coastal Karnataka',
    state: 'Karnataka',
    period: 'Living Coastal Lineage',
    price: listing.price_inr,
    currency: 'INR',
    availability: listing.stock > 0 ? 'Available' : 'Reserved',
    dimensions: listing.dimensions || 'Canonical Artisan Sizing',
    weight: '1.2 kg',
    materials,
    technique: listing.technique || `${listing.craft_type} traditional guild practice`,
    image: imageUrl,
    makingStory: {
      summary:
        listing.story?.origin_text ||
        listing.description ||
        'Handcrafted in coastal Karnataka preserving generational material memory.',
      stages: [
        {
          step: '01',
          title: 'Material Gathering & Processing',
          description: listing.story?.process_text?.split('.')[0] || 'Natural coastal materials sustainably gathered along the coast and prepared by hand.',
        },
        {
          step: '02',
          title: 'Artisanal Crafting',
          description: `Handcrafted with meticulous dedication taking approx ${listing.hours_to_make || 8} hours of manual devotion.`,
        },
        {
          step: '03',
          title: 'Final Burnish & Inspection',
          description: 'Inspected and certified for enduring living heritage quality.',
        },
      ],
    },
    artisanBio: `Master artisan from ${listing.artisan_village || 'coastal Karnataka'}, maintaining centuries of ancestral craft wisdom.`,
    artisanQuote: 'In handcraft, time is not counted in minutes, but in strokes of devotion and living tradition.',
    directArtisanSharePercent: 88,
    position3D: [0, 0, 0],
    modelType: category === 'textiles' ? 'textile' : category === 'ceramics' ? 'pottery' : 'brass',
    colorPalette: ['#A0522D', '#D2B48C', '#2E8B57', '#DEB887'],
  };
}

// Initial seed
export function getInitialProducts(): CraftObject[] {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read products from localStorage:', e);
  }
  return CRAFT_OBJECTS;
}

export function saveProductsToStorage(products: CraftObject[]): void {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('kaarigar_products_updated'));
  } catch (e) {
    console.error('Failed to save products to localStorage:', e);
  }
}

export function addProductToStore(newProduct: CraftObject): void {
  const current = getInitialProducts();
  const updated = [newProduct, ...current];
  saveProductsToStorage(updated);
}

export function updateProductInStore(id: string, updatedFields: Partial<CraftObject>): void {
  const current = getInitialProducts();
  const updated = current.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
  saveProductsToStorage(updated);
}

export function deleteProductFromStore(id: string): void {
  const current = getInitialProducts();
  const updated = current.filter((p) => p.id !== id);
  saveProductsToStorage(updated);
}

export function resetProductsStore(): void {
  saveProductsToStorage(CRAFT_OBJECTS);
}

export function getProductById(id: string): CraftObject | undefined {
  const products = getInitialProducts();
  return products.find((p) => p.id === id);
}

// React Hook for Products - synchronized with FastAPI backend
export function useProducts() {
  const [products, setProducts] = useState<CraftObject[]>(getInitialProducts);
  const [backendLoaded, setBackendLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncBackendListings() {
      try {
        const liveListings = await getListings({ status: 'PUBLISHED' });
        if (liveListings && liveListings.length > 0 && isMounted) {
          const converted = liveListings.map(listingToCraftObject);
          // Combine live backend listings, deduplicating IDs
          const existing = getInitialProducts();
          const backendIds = new Set(converted.map((c) => c.id));
          const nonDupExisting = existing.filter((e) => !backendIds.has(e.id));
          const merged = [...converted, ...nonDupExisting];

          saveProductsToStorage(merged);
          setProducts(merged);
          setBackendLoaded(true);
        }
      } catch (err) {
        console.warn('Backend listings unreachable, using cached catalogue:', err);
      }
    }

    syncBackendListings();

    const handleUpdate = () => {
      setProducts(getInitialProducts());
    };
    window.addEventListener('kaarigar_products_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('kaarigar_products_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    products,
    backendLoaded,
    addProduct: addProductToStore,
    updateProduct: updateProductInStore,
    deleteProduct: deleteProductFromStore,
    resetToDefaults: resetProductsStore,
  };
}

// Wishlist Store & Hook
export function getWishlistIds(): string[] {
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function toggleWishlistId(id: string): string[] {
  const current = getWishlistIds();
  const updated = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('kaarigar_wishlist_updated'));
  } catch {
    // ignore
  }
  return updated;
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>(getWishlistIds);

  useEffect(() => {
    const handleUpdate = () => {
      setWishlist(getWishlistIds());
    };
    window.addEventListener('kaarigar_wishlist_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kaarigar_wishlist_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const toggleWishlist = (id: string) => {
    toggleWishlistId(id);
  };

  const isInWishlist = (id: string) => wishlist.includes(id);

  return { wishlist, toggleWishlist, isInWishlist, totalWishlist: wishlist.length };
}

// Artisan Profile Store
export interface ArtisanProfile {
  name: string;
  atelier: string;
  craftSpecialization: string;
  region: string;
  state: string;
  phone: string;
  bio: string;
  yearsExperience: number;
  avatarUrl?: string;
  isLoggedIn: boolean;
}

export const DEFAULT_ARTISAN: ArtisanProfile = {
  name: 'Parvati Devi',
  atelier: 'Ankola Kasuti Mahila Kendra',
  craftSpecialization: 'Kasuti Embroidery',
  region: 'Ankola',
  state: 'Karnataka',
  phone: '+91 98450 12345',
  bio: 'Master Kasuti needlework custodian with over 28 years of practice in Ankola, Uttara Kannada.',
  yearsExperience: 28,
  avatarUrl: '/images/artisan.jpg',
  isLoggedIn: true,
};

export function getArtisanProfile(): ArtisanProfile {
  try {
    const saved = localStorage.getItem(ARTISAN_PROFILE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_ARTISAN;
  } catch {
    return DEFAULT_ARTISAN;
  }
}

export function saveArtisanProfile(profile: ArtisanProfile): void {
  try {
    localStorage.setItem(ARTISAN_PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('kaarigar_artisan_updated'));
  } catch {
    // ignore
  }
}

export function useArtisan() {
  const [profile, setProfile] = useState<ArtisanProfile>(getArtisanProfile);

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(getArtisanProfile());
    };
    window.addEventListener('kaarigar_artisan_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kaarigar_artisan_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateProfile = (newProfile: ArtisanProfile) => {
    saveArtisanProfile(newProfile);
  };

  return { profile, updateProfile };
}
