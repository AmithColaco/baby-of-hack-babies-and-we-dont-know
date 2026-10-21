import { useState, useEffect } from 'react';
import { CRAFT_OBJECTS } from './craftsData';
import type { CraftObject } from '../types';

const PRODUCTS_STORAGE_KEY = 'kaarigar_products_catalog_v2';
const WISHLIST_STORAGE_KEY = 'kaarigar_wishlist_v1';
const ARTISAN_PROFILE_KEY = 'kaarigar_artisan_profile_v1';

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

// React Hook for Products
export function useProducts() {
  const [products, setProducts] = useState<CraftObject[]>(getInitialProducts);

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(getInitialProducts());
    };
    window.addEventListener('kaarigar_products_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kaarigar_products_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    products,
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
  name: 'Pandit Ram Swaroop Sharma',
  atelier: 'Chamba-Kangra Parampara Gurukulam',
  craftSpecialization: 'Pahari Miniature & Wasli Painting',
  region: 'Kangra Valley',
  state: 'Himachal Pradesh',
  phone: '+91 98160 44291',
  bio: 'Preserving the sacred Kangra Kalam passed down through four generations. Works exhibited in national and international cultural retrospectives.',
  yearsExperience: 42,
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
