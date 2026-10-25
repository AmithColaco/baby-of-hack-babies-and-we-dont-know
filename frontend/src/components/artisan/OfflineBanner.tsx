import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const { t } = useTranslation();

  useEffect(() => {
    const on = () => setOffline(true);
    const off = () => setOffline(false);
    window.addEventListener('offline', on);
    window.addEventListener('online', off);
    return () => { window.removeEventListener('offline', on); window.removeEventListener('online', off); };
  }, []);

  if (!offline) return null;
  return (
    <div className="a-offline-banner" role="alert" aria-live="assertive">
      <span aria-hidden="true">⚠️</span>
      {t('artisan.offline', 'You are offline. Your work is saved and will sync when you reconnect.')}
    </div>
  );
}
