import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  children,
  ...props
}, ref) => {
  const baseClasses = 'amyaro-card border-0 rounded-3 bg-white';
  
  const variantClasses = {
    default: 'shadow-sm',
    elevated: 'shadow',
    outlined: 'border border-light',
    filled: 'bg-light'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const interactionClasses = cn(
    hover && 'amyaro-card-hover',
    clickable && 'cursor-pointer user-select-none'
  );

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    interactionClasses,
    className
  );

  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card Sub-components
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('border-bottom border-light pb-3 mb-3', className)}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('', className)}
    {...props}
  >
    {children}
  </div>
));

CardBody.displayName = 'CardBody';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('border-top border-light pt-3 mt-3', className)}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };