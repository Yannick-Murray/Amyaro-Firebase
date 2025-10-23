import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableItem } from './DraggableItem';
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
  
  const { isOver, setNodeRef } = useDroppable({
    id: categoryId,
  });

  const completedItems = items.filter(item => item.isCompleted);
  const pendingItems = items.filter(item => !item.isCompleted);

  console.log(`🏷️ CategorySection "${category?.name}":`, {
    categoryId: category?.id,
    dropZoneId: categoryId,
    totalItems: items.length,
    pendingItems: pendingItems.length,
    completedItems: completedItems.length,
    isOver,
    dropZoneExists: !!setNodeRef
  });

  return (
    <div className="mb-4">
      {/* Category Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0 d-flex align-items-center">
          <span className="me-2">{categoryIcon}</span>
          <span style={{ color: category?.color }}>{categoryName}</span>
          <span className="badge bg-secondary ms-2">{items.length}</span>
        </h5>
        
        {category && (
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
                {onDeleteCategory && (
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
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div 
        ref={setNodeRef}
        className={`list-group ${isOver ? 'border-primary border-2' : ''}`}
        style={{
          minHeight: '60px', // Always minimum height for drop zone
          backgroundColor: isOver ? 'rgba(13, 110, 253, 0.1)' : 'transparent',
          borderRadius: '0.375rem',
          transition: 'all 0.2s ease'
        }}
      >
        {items.length === 0 && (
          <div 
            className="d-flex align-items-center justify-content-center text-muted py-3"
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
        
        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <SortableContext items={pendingItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {pendingItems.map(item => (
              <DraggableItem
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                onQuantityChange={onQuantityChange}
                onDelete={onDeleteItem}
              />
            ))}
          </SortableContext>
        )}
        
        {/* Completed Items - not draggable */}
        {completedItems.length > 0 && (
          <>
            {pendingItems.length > 0 && <div className="border-top mt-2 pt-2"></div>}
            {completedItems.map(item => (
              <DraggableItem
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                onQuantityChange={onQuantityChange}
                onDelete={onDeleteItem}
                disabled={true} // Completed items nicht draggable
                  />
                ))}
              </>
            )}
      </div>
    </div>
  );
};