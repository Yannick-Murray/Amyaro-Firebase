import React from 'react';
import { SwipeableItem, ContextMenu, useContextMenu } from '../ui';
import { QuantityEditor } from './QuantityEditor';
import { useLongPress } from '../../hooks';
import { cn } from '../../utils/cn';
import type { Item } from '../../types/todoList';

export interface MobileItemProps {
  item: Item;
  onToggle: (itemId: string, completed: boolean) => void;
  onQuantityChange: (itemId: string, quantity: number) => Promise<void>;
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
  onQuantityChange,
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
    console.log('=== TOGGLE DEBUG ===');
    console.log('Item ID:', item.id);
    console.log('Item Name:', item.name);
    console.log('Current isCompleted:', item.isCompleted);
    console.log('Will set to:', !item.isCompleted);
    console.log('Disabled prop:', disabled);
    console.log('onToggle function:', typeof onToggle);
    console.log('==================');
    
    try {
      onToggle(item.id, !item.isCompleted);
      console.log('✅ onToggle called successfully');
    } catch (error) {
      console.error('❌ Error in onToggle:', error);
    }
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  const handleEdit = () => {
    onEdit?.(item.id);
  };

  return (
    <SwipeableItem
      onDelete={handleDelete}
      onEdit={onEdit ? handleEdit : undefined}
      disabled={disabled}
      className={cn('list-group-item border-0 border-bottom', className)}
    >
      {/* Mobile-First Bootstrap Layout */}
      <div 
        className={cn(
          // Bootstrap Grid Layout
          'd-flex align-items-center justify-content-between',
          'py-2 px-3', // Padding wie im Original
          
          // States
          item.isCompleted && 'opacity-75',
          disabled && 'pe-none opacity-50'
        )}
        style={{ minHeight: '44px' }} // Touch-Target Mindestgröße
      >
        {/* Left: Checkbox + Text */}
        <div className="d-flex align-items-center flex-grow-1 me-2">
          {/* Checkbox Container - Touch-optimiert */}
          <div 
            className="d-flex align-items-center justify-content-center me-3"
            style={{ minWidth: '44px', minHeight: '44px' }} // Touch-Target Area
          >
            <button
              onClick={(e) => {
                console.log('🖱️ Button onClick event triggered');
                console.log('Event target:', e.target);
                console.log('Event currentTarget:', e.currentTarget);
                console.log('Button disabled:', e.currentTarget.disabled);
                
                e.stopPropagation();
                e.preventDefault();
                
                console.log('Calling handleToggle...');
                handleToggle();
              }}
              onTouchEnd={(e) => {
                console.log('👆 Button onTouchEnd event triggered');
                e.stopPropagation();
              }}
              onMouseDown={() => {
                console.log('🖱️ Button onMouseDown event triggered');
              }}
              disabled={disabled} // Nur disabled wenn das ganze Item disabled ist
              className={cn(
                'btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center',
                item.isCompleted
                  ? 'btn-success text-white'
                  : 'btn-outline-secondary',
              )}
              style={{ 
                width: '24px', 
                height: '24px', // Perfekter Kreis
                minWidth: '24px',
                minHeight: '24px',
                zIndex: 10
              }}
              aria-label={item.isCompleted ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
            >
              {item.isCompleted && (
                <i className="bi bi-check" style={{ fontSize: '14px' }} />
              )}
            </button>
          </div>

          {/* Item Text - mit Long Press für Context Menu */}
          <div 
            {...longPressProps}
            className="flex-grow-1" 
            style={{ minWidth: 0, cursor: 'pointer' }}
          >
            <span 
              className={cn(
                'text-truncate d-block',
                item.isCompleted && 'text-decoration-line-through text-muted'
              )}
              title={item.name}
            >
              {item.name}
            </span>
            
            {/* Mobile: Quantity Badge */}
            <div className="d-block d-sm-none">
              {(item.quantity ?? 1) > 1 && (
                <small className="badge bg-light text-dark border">
                  {item.quantity}x
                </small>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quantity Editor (Desktop) */}
        <div className="d-none d-sm-block me-2">
          <QuantityEditor
            quantity={item.quantity ?? 1}
            onQuantityChange={(newQuantity: number) => onQuantityChange(item.id, newQuantity)}
            disabled={disabled || item.isCompleted}
            size="sm"
          />
        </div>
      </div>
      
      {/* Context Menu für Long-Press */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        actions={contextMenu.actions}
        onClose={hideContextMenu}
      />
    </SwipeableItem>
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