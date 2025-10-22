import { forwardRef } from 'react';
import type { InputHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

// Checkbox Component
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helpText?: string;
  errorText?: string;
  isInvalid?: boolean;
  variant?: 'default' | 'switch';
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  className,
  label,
  helpText,
  errorText,
  isInvalid = false,
  variant = 'default',
  disabled,
  id,
  ...props
}, ref) => {
  const hasError = isInvalid || !!errorText;
  
  const checkboxClasses = cn(
    variant === 'default' ? 'form-check-input' : 'form-check-input',
    hasError && 'is-invalid',
    className
  );

  const wrapperClasses = cn(
    variant === 'default' ? 'form-check' : 'form-check form-switch'
  );

  return (
    <div className={wrapperClasses}>
      <input
        ref={ref}
        type="checkbox"
        className={checkboxClasses}
        disabled={disabled}
        id={id}
        {...props}
      />
      {label && (
        <label className="form-check-label" htmlFor={id}>
          {label}
        </label>
      )}
      
      {helpText && !hasError && (
        <div className="form-text text-muted small mt-1">{helpText}</div>
      )}
      {errorText && (
        <div className="invalid-feedback d-block small mt-1">{errorText}</div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Radio Component
export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helpText?: string;
  errorText?: string;
  isInvalid?: boolean;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(({
  className,
  label,
  helpText,
  errorText,
  isInvalid = false,
  disabled,
  id,
  ...props
}, ref) => {
  const hasError = isInvalid || !!errorText;
  
  const radioClasses = cn(
    'form-check-input',
    hasError && 'is-invalid',
    className
  );

  return (
    <div className="form-check">
      <input
        ref={ref}
        type="radio"
        className={radioClasses}
        disabled={disabled}
        id={id}
        {...props}
      />
      {label && (
        <label className="form-check-label" htmlFor={id}>
          {label}
        </label>
      )}
      
      {helpText && !hasError && (
        <div className="form-text text-muted small mt-1">{helpText}</div>
      )}
      {errorText && (
        <div className="invalid-feedback d-block small mt-1">{errorText}</div>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

// RadioGroup Component
export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  layout?: 'vertical' | 'horizontal';
  errorText?: string;
  helpText?: string;
}

const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(({
  className,
  name,
  value,
  onChange,
  options,
  layout = 'vertical',
  errorText,
  helpText,
  ...props
}, ref) => {
  const wrapperClasses = cn(
    layout === 'horizontal' && 'd-flex gap-3',
    className
  );

  const handleChange = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  return (
    <div ref={ref} className={wrapperClasses} {...props}>
      {options.map((option, index) => (
        <Radio
          key={option.value}
          id={`${name}-${index}`}
          name={name}
          value={option.value}
          label={option.label}
          disabled={option.disabled}
          checked={value === option.value}
          onChange={() => handleChange(option.value)}
        />
      ))}
      
      {helpText && !errorText && (
        <div className="form-text text-muted small mt-1">{helpText}</div>
      )}
      {errorText && (
        <div className="invalid-feedback d-block small mt-1">{errorText}</div>
      )}
    </div>
  );
});

RadioGroup.displayName = 'RadioGroup';

export { Checkbox, Radio, RadioGroup };