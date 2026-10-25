import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { logout } = useAuth();

  const items = [
    { to: '/dashboard', icon: '🏠', label: t('artisan.nav_home', 'Home') },
    { to: '/dashboard/orders', icon: '📦', label: t('artisan.nav_orders', 'Orders') },
    { to: '/dashboard/create', icon: '➕', label: t('artisan.nav_add', 'Add') },
    { to: '/commissions', icon: '🎨', label: t('artisan.nav_commissions', 'Custom') },
  ];

  return (
    <nav className="a-bottom-nav" aria-label={t('artisan.bottom_nav', 'Main navigation')}>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`a-bottom-nav__item${pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to)) ? ' a-bottom-nav__item--active' : ''}`}
          aria-current={pathname === item.to ? 'page' : undefined}
        >
          <span className="a-bottom-nav__icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
      <button
        type="button"
        className="a-bottom-nav__item"
        onClick={() => { logout(); window.location.href = '/'; }}
        aria-label={t('nav.logout', 'Sign out')}
      >
        <span className="a-bottom-nav__icon" aria-hidden="true">⎋</span>
        <span>{t('nav.logout', 'Sign out')}</span>
      </button>
    </nav>
  );
}
