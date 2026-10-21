import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { CartDrawer } from './components/CartDrawer';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Product from './pages/Product';
import Gallery from './pages/Gallery';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import OrderTracking from './pages/OrderTracking';
import Onboarding from './pages/Onboarding';
import { CartProvider } from './contexts/CartContext';

function AppLayout() {
  const location = useLocation();
  const isDedicated3DGallery = location.pathname === '/gallery';

  return (
    <div className="kaarigar-shell">
      {!isDedicated3DGallery && <SiteHeader />}
      <CartDrawer />
      
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/shop"               element={<Catalogue />} />
        <Route path="/shop/:id"           element={<Product />} />
        <Route path="/gallery"            element={<Gallery />} />
        <Route path="/cart"               element={<Checkout />} />
        <Route path="/login"              element={<Onboarding />} />
        <Route path="/become-a-seller"    element={<Onboarding />} />
        <Route path="/dashboard"          element={<Dashboard />} />
        <Route path="/dashboard/create"   element={<CreateListing />} />
        <Route path="/dashboard/edit/:id" element={<CreateListing />} />
        <Route path="/orders/:id"         element={<OrderTracking />} />
      </Routes>

      {!isDedicated3DGallery && <SiteFooter />}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </CartProvider>
  );
}
