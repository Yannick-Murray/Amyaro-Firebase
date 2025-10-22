import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'outlined';
  textareaSize?: 'sm' | 'md' | 'lg';
  isInvalid?: boolean;
  helpText?: string;
  errorText?: string;
  autoResize?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  className,
  variant = 'default',
  textareaSize = 'md',
  isInvalid = false,
  helpText,
  errorText,
  autoResize = false,
  disabled,
  onChange,
  ...props
}, ref) => {
  const hasError = isInvalid || !!errorText;

  const baseClasses = 'form-control border-0 shadow-none transition-all resize-none';
  
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
    disabled && 'bg-gray-100 text-muted',
    autoResize && 'resize-none'
  );

  const textareaClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[textareaSize],
    stateClasses,
    className
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      // Auto-resize logic
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
    
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div>
      <textarea
        ref={ref}
        className={textareaClasses}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      
      {helpText && !hasError && (
        <div className="form-text text-muted small mt-1">{helpText}</div>
      )}
      {errorText && (
        <div className="invalid-feedback d-block small mt-1">{errorText}</div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };