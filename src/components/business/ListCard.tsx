import React from 'react';
import { Card } from '../ui';
import { cn } from '../../utils/cn';
import type { List } from '../../types/todoList';

export interface ListCardProps {
  list: List;
  onClick?: (list: List) => void;
  className?: string;
}

export const ListCard: React.FC<ListCardProps> = ({
  list,
  onClick,
  className
}) => {
  const handleClick = () => onClick?.(list);

  const typeIcon = list.type === 'shopping' ? 'cart3' : 'gift';
  const completedCount = list.itemCount?.completed || 0;
  const totalCount = list.itemCount?.total || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card
      className={cn(
        'h-100 cursor-pointer',
        'hover:shadow-lg hover:border-primary',
        className
      )}
      onClick={handleClick}
    >
      <div className="card-header pb-2">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className={`bi bi-${typeIcon} text-primary`} />
            <h6 className="mb-0 fw-bold text-truncate">{list.name}</h6>
          </div>
          {list.category && (
            <span className="badge bg-secondary text-white small">
              {list.category.name}
            </span>
          )}
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