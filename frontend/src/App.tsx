import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import Product from './pages/Product';
import Gallery from './pages/Gallery';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import OrderTracking from './pages/OrderTracking';
import Onboarding from './pages/Onboarding';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/login"              element={<Onboarding />} />
        <Route path="/shop"               element={<Catalogue />} />
        <Route path="/shop/:id"           element={<Product />} />
        <Route path="/gallery"            element={<Gallery />} />
        <Route path="/cart"               element={<Checkout />} />
        <Route path="/dashboard"          element={<Dashboard />} />
        <Route path="/dashboard/create"   element={<CreateListing />} />
        <Route path="/dashboard/edit/:id" element={<CreateListing />} />
        <Route path="/orders/:id"         element={<OrderTracking />} />
      </Routes>
    </BrowserRouter>
  );
}
