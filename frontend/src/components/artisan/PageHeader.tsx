import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title?: string;
  backLabel?: string;
  backTo?: string;
}

export function PageHeader({ title, backLabel, backTo }: PageHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="a-page-header">
      {backTo ? (
        <Link to={backTo} className="a-page-header__back" aria-label={backLabel || t('common.back', 'Back')}>
          ← {backLabel || t('common.back', 'Back')}
        </Link>
      ) : (
        <button type="button" className="a-page-header__back" onClick={() => navigate(-1)} aria-label={t('common.back', 'Back')}>
          ← {backLabel || t('common.back', 'Back')}
        </button>
      )}
      {title && <span className="a-page-header__title">{title}</span>}
      <Link to="/dashboard" className="a-page-header__home" aria-label={t('artisan.nav_home', 'Dashboard home')}>
        🏠
      </Link>
    </header>
  );
}
