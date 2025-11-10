/**
 * Mobile Touch Utilities
 * Handles touch-specific behaviors and prevents sticky hover states
 */

// Global touch state tracking
let isTouchDevice = false;
let lastTouchTime = 0;

// Detect if device supports touch
export const detectTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Initialize touch detection
export const initTouchHandling = (): void => {
  isTouchDevice = detectTouchDevice();
  
  if (isTouchDevice) {
    // Add global touch start handler to track touch events
    document.addEventListener('touchstart', () => {
      lastTouchTime = Date.now();
      document.body.classList.add('touch-active');
    }, { passive: true });
    
    // Remove touch-active class after a short delay
    document.addEventListener('touchend', () => {
      setTimeout(() => {
        document.body.classList.remove('touch-active');
      }, 300);
    }, { passive: true });
    
    // Force remove hover states on any element after touch
    document.addEventListener('touchend', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.blur) {
        target.blur();
      }
      
      // Remove focus from any focused elements
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur && activeElement !== document.body) {
        activeElement.blur();
      }
    }, { passive: true });
  }
};

// Check if recent touch event occurred
export const isRecentTouch = (): boolean => {
  return isTouchDevice && (Date.now() - lastTouchTime < 500);
};

// Force remove hover states from element
export const removeHoverState = (element: HTMLElement): void => {
  if (element) {
    element.blur();
    element.classList.add('no-hover');
    setTimeout(() => {
      element.classList.remove('no-hover');
    }, 100);
  }
};

// Custom hook for handling touch-safe click events
export const createTouchSafeClickHandler = (
  onClick: (event: Event) => void,
  onTouch?: (event: TouchEvent) => void
) => {
  return {
    onClick: (e: Event) => {
      // Only handle click if it's not immediately after a touch
      if (!isRecentTouch()) {
        onClick(e);
      }
    },
    onTouchEnd: (e: TouchEvent) => {
      e.preventDefault();
      if (onTouch) {
        onTouch(e);
      } else {
        onClick(e as any);
      }
      
      // Remove hover states from the touched element
      const target = e.target as HTMLElement;
      removeHoverState(target);
    }
  };
};