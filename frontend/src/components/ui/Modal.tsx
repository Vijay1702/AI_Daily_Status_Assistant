import { ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Modal */}
      <div className={clsx(
        'relative bg-surface-dark-elevated rounded-lg w-full',
        'border border-outline-dark shadow-elevated',
        'transition-all duration-200 ease-out',
        sizeClasses[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-lg border-b border-outline-dark">
          {title && (
            <h2 className="text-headline-md font-semibold text-on-surface-dark font-inter">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className={clsx(
              'ml-auto inline-flex items-center justify-center rounded-md',
              'text-outline hover:text-on-surface-dark hover:bg-surface-dark-container-high',
              'transition-colors duration-200 p-sm'
            )}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-lg max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-lg border-t border-outline-dark bg-surface-dark-container-high rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
