import React from 'react';
import { ContextMenu, useContextMenu } from '../ui';
import { useLongPress } from '../../hooks';
import { cn } from '../../utils/cn';
import type { Item } from '../../types/todoList';

export interface MobileItemProps {
  item: Item;
  onToggle: (itemId: string, completed: boolean) => void;
  onDelete: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  onDuplicate?: (itemId: string) => void;
  onMoveToCategory?: (itemId: string) => void;
  disabled?: boolean;
  className?: string;
}

export const MobileItem: React.FC<MobileItemProps> = ({
  item,
  onToggle,
  onDelete,
  onEdit,
  onDuplicate,
  onMoveToCategory,
  disabled = false,
  className = ''
}) => {
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Context Menu Aktionen definieren
  const contextMenuActions = [
    {
      id: 'edit',
      label: 'Bearbeiten',
      icon: 'bi bi-pencil',
      onClick: () => onEdit?.(item.id),
      disabled: !onEdit
    },
    {
      id: 'duplicate',
      label: 'Duplizieren',
      icon: 'bi bi-copy',
      onClick: () => onDuplicate?.(item.id),
      disabled: !onDuplicate
    },
    {
      id: 'move',
      label: 'Kategorie ändern',
      icon: 'bi bi-arrow-right',
      onClick: () => onMoveToCategory?.(item.id),
      disabled: !onMoveToCategory
    },
    {
      id: 'delete',
      label: 'Löschen',
      icon: 'bi bi-trash',
      variant: 'danger' as const,
      onClick: () => onDelete(item.id)
    }
  ].filter(action => !action.disabled || action.id === 'delete'); // Immer delete anzeigen

  // Long Press Handler - nur für den Text-Bereich
  const longPressProps = useLongPress({
    onLongPress: (event) => {
      showContextMenu(event, contextMenuActions);
    },
    delay: 500,
    shouldPreventDefault: false
  });

  const handleToggle = () => {
    onToggle(item.id, !item.isCompleted);
  };

  return (
    <div
      className={cn(
        // Einfache Listen-Zeile ohne Card-Design
        'border-bottom border-light',
        'hover:bg-gray-50 transition-colors duration-200',
        className
      )}
    >
      {/* Einzeilige kompakte Layout: Checkbox + Text + Drag-Handle */}
      <div 
        className={cn(
          // Horizontal Layout in einer Zeile
          'd-flex align-items-center w-100',
          'px-3 py-2', // Seitlicher und vertikaler Abstand
          
          // States
          item.isCompleted && 'opacity-75',
          disabled && 'pe-none opacity-40',
          
          // Smooth Transitions
          'transition-all duration-200 ease-in-out'
        )}
        style={{ 
          minHeight: '44px' // Touch-friendly
        }}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleToggle();
          }}
          disabled={disabled}
          className={cn(
            'btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center me-3',
            'shadow-sm transition-all duration-200 ease-in-out',
            item.isCompleted
              ? 'btn-success text-white'
              : 'btn-outline-secondary',
          )}
          style={{ 
            width: '20px', 
            height: '20px',
            minWidth: '20px',
            minHeight: '20px',
            flexShrink: 0
          }}
          aria-label={item.isCompleted ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
        >
          {item.isCompleted && (
            <i className="bi bi-check fw-bold" style={{ fontSize: '10px' }} />
          )}
        </button>

        {/* Text - nimmt verfügbaren Platz */}
        <div 
          {...longPressProps}
          className="flex-grow-1" 
          style={{ minWidth: 0, cursor: 'pointer' }}
        >
          <span 
            className={cn(
              'fw-normal',
              item.isCompleted && 'text-decoration-line-through text-muted'
            )}
            style={{ 
              fontSize: '15px',
              lineHeight: '1.3'
            }}
          >
            {item.name}
          </span>
        </div>

        {/* Delete Button - Mülleimer am Ende der Zeile */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(item.id);
          }}
          disabled={disabled}
          className={cn(
            'btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center ms-2',
            'btn-outline-danger hover:btn-danger',
            'shadow-sm transition-all duration-200 ease-in-out',
            'opacity-70 hover:opacity-100'
          )}
          style={{ 
            width: '28px', 
            height: '28px',
            minWidth: '28px',
            minHeight: '28px',
            flexShrink: 0
          }}
          aria-label="Item löschen"
          title="Item löschen"
        >
          <i className="bi bi-trash" style={{ fontSize: '12px' }} />
        </button>
      </div>
      
      {/* Context Menu für Long-Press */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        actions={contextMenu.actions}
        onClose={hideContextMenu}
      />
    </div>
  );
};

// CSS für line-clamp (falls nicht in Tailwind verfügbar)
const styles = `
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Touch-optimierte Focus-States */
@media (pointer: coarse) {
  .focus\\:ring-2:focus {
    --tw-ring-width: 3px;
  }
}

/* Smooth transitions für bessere Performance */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Scroll-Verhalten für lange Listen */
.item-list {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
`;

// Styles in Head injizieren (nur einmal)
if (typeof document !== 'undefined' && !document.getElementById('mobile-item-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'mobile-item-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}