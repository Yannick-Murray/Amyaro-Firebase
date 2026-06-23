import { forwardRef, useEffect, useId, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const setContentRef = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  // ESC-Key Handler + Focus-Trap (Tab bleibt innerhalb des Modals)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const content = contentRef.current;
      if (!content) return;

      const focusable = Array.from(
        content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        // Kein fokussierbares Element: Fokus auf dem Container halten
        event.preventDefault();
        content.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === content) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Initialfokus setzen und beim Schließen an den Auslöser zurückgeben
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const content = contentRef.current;
    if (content) {
      const firstFocusable = content.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? content).focus();
    }

    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

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
      aria-labelledby={title ? titleId : undefined}
    >
      <div 
        className={cn(
          'modal-dialog',
          sizeClasses[size],
          centered && 'modal-dialog-centered'
        )}
      >
        <div
          ref={setContentRef}
          tabIndex={-1}
          className={cn('modal-content border-0 shadow-lg', className)}
          {...props}
        >
          {(title || showCloseButton) && (
            <div className="modal-header border-bottom border-light">
              {title && <h5 className="modal-title" id={titleId}>{title}</h5>}
              {showCloseButton && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={onClose}
                  className="btn-close"
                  aria-label="Schließen"
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