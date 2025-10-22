import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
  pill?: boolean;
  icon?: string;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  className,
  variant = 'primary',
  size = 'md',
  outline = false,
  pill = false,
  icon,
  children,
  ...props
}, ref) => {
  const baseClasses = 'badge d-inline-flex align-items-center gap-1';
  
  const variantClasses = outline 
    ? {
        primary: 'text-primary border border-primary bg-primary bg-opacity-10',
        secondary: 'text-secondary border border-secondary bg-secondary bg-opacity-10',
        success: 'text-success border border-success bg-success bg-opacity-10',
        danger: 'text-danger border border-danger bg-danger bg-opacity-10',
        warning: 'text-warning border border-warning bg-warning bg-opacity-10',
        info: 'text-info border border-info bg-info bg-opacity-10',
        light: 'text-dark border border-light bg-light',
        dark: 'text-light border border-dark bg-dark bg-opacity-10'
      }
    : {
        primary: 'bg-primary text-white',
        secondary: 'bg-secondary text-white',
        success: 'bg-success text-white',
        danger: 'bg-danger text-white',
        warning: 'bg-warning text-dark',
        info: 'bg-info text-white',
        light: 'bg-light text-dark',
        dark: 'bg-dark text-white'
      };

  const sizeClasses = {
    sm: 'px-2 py-1 small',
    md: 'px-2 py-1',
    lg: 'px-3 py-2'
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    pill && 'rounded-pill',
    !pill && 'rounded-2',
    className
  );

  return (
    <span
      ref={ref}
      className={classes}
      {...props}
    >
      {icon && <i className={`bi ${icon}`} />}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };