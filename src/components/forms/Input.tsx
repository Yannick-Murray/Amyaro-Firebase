import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  leftAddon?: string;
  rightAddon?: string;
  helpText?: string;
  errorText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  variant = 'default',
  inputSize = 'md',
  isInvalid = false,
  leftIcon,
  rightIcon,
  leftAddon,
  rightAddon,
  helpText,
  errorText,
  type = 'text',
  disabled,
  ...props
}, ref) => {
  const hasError = isInvalid || !!errorText;
  const hasLeftElement = leftIcon || leftAddon;
  const hasRightElement = rightIcon || rightAddon;

  const baseClasses = 'form-control border-0 shadow-none transition-all';
  
  const variantClasses = {
    default: 'bg-white border border-gray-300',
    filled: 'bg-gray-50 border-0',
    outlined: 'bg-transparent border-2 border-gray-300'
  };

  const sizeClasses = {
    sm: 'form-control-sm px-3 py-2',
    md: 'px-4 py-3',
    lg: 'form-control-lg px-4 py-3'
  };

  const stateClasses = cn(
    hasError && 'border-danger',
    !hasError && 'border-light focus:border-primary',
    disabled && 'bg-gray-100 text-muted'
  );

  const inputClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[inputSize],
    stateClasses,
    hasLeftElement && 'ps-5',
    hasRightElement && 'pe-5',
    className
  );

  const InputElement = (
    <input
      ref={ref}
      type={type}
      className={inputClasses}
      disabled={disabled}
      {...props}
    />
  );

  // Wenn keine Icons/Addons, return einfachen Input
  if (!hasLeftElement && !hasRightElement) {
    return (
      <div>
        {InputElement}
        {helpText && !hasError && (
          <div className="form-text text-muted small mt-1">{helpText}</div>
        )}
        {errorText && (
          <div className="invalid-feedback d-block small mt-1">{errorText}</div>
        )}
      </div>
    );
  }

  // Input mit Icons/Addons
  return (
    <div>
      <div className="position-relative">
        {/* Left Icon/Addon */}
        {leftIcon && (
          <i className={`bi ${leftIcon} position-absolute top-50 start-0 translate-middle-y ms-3 text-muted`} />
        )}
        {leftAddon && (
          <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small">
            {leftAddon}
          </span>
        )}

        {InputElement}

        {/* Right Icon/Addon */}
        {rightIcon && (
          <i className={`bi ${rightIcon} position-absolute top-50 end-0 translate-middle-y me-3 text-muted`} />
        )}
        {rightAddon && (
          <span className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted small">
            {rightAddon}
          </span>
        )}
      </div>

      {helpText && !hasError && (
        <div className="form-text text-muted small mt-1">{helpText}</div>
      )}
      {errorText && (
        <div className="invalid-feedback d-block small mt-1">{errorText}</div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };