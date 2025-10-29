import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MobileItem } from './MobileItem';
import { DraggableMobileItem } from './DraggableMobileItem';
import type { Category, Item } from '../../types/todoList';

interface CategorySectionProps {
  category: Category | null; // null = "Ohne Kategorie"
  items: Item[];
  onToggleItem: (itemId: string, completed: boolean) => void;
  onQuantityChange: (itemId: string, quantity: number) => Promise<void>;
  onDeleteItem: (itemId: string) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  items,
  onToggleItem,
  onQuantityChange,
  onDeleteItem,
  onEditCategory,
  onDeleteCategory
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const categoryId = category?.id || 'uncategorized';
  const categoryName = category?.name || 'Ohne Kategorie';
  const categoryIcon = category?.id === 'completed' ? '✅' : (category ? '📂' : '📋');
  
  // Nur für Category-Transfer, nicht für Intra-Category Sorting
  const { isOver, setNodeRef } = useDroppable({
    id: categoryId,
  });

  const completedItems = items.filter(item => item.isCompleted);
  const pendingItems = items.filter(item => !item.isCompleted);

  return (
    <div className="mb-4">
      {/* Category Header - Einfach, ohne Dropzone */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0 d-flex align-items-center">
          <span className="me-2">{categoryIcon}</span>
          <span style={{ color: category?.color }}>{categoryName}</span>
          <span className="badge bg-secondary ms-2">{items.length}</span>
        </h5>
        
        {category && onDeleteCategory && (
          <div className="position-relative">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <i className="bi bi-three-dots"></i>
            </button>
            
            {showDropdown && (
              <div 
                className="dropdown-menu show position-absolute end-0"
                style={{ zIndex: 1000 }}
              >
                {onEditCategory && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onEditCategory(category);
                      setShowDropdown(false);
                    }}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Bearbeiten
                  </button>
                )}
                <button
                  className="dropdown-item text-danger"
                  onClick={() => {
                    onDeleteCategory(category.id);
                    setShowDropdown(false);
                  }}
                >
                  <i className="bi bi-trash me-2"></i>
                  Löschen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drop Zone - nur für Category Transfer */}
      <div 
        ref={setNodeRef}
        className={`${isOver ? 'bg-primary bg-opacity-10 border border-primary rounded' : ''}`}
        style={{
          minHeight: items.length === 0 ? '80px' : 'auto',
          transition: 'all 0.2s ease',
          padding: isOver ? '8px' : '0'
        }}
      >
        {/* Empty State */}
        {items.length === 0 && (
          <div 
            className="d-flex align-items-center justify-content-center text-muted py-4"
            style={{ 
              border: '2px dashed #dee2e6',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          >
            {isOver ? (
              <span className="text-primary">
                <i className="bi bi-arrow-down me-2"></i>
                Hier ablegen
              </span>
            ) : (
              <span>Items hier ablegen...</span>
            )}
          </div>
        )}
        
        {/* Sortable Items List */}
        {pendingItems.length > 0 && (
          <SortableContext 
            items={pendingItems.map(item => item.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="list-group">
              {pendingItems.map(item => (
                <DraggableMobileItem
                  key={item.id}
                  item={item}
                  onToggle={onToggleItem}
                  onQuantityChange={onQuantityChange}
                  onDelete={onDeleteItem}
                />
              ))}
            </div>
          </SortableContext>
        )}
        
        {/* Completed Items - not draggable */}
        {completedItems.length > 0 && (
          <div className={`${pendingItems.length > 0 ? 'border-top mt-2 pt-2' : ''}`}>
            {completedItems.map(item => (
              <MobileItem
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                onQuantityChange={onQuantityChange}
                onDelete={onDeleteItem}
                // completed items sind anklickbar aber nicht draggable
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};