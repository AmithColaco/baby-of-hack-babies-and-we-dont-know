// KalaHaat – Auth Context: real backend JWT + mock OTP with role support
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import type { ProfileResponse, UpdateProfileInput } from '../api/auth';

export type UserRole = 'artisan' | 'buyer' | 'collector' | 'facilitator' | 'admin';

export interface KaargarUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: 'artisan' | 'collector';
  backendRole: string;
  language?: string;
  // Artisan-specific
  atelier?: string;
  craftSpecialization?: string;
  region?: string;
  state?: string;
  bio?: string;
  yearsExperience?: number;
  avatarUrl?: string;
  verified?: boolean;
  // Collector-specific
  city?: string;
  preferredCategories?: string[];
  rawProfile?: ProfileResponse;
}

interface AuthContextType {
  user: KaargarUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isArtisan: boolean;
  isCollector: boolean;
  isLoading: boolean;
  requestOtp: (phone: string) => Promise<{ message: string; phone: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<KaargarUser>;
  logout: () => void;
  updateUser: (updates: Partial<KaargarUser>) => Promise<void>;
  updateProfileOnBackend: (updates: UpdateProfileInput) => Promise<ProfileResponse>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'kalahaat_token';
const CACHED_USER_KEY = 'kalahaat_cached_user';

function transformBackendProfile(profile: ProfileResponse): KaargarUser {
  const isArtisan = profile.user.role === 'artisan' || profile.user.role === 'facilitator';
  return {
    id: profile.user.id,
    name: profile.user.name || (isArtisan ? 'Master Artisan' : 'Patron Collector'),
    phone: profile.user.phone,
    role: isArtisan ? 'artisan' : 'collector',
    backendRole: profile.user.role,
    language: profile.user.language,
    atelier: profile.artisan_profile?.village ? `${profile.artisan_profile.village} Guild Atelier` : 'Coastal Artisan Atelier',
    craftSpecialization: profile.artisan_profile?.craft_types || 'Traditional Coastal Crafts',
    region: profile.artisan_profile?.village || 'Coastal Karnataka',
    state: 'Karnataka',
    bio: profile.artisan_profile?.bio || '',
    yearsExperience: profile.artisan_profile?.years_practising || 10,
    avatarUrl: profile.artisan_profile?.avatar_url || '',
    verified: profile.artisan_profile?.verified || false,
    rawProfile: profile,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<KaargarUser | null>(() => {
    const cached = localStorage.getItem(CACHED_USER_KEY);
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync token to localStorage and refresh profile on mount
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          if (mounted) {
            const transformed = transformBackendProfile(profile);
            setUser(transformed);
            localStorage.setItem(CACHED_USER_KEY, JSON.stringify(transformed));
          }
        } catch (err) {
          console.warn('Could not restore auth session:', err);
          if (mounted) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(CACHED_USER_KEY);
            setUser(null);
            setToken(null);
          }
        }
      }
      if (mounted) setIsLoading(false);
    };

    initAuth();

    const handleExpired = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CACHED_USER_KEY);
    };

    window.addEventListener('kalahaat_auth_expired', handleExpired);
    return () => {
      mounted = false;
      window.removeEventListener('kalahaat_auth_expired', handleExpired);
    };
  }, []);

  const requestOtp = async (phone: string) => {
    return await authApi.requestOtp(phone);
  };

  const loginWithOtp = async (phone: string, otp: string): Promise<KaargarUser> => {
    const tokenRes = await authApi.verifyOtp(phone, otp);
    const newToken = tokenRes.access_token;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);

    // Fetch user profile from backend
    const profile = await authApi.getMe();
    const transformed = transformBackendProfile(profile);
    setUser(transformed);
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(transformed));
    return transformed;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CACHED_USER_KEY);
    setToken(null);
    setUser(null);
  };

  const updateProfileOnBackend = async (updates: UpdateProfileInput): Promise<ProfileResponse> => {
    const updated = await authApi.updateMe(updates);
    const transformed = transformBackendProfile(updated);
    setUser(transformed);
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(transformed));
    return updated;
  };

  const updateUser = async (updates: Partial<KaargarUser>) => {
    if (!user) return;
    const input: UpdateProfileInput = {};
    if (updates.name !== undefined) input.name = updates.name;
    if (updates.craftSpecialization !== undefined) input.craft_types = updates.craftSpecialization;
    if (updates.region !== undefined) input.village = updates.region;
    if (updates.yearsExperience !== undefined) input.years_practising = updates.yearsExperience;
    if (updates.bio !== undefined) input.bio = updates.bio;
    if (updates.avatarUrl !== undefined) input.avatar_url = updates.avatarUrl;
    if (updates.role !== undefined) input.role = updates.role === 'artisan' ? 'artisan' : 'buyer';

    if (token) {
      await updateProfileOnBackend(input);
    } else {
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const profile = await authApi.getMe();
      const transformed = transformBackendProfile(profile);
      setUser(transformed);
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(transformed));
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user,
        isArtisan: user?.role === 'artisan',
        isCollector: user?.role === 'collector',
        isLoading,
        requestOtp,
        loginWithOtp,
        logout,
        updateUser,
        updateProfileOnBackend,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
