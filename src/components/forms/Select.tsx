import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'filled' | 'outlined';
  selectSize?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  helpText?: string;
  errorText?: string;
  placeholder?: string;
  options: SelectOption[];
  leftIcon?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  className,
  variant = 'default',
  selectSize = 'md',
  isInvalid = false,
  helpText,
  errorText,
  placeholder,
  options,
  leftIcon,
  disabled,
  ...props
}, ref) => {
  const hasError = isInvalid || !!errorText;

  const baseClasses = 'form-select border-0 shadow-none transition-all';
  
  const variantClasses = {
    default: 'bg-white border border-gray-300',
    filled: 'bg-gray-50 border-0',
    outlined: 'bg-transparent border-2 border-gray-300'
  };

  const sizeClasses = {
    sm: 'form-select-sm px-3 py-2',
    md: 'px-4 py-3',
    lg: 'form-select-lg px-4 py-3'
  };

  const stateClasses = cn(
    hasError && 'border-danger',
    !hasError && 'border-light focus:border-primary',
    disabled && 'bg-gray-100 text-muted',
    leftIcon && 'ps-5'
  );

  const selectClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[selectSize],
    stateClasses,
    className
  );

  const SelectElement = (
    <select
      ref={ref}
      className={selectClasses}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );

  if (!leftIcon) {
    return (
      <div>
        {SelectElement}
        {helpText && !hasError && (
          <div className="form-text text-muted small mt-1">{helpText}</div>
        )}
        {errorText && (
          <div className="invalid-feedback d-block small mt-1">{errorText}</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="position-relative">
        <i className={`bi ${leftIcon} position-absolute top-50 start-0 translate-middle-y ms-3 text-muted`} style={{ zIndex: 10 }} />
        {SelectElement}
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

Select.displayName = 'Select';

export { Select };