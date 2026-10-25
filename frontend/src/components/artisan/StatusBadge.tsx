import { useTranslation } from 'react-i18next';

type OrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'DRAFT';

const STATUS_META: Record<OrderStatus, { icon: string; key: string; fallback: string }> = {
  PLACED:    { icon: '⏳', key: 'artisan.status_placed',    fallback: 'Order received' },
  CONFIRMED: { icon: '✅', key: 'artisan.status_confirmed', fallback: 'Confirmed' },
  SHIPPED:   { icon: '🚚', key: 'artisan.status_shipped',   fallback: 'Shipped' },
  DELIVERED: { icon: '✔️', key: 'artisan.status_delivered', fallback: 'Delivered' },
  CANCELLED: { icon: '✖️', key: 'artisan.status_cancelled', fallback: 'Cancelled' },
  DRAFT:     { icon: '📝', key: 'artisan.status_draft',     fallback: 'Draft' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const key = status.toUpperCase() as OrderStatus;
  const meta = STATUS_META[key] || { icon: '?', key: '', fallback: status };
  const cls = `a-status a-status--${status.toLowerCase()}`;
  return (
    <span className={cls} aria-label={meta.fallback}>
      <span aria-hidden="true">{meta.icon}</span>
      {meta.key ? t(meta.key, meta.fallback) : meta.fallback}
    </span>
  );
}
