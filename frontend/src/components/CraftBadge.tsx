interface CraftBadgeProps {
  label: string;
  region?: string;
}

export default function CraftBadge({ label, region }: CraftBadgeProps) {
  return (
    <span className="craft-badge">
      <span className="craft-badge__bullet">✦</span>
      <span className="craft-badge__label">{label}</span>
      {region && <span className="craft-badge__region">({region})</span>}
    </span>
  );
}
