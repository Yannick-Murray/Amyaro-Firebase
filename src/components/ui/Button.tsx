import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary' | 'outline-secondary' | 'outline-success' | 'outline-danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  ...props
}, ref) => {
  const baseClasses = 'btn d-inline-flex align-items-center justify-content-center gap-2 border-0 transition-all';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info',
    light: 'btn-light',
    dark: 'btn-dark',
    'outline-primary': 'btn-outline-primary',
    'outline-secondary': 'btn-outline-secondary',
    'outline-success': 'btn-outline-success',
    'outline-danger': 'btn-outline-danger'
  };

  const sizeClasses = {
    sm: 'btn-sm px-3 py-1',
    md: 'px-4 py-2',
    lg: 'btn-lg px-5 py-3'
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-100',
    (disabled || isLoading) && 'disabled',
    className
  );

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      )}
      {leftIcon && !isLoading && <i className={`bi ${leftIcon}`} />}
      {children}
      {rightIcon && !isLoading && <i className={`bi ${rightIcon}`} />}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };