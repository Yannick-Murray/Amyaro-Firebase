import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
  disabled?: boolean;
  className?: string;
  deleteThreshold?: number; // Prozent für Auto-Delete
  hapticFeedback?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  isDragging: boolean;
  direction: 'left' | 'right' | null;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onDelete,
  onEdit,
  disabled = false,
  className,
  deleteThreshold = 0.3, // 30% der Breite für Auto-Delete
  hapticFeedback = true
}) => {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    isDragging: false,
    direction: null
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Feature Detection
  const isTouchDevice = 'ontouchstart' in window;
  const supportsVibration = 'vibrate' in navigator;

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !supportsVibration) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[type]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      isDragging: false,
      direction: null
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !containerRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    
    // Bestimme Swipe-Richtung bei ersten Bewegung
    if (!touchState.isDragging && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      const direction = Math.abs(deltaX) > Math.abs(deltaY) ? 
        (deltaX < 0 ? 'left' : 'right') : null;
      
      setTouchState(prev => ({
        ...prev,
        isDragging: direction !== null,
        direction
      }));
      
      // Verhindere Scrolling bei horizontalem Swipe
      if (direction) {
        e.preventDefault();
      }
    }
    
    if (touchState.isDragging && touchState.direction === 'left') {
      const containerWidth = containerRef.current.offsetWidth;
      const maxSwipe = containerWidth * 0.5; // Maximal 50% der Breite
      const clampedDistance = Math.max(0, Math.min(maxSwipe, Math.abs(deltaX)));
      
      setSwipeDistance(clampedDistance);
      setTouchState(prev => ({ ...prev, currentX: touch.clientX }));
      
      // Haptic Feedback bei bestimmten Schwellenwerten
      if (clampedDistance > containerWidth * deleteThreshold && !isRevealed) {
        triggerHapticFeedback('medium');
        setIsRevealed(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (disabled || !containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const deletePoint = containerWidth * deleteThreshold;
    const autoDeletePoint = containerWidth * 0.6; // 60% für Auto-Delete
    
    if (swipeDistance > autoDeletePoint) {
      // Auto-Delete bei weit genug geswiped
      triggerHapticFeedback('heavy');
      handleDelete();
    } else if (swipeDistance > deletePoint) {
      // Zeige Delete-Button
      setSwipeDistance(deletePoint);
      setIsRevealed(true);
      
      // Auto-Close nach 3 Sekunden
      timeoutRef.current = setTimeout(() => {
        resetPosition();
      }, 3000);
    } else {
      // Zurück zur Ausgangsposition
      resetPosition();
    }
    
    setTouchState(prev => ({ ...prev, isDragging: false, direction: null }));
  };

  const resetPosition = () => {
    setSwipeDistance(0);
    setIsRevealed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleDelete = () => {
    triggerHapticFeedback('heavy');
    
    // Smooth animation vor dem Löschen
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateX(-100%)';
      containerRef.current.style.opacity = '0';
      
      setTimeout(() => {
        onDelete();
      }, 200);
    } else {
      onDelete();
    }
  };

  const handleEdit = () => {
    triggerHapticFeedback('light');
    resetPosition();
    onEdit?.();
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Desktop Hover-Verhalten (nur wenn nicht Touch-Device)
  const showActionsOnHover = !isTouchDevice;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-white',
        'transition-all duration-200 ease-out',
        showActionsOnHover && 'group hover:bg-gray-50',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(-${swipeDistance}px)`,
      }}
    >
      {/* Hauptinhalt */}
      <div className="relative z-10 bg-white">
        {children}
      </div>
      
      {/* Action-Buttons (hinter dem Inhalt) */}
      <div
        ref={actionsRef}
        className={cn(
          'absolute top-0 right-0 h-full flex items-center',
          'transition-opacity duration-200',
          // Desktop: Zeige bei Hover
          showActionsOnHover ? 'opacity-0 group-hover:opacity-100' : '',
          // Mobile: Zeige bei Swipe
          !showActionsOnHover && isRevealed ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          transform: `translateX(${swipeDistance}px)`,
          width: swipeDistance > 0 ? `${swipeDistance}px` : 'auto',
        }}
      >
        {/* Edit Button (falls Edit-Funktion vorhanden) */}
        {onEdit && (
          <button
            className={cn(
              'h-full px-4 bg-blue-500 text-white',
              'flex items-center justify-center',
              'transition-colors duration-200',
              'hover:bg-blue-600 active:bg-blue-700',
              'min-w-[44px]' // Touch-Target Minimum
            )}
            onClick={handleEdit}
            disabled={disabled}
          >
            <i className="bi bi-pencil text-lg" />
          </button>
        )}
        
        {/* Delete Button */}
        <button
          className={cn(
            'h-full px-4 bg-red-500 text-white',
            'flex items-center justify-center',
            'transition-colors duration-200',
            'hover:bg-red-600 active:bg-red-700',
            'min-w-[44px]' // Touch-Target Minimum
          )}
          onClick={handleDelete}
          disabled={disabled}
        >
          <i className="bi bi-trash text-lg" />
        </button>
      </div>
      
      {/* Swipe-Indikator (subtil) */}
      {isTouchDevice && swipeDistance > 10 && (
        <div
          className="absolute top-1/2 right-2 transform -translate-y-1/2 z-20"
          style={{
            opacity: Math.min(1, swipeDistance / 100),
          }}
        >
          <i className="bi bi-arrow-left text-gray-400 text-sm" />
        </div>
      )}
    </div>
  );
};