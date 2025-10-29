import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MobileItem } from './MobileItem';
import type { Item } from '../../types/todoList';

export interface DraggableMobileItemProps {
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

export const DraggableMobileItem: React.FC<DraggableMobileItemProps> = ({
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
      className={className}
    >
      <div
        className="position-relative"
        {...attributes}
      >
        {/* Drag Handle - sichtbar auf Tablet/Desktop */}
        <div
          {...listeners}
          className="position-absolute start-0 top-0 h-100 d-none d-sm-flex align-items-center justify-content-center bg-light border-end"
          style={{ 
            width: '30px', 
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            zIndex: 1
          }}
        >
          <i className="bi bi-grip-vertical text-muted"></i>
        </div>

        {/* MobileItem mit Padding für Drag Handle - Desktop */}
        <div style={{ paddingLeft: '30px' }} className="d-none d-sm-block">
          <MobileItem
            item={item}
            onToggle={onToggle}
            onQuantityChange={onQuantityChange}
            onDelete={onDelete}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onMoveToCategory={onMoveToCategory}
            disabled={disabled}
          />
        </div>

        {/* Mobile: Drag-Handle rechts */}
        <div className="d-block d-sm-none position-relative">
          <MobileItem
            item={item}
            onToggle={onToggle}
            onQuantityChange={onQuantityChange}
            onDelete={onDelete}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onMoveToCategory={onMoveToCategory}
            disabled={disabled}
          />
          
          {/* Mobile Drag Handle - rechts positioniert */}
          <div
            {...listeners}
            className="position-absolute end-0 top-0 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75 border-start"
            style={{ 
              width: '40px',
              touchAction: 'none',
              cursor: 'grab',
              zIndex: 2
            }}
          >
            <i className="bi bi-grip-vertical text-muted"></i>
          </div>
        </div>
      </div>
    </div>
  );
};