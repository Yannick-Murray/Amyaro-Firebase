import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


import { cn } from '../../utils/cn';
import type { Item } from '../../types/todoList';

export interface DraggableGiftItemProps {
  item: Item;
  onToggle: (itemId: string, completed: boolean) => void;
  onDelete: (itemId: string) => void;
  disabled?: boolean;
  className?: string;
  assignedUserName?: string; // Name der zugewiesenen Person
  purchaserName?: string; // Name der Person die es gekauft hat
}

export const DraggableGiftItem: React.FC<DraggableGiftItemProps> = ({
  item,
  onToggle,
  onDelete,
  disabled = false,
  className = '',
  assignedUserName,
  purchaserName
}) => {
  const [showDetails, setShowDetails] = useState(false);

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
    opacity: isDragging ? 0.8 : 1,
  };



  const handleToggle = () => {
    onToggle(item.id, !item.isCompleted);
  };

  const hasDetails = item.description || (item as any).notes;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border border-light rounded-3 mb-3 overflow-hidden',
        !isDragging && 'transition-all duration-200 ease-in-out hover:shadow-sm',
        item.isCompleted && 'opacity-75',
        disabled && 'pe-none opacity-40',
        isDragging && 'shadow-lg border-primary',
        className
      )}
    >
      {/* Haupt-Content */}
      <div 
        className={cn(
          'p-3',
          item.isCompleted && 'bg-light bg-opacity-25'
        )}
      >
        {/* Header mit Drag Handle, Checkbox und Name */}
        <div className="d-flex align-items-start gap-3 mb-3">
          
          {/* Drag Handle */}
          {!item.isCompleted && (
            <div 
              {...attributes}
              {...listeners}
              className="d-flex align-items-center justify-content-center text-muted"
              style={{ 
                width: '20px', 
                height: '24px',
                cursor: disabled ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                flexShrink: 0,
                marginTop: '1px',
                padding: '4px'
              }}
              title="Ziehen zum Verschieben"
              onPointerDown={(e) => {
                console.log('🖱️ Drag Handle Pointer Down:', item.name);
                listeners?.onPointerDown?.(e);
              }}
            >
              <i className="bi bi-grip-vertical" style={{ fontSize: '14px' }} />
            </div>
          )}

          {/* Checkbox */}
          <button
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
              'btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center',
              'shadow-sm transition-all duration-200 ease-in-out',
              item.isCompleted
                ? 'btn-success text-white'
                : 'btn-outline-secondary',
            )}
            style={{ 
              width: '24px', 
              height: '24px',
              minWidth: '24px',
              minHeight: '24px',
              flexShrink: 0,
              marginTop: '1px' // Perfekte Ausrichtung mit dem Text
            }}
            aria-label={item.isCompleted ? 'Als nicht gekauft markieren' : 'Als gekauft markieren'}
          >
            {item.isCompleted && (
              <i className="bi bi-check fw-bold" style={{ fontSize: '12px' }} />
            )}
          </button>

          {/* Name und Status */}
          <div className="flex-grow-1 min-w-0">
            <h6 
              className={cn(
                'mb-1 fw-medium',
                item.isCompleted && 'text-decoration-line-through text-muted'
              )}
              style={{ fontSize: '16px', lineHeight: '1.4' }}
            >
              {item.name}
              {item.isCompleted && (
                <span className="ms-2">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '14px' }} />
                </span>
              )}
            </h6>

            {/* Wer hat es gekauft? (bei completed items) */}
            {item.isCompleted && purchaserName && (
              <div className="d-flex align-items-center gap-1 mb-1">
                <i className="bi bi-bag-check-fill text-success" style={{ fontSize: '14px' }} />
                <span className="fw-medium text-success" style={{ fontSize: '13px' }}>
                  Gekauft von: {purchaserName}
                </span>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(item.id)}
            disabled={disabled}
            className={cn(
              'btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center',
              'btn-outline-danger hover:btn-danger',
              'shadow-sm transition-all duration-200 ease-in-out',
              'opacity-60 hover:opacity-100'
            )}
            style={{ 
              width: '28px', 
              height: '28px',
              minWidth: '28px',
              minHeight: '28px',
              flexShrink: 0
            }}
            aria-label="Geschenk löschen"
            title="Geschenk löschen"
          >
            <i className="bi bi-trash" style={{ fontSize: '12px' }} />
          </button>
        </div>

        {/* Gift-spezifische Informationen */}
        <div className="d-flex flex-wrap gap-3 align-items-center">
          {/* Preis */}
          {item.price && (
            <div className="d-flex align-items-center gap-1">
              <i className="bi bi-tag text-muted" style={{ fontSize: '12px' }} />
              <span className="fw-medium text-success">
                {item.price.toFixed(2)} €
              </span>
            </div>
          )}

          {/* Link */}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"

              className="text-decoration-none d-flex align-items-center gap-1 text-primary"
              style={{ fontSize: '14px' }}
            >
              <i className="bi bi-link-45deg" style={{ fontSize: '12px' }} />
              Zum Artikel
            </a>
          )}

          {/* Zugewiesene Person (nur bei nicht-completed items) */}
          {!item.isCompleted && assignedUserName && (
            <div className="d-flex align-items-center gap-1">
              <i className="bi bi-person text-muted" style={{ fontSize: '12px' }} />
              <small className="text-muted">
                Zugewiesen: {assignedUserName}
              </small>
            </div>
          )}

          {/* Details Indikator */}
          {hasDetails && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ fontSize: '12px', padding: '4px 8px', lineHeight: '1' }}
            >
              <i className={`bi bi-chevron-${showDetails ? 'up' : 'down'}`} style={{ fontSize: '10px' }} />
              Details
            </button>
          )}
        </div>
      </div>

      {/* Erweiterte Details (ausklappbar) */}
      {hasDetails && showDetails && (
        <div className="border-top bg-light bg-opacity-50 p-3">
          {item.description && (
            <div className="mb-2">
              <small className="text-muted fw-medium d-block mb-1">
                <i className="bi bi-info-circle me-1" />
                Beschreibung:
              </small>
              <p className="mb-0" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {item.description}
              </p>
            </div>
          )}

          {(item as any).notes && (
            <div>
              <small className="text-muted fw-medium d-block mb-1">
                <i className="bi bi-sticky me-1" />
                Notizen:
              </small>
              <p className="mb-0" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {(item as any).notes}
              </p>
            </div>
          )}
        </div>
      )}


    </div>
  );
};