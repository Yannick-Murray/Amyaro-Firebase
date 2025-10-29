import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;
  onPress?: (event: React.TouchEvent | React.MouseEvent) => void;
  delay?: number;
  shouldPreventDefault?: boolean;
}

export const useLongPress = ({
  onLongPress,
  onPress,
  delay = 500,
  shouldPreventDefault = true
}: UseLongPressOptions) => {
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Haptic feedback when available
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (shouldPreventDefault) {
      event.preventDefault();
    }

    // Position für Bewegungserkennung speichern
    const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;
    startPositionRef.current = { x: clientX, y: clientY };

    isLongPressRef.current = false;
    
    longPressTimerRef.current = window.setTimeout(() => {
      // Prüfen ob sich der Finger/Maus noch an der ursprünglichen Position befindet
      isLongPressRef.current = true;
      triggerHaptic('medium');
      onLongPress(event);
    }, delay);
  }, [onLongPress, delay, shouldPreventDefault]);

  const clear = useCallback((event: React.TouchEvent | React.MouseEvent, shouldTriggerPress = true) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Wenn es kein Long Press war und ein onPress Handler existiert
    if (shouldTriggerPress && !isLongPressRef.current && onPress) {
      onPress(event);
    }

    isLongPressRef.current = false;
    startPositionRef.current = null;
  }, [onPress]);

  const move = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!startPositionRef.current || !longPressTimerRef.current) return;

    const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;

    const deltaX = Math.abs(clientX - startPositionRef.current.x);
    const deltaY = Math.abs(clientY - startPositionRef.current.y);

    // Wenn sich der Finger/Maus zu weit bewegt hat, Long Press abbrechen
    const threshold = 10; // pixels
    if (deltaX > threshold || deltaY > threshold) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: (event: React.MouseEvent) => clear(event),
    onMouseLeave: (event: React.MouseEvent) => clear(event, false),
    onMouseMove: move,
    onTouchStart: start,
    onTouchEnd: (event: React.TouchEvent) => clear(event),
    onTouchMove: move,
    onTouchCancel: (event: React.TouchEvent) => clear(event, false)
  };
};