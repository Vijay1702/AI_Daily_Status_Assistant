import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-label-md font-medium text-on-surface-dark mb-sm font-inter">
            {label}
            {props.required && <span className="text-error ml-base">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-md py-sm border rounded-md text-body-md text-on-surface-dark placeholder-outline-dark transition-all duration-200',
            'bg-surface-dark-container-high focus:bg-surface-dark-elevated',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-surface-dark-base',
            error 
              ? 'border-error focus:ring-error focus:ring-offset-error/20' 
              : 'border-outline-dark hover:border-outline',
            className
          )}
          {...props}
        />
        {error && <p className="text-error text-body-md mt-xs font-inter">{error}</p>}
        {helperText && !error && <p className="text-outline text-body-md mt-xs font-inter">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
