import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContextMenu, useContextMenu } from '../ui';
import { useLongPress } from '../../hooks';
import { cn } from '../../utils/cn';
import type { Item } from '../../types/todoList';

export interface DraggableMobileItemProps {
  item: Item;
  onToggle: (itemId: string, completed: boolean) => void;
  onDelete: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  onDuplicate?: (itemId: string) => void;
  onMoveToCategory?: (itemId: string) => void;
  disabled?: boolean;
  className?: string;
}

export const DraggableMobileItem: React.FC<DraggableMobileItemProps> = ({
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: disabled || item.isCompleted, // Completed items nicht draggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Einfache Listen-Zeile ohne Card-Design
        'border-bottom border-light',
        'hover:bg-gray-50 transition-colors duration-200',
        className
      )}
    >
      {/* Einzeilige kompakte Layout: Drag-Handle + Checkbox + Text */}
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
        {/* Drag Handle ganz links */}
        <div
          {...attributes}
          {...listeners}
          className="d-flex align-items-center justify-content-center me-3"
          style={{ 
            width: '20px',
            height: '20px',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            flexShrink: 0
          }}
        >
          <i className="bi bi-grip-vertical text-muted" style={{ fontSize: '12px' }}></i>
        </div>

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggle(item.id, !item.isCompleted);
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