import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    // Nexus Core Design System
    const baseClasses =
      'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-dark-base disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

    const variantClasses = {
      primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-300',
      secondary: 'border border-outline-dark bg-transparent text-on-surface-dark hover:bg-surface-dark-container-high focus:ring-primary-300',
      danger: 'bg-error hover:opacity-90 text-white focus:ring-error',
      ghost: 'text-on-surface-dark hover:bg-surface-dark-container-high focus:ring-primary-300',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-label-md',
      md: 'px-6 py-3 text-body-md',
      lg: 'px-8 py-4 text-title-md',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
