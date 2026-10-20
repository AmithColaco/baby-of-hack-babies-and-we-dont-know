import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" aria-label="KalaHaat home">
          <span className="navbar__logo-mark" aria-hidden="true">ಕ</span>
          KalaHaat
        </Link>

        {/* Nav links */}
        <ul className="navbar__nav">
          <li><NavLink to="/shop"      id="nav-shop">Shop</NavLink></li>
          <li><NavLink to="/gallery"   id="nav-gallery">Gallery</NavLink></li>
          <li><NavLink to="/dashboard" id="nav-dashboard">Dashboard</NavLink></li>
        </ul>

        {/* Actions */}
        <div className="navbar__actions">
          <Link to="/cart" className="btn btn-ghost btn-icon" id="nav-cart" aria-label="Cart">
            🛒
          </Link>
          <Link to="/login" className="btn btn-primary" id="nav-login">
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  );
}
