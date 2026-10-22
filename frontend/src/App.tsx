import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { CartDrawer } from './components/CartDrawer';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Product from './pages/Product';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import OrderTracking from './pages/OrderTracking';
import Onboarding from './pages/Onboarding';
import WishlistPage from './pages/WishlistPage';
import SettingsPage from './pages/SettingsPage';
import { SpaceStylist } from './components/SpaceStylist';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => { el.scrollIntoView({ behavior: 'smooth' }); }, 60);
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, search, hash]);
  return null;
}

function ProtectedArtisanRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isArtisan } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isArtisan) return <Navigate to="/gallery" replace />;
  return <>{children}</>;
}

function AppLayout() {
  return (
    <div className="kaarigar-shell">
      <ScrollToTop />
      <SiteHeader />
      <CartDrawer />
      <SpaceStylist />

      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/gallery"            element={<Catalogue />} />
        <Route path="/shop"               element={<Navigate to="/gallery" replace />} />
        <Route path="/shop/:id"           element={<Product />} />
        <Route path="/cart"               element={<Checkout />} />
        <Route path="/wishlist"           element={<WishlistPage />} />
        <Route path="/login"              element={<Onboarding />} />
        <Route path="/become-a-seller"    element={<Onboarding />} />
        <Route path="/settings"           element={<SettingsPage />} />
        <Route path="/seller-atelier"     element={<Navigate to="/dashboard" replace />} />
        <Route path="/seller"             element={<Navigate to="/dashboard" replace />} />
        <Route path="/atelier"            element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"          element={<ProtectedArtisanRoute><Dashboard /></ProtectedArtisanRoute>} />
        <Route path="/dashboard/create"   element={<ProtectedArtisanRoute><CreateListing /></ProtectedArtisanRoute>} />
        <Route path="/dashboard/edit/:id" element={<ProtectedArtisanRoute><CreateListing /></ProtectedArtisanRoute>} />
        <Route path="/orders/:id"         element={<OrderTracking />} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>

      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
