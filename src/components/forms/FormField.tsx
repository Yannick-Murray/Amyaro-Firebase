import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  required?: boolean;
  helpText?: string;
  errorText?: string;
  htmlFor?: string;
  layout?: 'vertical' | 'horizontal';
  labelProps?: HTMLAttributes<HTMLLabelElement>;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({
  className,
  label,
  required = false,
  helpText,
  errorText,
  htmlFor,
  layout = 'vertical',
  labelProps,
  children,
  ...props
}, ref) => {
  const hasError = !!errorText;

  const fieldClasses = cn(
    'form-field',
    layout === 'horizontal' && 'row align-items-center',
    className
  );

  const labelClasses = cn(
    'form-label',
    layout === 'horizontal' && 'col-sm-3 col-form-label',
    required && 'required',
    labelProps?.className
  );

  const inputWrapperClasses = cn(
    layout === 'horizontal' && 'col-sm-9'
  );

  return (
    <div ref={ref} className={fieldClasses} {...props}>
      {label && (
        <label 
          htmlFor={htmlFor}
          className={labelClasses}
          {...labelProps}
        >
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      
      <div className={inputWrapperClasses}>
        {children}
        
        {helpText && !hasError && (
          <div className="form-text text-muted small mt-1">{helpText}</div>
        )}
        {errorText && (
          <div className="invalid-feedback d-block small mt-1">{errorText}</div>
        )}
      </div>
    </div>
  );
});

FormField.displayName = 'FormField';

export { FormField };