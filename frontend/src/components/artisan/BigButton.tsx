import React from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface BigButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  onClick?: () => void;
  to?: string;
  href?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  small?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
}

export function BigButton({
  children, variant = 'primary', onClick, to, href, disabled,
  type = 'button', icon, small, id, ariaLabel, className = ''
}: BigButtonProps) {
  const cls = `a-btn a-btn--${variant}${small ? ' a-btn--sm' : ''} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={cls} id={id} aria-label={ariaLabel}>
        {icon && <span aria-hidden="true">{icon}</span>}
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} id={id} aria-label={ariaLabel}>
        {icon && <span aria-hidden="true">{icon}</span>}
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} id={id} aria-label={ariaLabel}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
