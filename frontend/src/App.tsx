import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Route and component-level code splitting for sub-100ms initial page load
const SpaceStylist = lazy(() => import('./components/SpaceStylist').then(m => ({ default: m.SpaceStylist })));
const Home = lazy(() => import('./pages/Home'));
const Catalogue = lazy(() => import('./pages/Catalogue'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Product = lazy(() => import('./pages/Product'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CustomCommissions = lazy(() => import('./pages/CustomCommissions'));

function RouteLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '65vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        backgroundColor: 'var(--cream, #FDFBF7)',
        color: 'var(--stone, #7D7871)',
        fontFamily: 'var(--font-heading, "Cinzel", Georgia, serif)',
        letterSpacing: '0.14em',
        fontSize: '0.82rem',
        textTransform: 'uppercase',
      }}
      aria-label="Loading archival view"
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '2px solid rgba(184, 92, 56, 0.2)',
          borderTopColor: 'var(--terracotta, #B85C38)',
          borderRadius: '50%',
          animation: 'kaarigar-spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.78rem', color: 'var(--charcoal, #1C1C1A)' }}>Consulting Curatorial Archives...</span>
      <style>{`
        @keyframes kaarigar-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

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

function ShopRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/gallery${search}`} replace />;
}

function AppLayout() {
  return (
    <div className="kaarigar-shell">
      <ScrollToTop />
      <SiteHeader />
      <CartDrawer />
      <Suspense fallback={null}>
        <SpaceStylist />
      </Suspense>

      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/"                   element={<Home />} />
          <Route path="/gallery"            element={<Catalogue />} />
          <Route path="/archive"            element={<Gallery />} />
          <Route path="/exhibition"         element={<Gallery />} />
          <Route path="/shop"               element={<ShopRedirect />} />
          <Route path="/shop/:id"           element={<Product />} />
          <Route path="/commissions"        element={<CustomCommissions />} />
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
      </Suspense>

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
