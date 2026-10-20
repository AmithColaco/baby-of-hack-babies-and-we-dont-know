interface LoadingSpinnerProps {
  label?: string;
}

export default function LoadingSpinner({ label = 'Curating exhibition…' }: LoadingSpinnerProps) {
  return (
    <div className="curatorial-spinner-wrap" role="status">
      <div className="spinner-ring" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
