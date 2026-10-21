// KAARIGAR – Auth Context: role-based login for Artisans and Collectors
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'artisan' | 'collector';

export interface KaargarUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  // Artisan-specific
  atelier?: string;
  craftSpecialization?: string;
  region?: string;
  state?: string;
  bio?: string;
  yearsExperience?: number;
  avatarUrl?: string;
  // Collector-specific
  city?: string;
  preferredCategories?: string[];
}

interface AuthContextType {
  user: KaargarUser | null;
  isLoggedIn: boolean;
  isArtisan: boolean;
  isCollector: boolean;
  login: (user: KaargarUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<KaargarUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'kaarigar_auth_user_v1';

function loadUser(): KaargarUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(user: KaargarUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<KaargarUser | null>(loadUser);

  useEffect(() => {
    saveUser(user);
    window.dispatchEvent(new Event('kaarigar_auth_updated'));
  }, [user]);

  const login = (newUser: KaargarUser) => setUser(newUser);
  const logout = () => setUser(null);
  const updateUser = (updates: Partial<KaargarUser>) =>
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isArtisan: user?.role === 'artisan', isCollector: user?.role === 'collector', login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
