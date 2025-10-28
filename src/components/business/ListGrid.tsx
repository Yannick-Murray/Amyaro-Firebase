import React from 'react';
import { ListCard } from './ListCard';
import { cn } from '../../utils/cn';
import type { List } from '../../types/todoList';

export interface ListGridProps {
  lists: List[];
  loading?: boolean;
  onListClick?: (list: List) => void;
  onListDelete?: (list: List) => void;
  className?: string;
}

export const ListGrid: React.FC<ListGridProps> = ({
  lists,
  loading = false,
  onListClick,
  onListDelete,
  className
}) => {
  if (loading) {
    return (
      <div className={cn('row g-3', className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="placeholder-glow">
                  <div className="placeholder col-8 mb-3"></div>
                  <div className="placeholder col-6 mb-2"></div>
                  <div className="placeholder col-4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className={cn('text-center py-5', className)}>
        <div className="mb-4">
          <i className="bi bi-inbox display-1 text-muted"></i>
        </div>
        <h5 className="text-muted mb-3">Keine Listen vorhanden</h5>
        <p className="text-muted">
          Erstelle deine erste Liste, um loszulegen!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('row g-3', className)}>
      {lists.map((list) => (
        <div key={list.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
          <ListCard
            list={list}
            onClick={onListClick}
            onDelete={onListDelete}
            className="h-100"
          />
        </div>
      ))}
    </div>
  );
};