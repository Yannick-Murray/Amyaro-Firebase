import React from 'react';
import { Card } from '../ui';
import { cn } from '../../utils/cn';
import type { List } from '../../types/todoList';

export interface ListCardProps {
  list: List;
  onClick?: (list: List) => void;
  onDelete?: (list: List) => void;
  className?: string;
  currentUserId?: string;
}

export const ListCard: React.FC<ListCardProps> = ({
  list,
  onClick,
  onDelete,
  className,
  currentUserId
}) => {
  const handleClick = () => onClick?.(list);
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Verhindert onClick der Card
    onDelete?.(list);
  };

  const typeIcon = list.type === 'shopping' ? 'cart3' : 'gift';
  const completedCount = list.itemCount?.completed || 0;
  const totalCount = list.itemCount?.total || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  // Prüfe ob die Liste mit dem aktuellen User geteilt wurde (User ist nicht der ursprüngliche Ersteller)
  const isSharedWithUser = currentUserId && list.userId !== currentUserId && list.sharedWith?.includes(currentUserId);
  // Prüfe ob der User die Liste erstellt und mit anderen geteilt hat
  const isSharedByUser = currentUserId && list.userId === currentUserId && list.sharedWith && list.sharedWith.length > 0;

  return (
    <Card
      className={cn(
        'h-100 cursor-pointer list-card-hover',
        'hover:shadow-lg hover:border-primary',
        className
      )}
      onClick={handleClick}
      style={{
        position: 'relative'
      }}
    >
      <div className="card-header pb-2">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
            <i className={`bi bi-${typeIcon} text-primary`} />
            <h6 className="mb-0 fw-bold text-truncate">{list.name}</h6>
            
            {/* Shared Indicator */}
            {isSharedWithUser && (
              <div className="d-flex align-items-center">
                <i className="bi bi-person-check text-info me-1" title="Mit Ihnen geteilt"></i>
                <small className="text-info">Geteilt</small>
              </div>
            )}
            {isSharedByUser && (
              <div className="d-flex align-items-center">
                <i className="bi bi-share text-success me-1" title="Von Ihnen geteilt"></i>
                <small className="text-success">{list.sharedWith?.length}</small>
              </div>
            )}
          </div>
          
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {list.category && (
              <span className="badge bg-secondary text-white small">
                {list.category.name}
              </span>
            )}
            
            {/* Delete Button */}
            {onDelete && (
              <button
                className="btn btn-outline-danger btn-sm delete-btn"
                onClick={handleDelete}
                title="Liste löschen"
                style={{ 
                  width: '32px', 
                  height: '32px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-trash" style={{ fontSize: '14px' }}></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card-body pt-0">
        {list.description && (
          <p className="text-muted small mb-3 text-truncate">
            {list.description}
          </p>
        )}

        <div className="d-flex align-items-center justify-content-between">
          <span className="small text-muted">
            {completedCount} / {totalCount} Artikel
          </span>
          
          <div className="d-flex align-items-center gap-2">
            <div className="progress flex-fill" style={{ width: '60px', height: '4px' }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="small text-muted">{Math.round(progress)}%</span>
          </div>
        </div>

        {list.sharedWith && list.sharedWith.length > 0 && (
          <div className="mt-2 d-flex align-items-center gap-1">
            <i className="bi bi-people-fill text-muted small" />
            <span className="small text-muted">
              Geteilt mit {list.sharedWith.length} Person{list.sharedWith.length !== 1 ? 'en' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="card-footer py-2">
        <small className="text-muted">
          Aktualisiert: {new Date(list.updatedAt.toDate()).toLocaleDateString('de-DE')}
        </small>
      </div>
    </Card>
  );
};