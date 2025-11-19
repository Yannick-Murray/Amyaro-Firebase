import React, { useState } from 'react';
import { ContextMenu, useContextMenu } from '../ui';
import { useLongPress } from '../../hooks';
import { cn } from '../../utils/cn';
import type { Item } from '../../types/todoList';

export interface GiftItemProps {
  item: Item;
  onToggle: (itemId: string, completed: boolean) => void;
  onDelete: (itemId: string) => void;
  onEdit?: (itemId: string) => void;
  onDuplicate?: (itemId: string) => void;
  onMoveToCategory?: (itemId: string) => void;
  onAssignmentChange?: (itemId: string, assignedUserId: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  assignedUserName?: string; // Name der zugewiesenen Person
  purchaserName?: string; // Name der Person die es gekauft hat
  availableUsers?: Array<{id: string, name: string}>; // Verfügbare Benutzer für Zuweisung
}

export const GiftItem: React.FC<GiftItemProps> = ({
  item,
  onToggle,
  onDelete,
  onEdit,
  onDuplicate,
  onMoveToCategory,
  onAssignmentChange,
  disabled = false,
  className = '',
  assignedUserName,
  purchaserName,
  availableUsers = []
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false);
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
  ].filter(action => !action.disabled || action.id === 'delete');

  // Long Press Handler
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

  const handleCardClick = () => {
    // Nur Details anzeigen wenn es Beschreibung oder Notizen gibt
    if (item.description || (item as any).notes) {
      setShowDetails(!showDetails);
    }
  };

  const hasDetails = item.description || (item as any).notes;

  return (
    <div
      className={cn(
        'border border-light rounded-3 mb-3 overflow-hidden',
        'transition-all duration-200 ease-in-out',
        'hover:shadow-sm',
        item.isCompleted && 'opacity-75',
        disabled && 'pe-none opacity-40',
        className
      )}
    >

      {/* Haupt-Content */}
      <div 
        className={cn(
          'p-3',
          hasDetails && 'cursor-pointer',
          item.isCompleted && 'bg-light bg-opacity-25'
        )}
        onClick={hasDetails ? handleCardClick : undefined}
        {...(hasDetails ? longPressProps : {})}
      >
        {/* Header mit Checkbox und Name */}
        <div className="d-flex align-items-start gap-3 mb-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleToggle();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(item.id);
            }}
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
        <div className="d-flex flex-wrap gap-3 align-items-center" style={{ minHeight: '20px' }}>
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
              onClick={(e) => e.stopPropagation()}
              className="text-decoration-none d-flex align-items-center gap-1 text-primary"
              style={{ fontSize: '14px' }}
            >
              <i className="bi bi-link-45deg" style={{ fontSize: '12px' }} />
              Zum Artikel
            </a>
          )}

          {/* Zugewiesene Person (nur bei nicht-completed items) */}
          {!item.isCompleted && (
            <div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person text-muted" style={{ fontSize: '12px' }} />
                <div className="d-flex align-items-center gap-1">
                  <small className="text-muted">Zugewiesen:</small>
                  {onAssignmentChange && availableUsers.length > 0 ? (
                    <div className="d-flex align-items-center gap-1">
                      <small className="text-muted">
                        {assignedUserName || 'Nicht zugewiesen'}
                      </small>
                      {!showAssignmentDropdown && (
                        <button
                          type="button"
                          className="btn btn-link p-0 text-muted"
                          style={{ fontSize: '12px', lineHeight: '1' }}
                          onClick={() => setShowAssignmentDropdown(true)}
                          disabled={disabled}
                          title="Zuweisung ändern"
                        >
                          <i className="bi bi-chevron-down" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <small className="text-muted">
                      {assignedUserName || 'Nicht zugewiesen'}
                    </small>
                  )}
                </div>
              </div>
              
              {/* Dropdown appears below when opened */}
              {showAssignmentDropdown && onAssignmentChange && availableUsers.length > 0 && (
                <div className="mt-2 ms-4">
                  <select
                    className="form-select form-select-sm"
                    style={{ fontSize: '12px', maxWidth: '200px' }}
                    value={item.assignedTo || ''}
                    onChange={(e) => {
                      onAssignmentChange(item.id, e.target.value || undefined);
                      setShowAssignmentDropdown(false);
                    }}
                    onBlur={() => setShowAssignmentDropdown(false)}
                    disabled={disabled}
                    autoFocus
                  >
                    <option value="">Nicht zugewiesen</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}


        </div>
      </div>

      {/* Notizzettel für Details - nur wenn Details vorhanden */}
      {hasDetails && (
        <div className="position-relative">
          {/* Notizzettel */}
          <div 
            className={`position-relative mt-2 ms-3 cursor-pointer transition-all duration-200 ${showDetails ? 'shadow-lg' : 'shadow-sm'}`}
            style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '3px',
              padding: '8px 12px',
              fontSize: '12px',
              maxWidth: '200px',
              transform: 'rotate(-1deg)',
              transformOrigin: 'top left',
              boxShadow: showDetails ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            {/* "Klebestreifen" Effekt */}
            <div 
              className="position-absolute"
              style={{
                top: '-3px',
                right: '20px',
                width: '25px',
                height: '15px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                border: '1px solid #ddd',
                borderRadius: '2px',
                transform: 'rotate(15deg)'
              }}
            />
            
            <div className="d-flex align-items-center gap-1 text-dark">
              <i className="bi bi-sticky" style={{ fontSize: '11px', color: '#856404' }} />
              <span style={{ color: '#856404', fontWeight: '500' }}>Details</span>
              <i className={`bi bi-chevron-${showDetails ? 'up' : 'down'}`} style={{ fontSize: '10px', color: '#856404' }} />
            </div>
            
            {!showDetails && (
              <div className="text-muted mt-1" style={{ fontSize: '10px', color: '#856404' }}>
                Klicken für mehr Info
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        actions={contextMenu.actions}
        onClose={hideContextMenu}
      />
    </div>
  );
};