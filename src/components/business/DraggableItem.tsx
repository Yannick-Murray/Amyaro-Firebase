import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuantityEditor } from './QuantityEditor';
import { DropIndicator } from '../ui/DropIndicator';
import type { Item } from '../../types/todoList';

interface DraggableItemProps {
  item: Item;
  onToggle: (itemId: string, completed: boolean) => void;
  onQuantityChange: (itemId: string, quantity: number) => Promise<void>;
  onDelete: (itemId: string) => void;
  disabled?: boolean;
  showDropIndicator?: {
    position: 'top' | 'bottom';
    isActive: boolean;
  };
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  onToggle,
  onQuantityChange,
  onDelete,
  disabled = false,
  showDropIndicator
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
    disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      {/* Drop Indicator Above */}
      <DropIndicator 
        isVisible={showDropIndicator?.position === 'top' && showDropIndicator.isActive}
        position="top"
      />
      
      <div
        ref={setNodeRef}
        style={style}
        className={`list-group-item d-flex align-items-center justify-content-between ${
          isDragging ? 'shadow-lg border-primary' : ''
        } ${item.isCompleted ? 'opacity-75' : ''} ${
          showDropIndicator?.isActive ? 'bg-light' : ''
        }`}
      >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="me-3 d-flex align-items-center text-muted"
        style={{ 
          cursor: disabled ? 'default' : 'grab',
          fontSize: '1.2rem',
          padding: '4px'
        }}
        title="Ziehen zum Verschieben"
      >
        <i className="bi bi-grip-vertical"></i>
      </div>

      {/* Item Content */}
      <div 
        className="d-flex align-items-center flex-grow-1"
        onClick={() => onToggle(item.id, !item.isCompleted)}
        style={{ cursor: 'pointer' }}
      >
        <div className="me-3">
          <i className={`bi ${item.isCompleted ? 'bi-check-circle-fill text-success' : 'bi-circle'} fs-5`}></i>
        </div>
        <span className={`fw-medium ${item.isCompleted ? 'text-decoration-line-through text-muted' : ''}`}>
          {item.name}
        </span>
      </div>
      
      {/* Controls */}
      <div className="d-flex align-items-center gap-2">
        {item.isCompleted ? (
          <span className="badge bg-secondary">{item.quantity || 1}</span>
        ) : (
          <QuantityEditor
            quantity={item.quantity || 1}
            onQuantityChange={(newQuantity) => onQuantityChange(item.id, newQuantity)}
          />
        )}
        
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          title="Löschen"
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>
      </div>
      
      {/* Drop Indicator Below */}
      <DropIndicator 
        isVisible={showDropIndicator?.position === 'bottom' && showDropIndicator.isActive}
        position="bottom"
      />
    </>
  );
};