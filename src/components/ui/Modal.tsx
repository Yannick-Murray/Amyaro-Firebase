import { forwardRef, useEffect } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  centered?: boolean;
  backdrop?: 'static' | 'clickable';
  title?: string;
  showCloseButton?: boolean;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(({
  className,
  isOpen,
  onClose,
  size = 'md',
  centered = false,
  backdrop = 'clickable',
  title,
  showCloseButton = true,
  children,
  ...props
}, ref) => {
  // ESC-Key Handler
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl'
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && backdrop === 'clickable') {
      onClose();
    }
  };

  return (
    <div 
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={cn(
          'modal-dialog',
          sizeClasses[size],
          centered && 'modal-dialog-centered'
        )}
      >
        <div
          ref={ref}
          className={cn('modal-content border-0 shadow-lg', className)}
          {...props}
        >
          {(title || showCloseButton) && (
            <div className="modal-header border-bottom border-light">
              {title && <h5 className="modal-title">{title}</h5>}
              {showCloseButton && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={onClose}
                  className="btn-close"
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg" />
                </Button>
              )}
            </div>
          )}
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

// Modal Sub-components
const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('modal-header border-bottom border-light', className)}
    {...props}
  >
    {children}
  </div>
));

ModalHeader.displayName = 'ModalHeader';

const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('modal-body', className)}
    {...props}
  >
    {children}
  </div>
));

ModalBody.displayName = 'ModalBody';

const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('modal-footer border-top border-light', className)}
    {...props}
  >
    {children}
  </div>
));

ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalHeader, ModalBody, ModalFooter };