import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  variant?: 'default' | 'danger' | 'warning';
  disabled?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  actions: ContextMenuAction[];
  onClose: () => void;
  triggerElement?: HTMLElement | null;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  actions,
  onClose,
  triggerElement
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Haptic feedback wenn verfügbar
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Position anpassen um Bildschirmränder zu vermeiden
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newX = position.x;
    let newY = position.y;

    // Rechten Rand vermeiden
    if (newX + rect.width > viewportWidth - 20) {
      newX = viewportWidth - rect.width - 20;
    }

    // Linken Rand vermeiden
    if (newX < 20) {
      newX = 20;
    }

    // Unteren Rand vermeiden
    if (newY + rect.height > viewportHeight - 20) {
      newY = position.y - rect.height - 10;
    }

    // Oberen Rand vermeiden
    if (newY < 20) {
      newY = 20;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [isOpen, position]);

  // Außerhalb klicken = schließen
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element;
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Kurzer Delay um zu vermeiden, dass das auslösende Event das Menü sofort schließt
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Aktionen ausführen
  const handleActionClick = (action: ContextMenuAction) => {
    if (action.disabled) return;
    
    triggerHaptic('light');
    action.onClick();
    onClose();
  };

  // Backdrop Blur wenn Element spezifiziert
  useEffect(() => {
    if (!triggerElement) return;

    if (isOpen) {
      triggerElement.style.filter = 'blur(2px)';
      triggerElement.style.transform = 'scale(0.98)';
      triggerElement.style.transition = 'all 0.2s ease-out';
    } else {
      triggerElement.style.filter = '';
      triggerElement.style.transform = '';
    }

    return () => {
      triggerElement.style.filter = '';
      triggerElement.style.transform = '';
    };
  }, [isOpen, triggerElement]);

  if (!isOpen) return null;

  const getVariantClasses = (variant: ContextMenuAction['variant'] = 'default') => {
    switch (variant) {
      case 'danger':
        return 'text-danger hover:bg-danger-subtle';
      case 'warning': 
        return 'text-warning hover:bg-warning-subtle';
      default:
        return 'text-dark hover:bg-gray-100';
    }
  };

  const menu = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-10"
        style={{ backdropFilter: 'blur(1px)' }}
      />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 max-w-64 animate-context-menu"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y
        }}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            disabled={action.disabled}
            className={`
              w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
              ${getVariantClasses(action.variant)}
              ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${index === 0 ? 'rounded-t-lg' : ''}
              ${index === actions.length - 1 ? 'rounded-b-lg' : ''}
            `}
          >
            <i className={`${action.icon} text-lg`} />
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </>
  );

  // Portal rendern für korrekte Z-Index Handhabung
  return createPortal(menu, document.body);
};

// Hook für einfache Context Menu Nutzung
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    actions: ContextMenuAction[];
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    actions: []
  });

  const showContextMenu = (
    event: React.MouseEvent | React.TouchEvent,
    actions: ContextMenuAction[]
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;

    setContextMenu({
      isOpen: true,
      position: { x: clientX, y: clientY },
      actions
    });
  };

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu
  };
};