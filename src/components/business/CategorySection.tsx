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
  
  // Separate dropzones: header für schnelles Zuweisen, main für Items/leere Kategorien
  const { isOver: isOverHeader, setNodeRef: setHeaderRef } = useDroppable({
    id: `${categoryId}-header`,
  });
  
  const { isOver: isOverMain, setNodeRef: setMainRef } = useDroppable({
    id: categoryId,
  });

  const completedItems = items.filter(item => item.isCompleted);
  const pendingItems = items.filter(item => !item.isCompleted);

    console.log(`🏷️ CategorySection "${category?.name}":`, {
    categoryId: category?.id,
    totalItems: items.length,
    pendingItems: pendingItems.length,
    completedItems: completedItems.length,
    isOverHeader,
    isOverMain,
    dropZoneExists: !!setMainRef
  });

  return (
    <div className="mb-4">
      {/* Category Header - Als Dropzone für schnelles Zuweisen */}
      <div 
        ref={setHeaderRef}
        className={`d-flex align-items-center justify-content-between mb-3 p-2 rounded ${
          isOverHeader ? 'bg-primary bg-opacity-10 border border-primary' : ''
        }`}
        style={{ 
          transition: 'all 0.2s ease',
          cursor: isOverHeader ? 'copy' : 'default'
        }}
      >
        <h5 className="mb-0 d-flex align-items-center">
          <span className="me-2">{categoryIcon}</span>
          <span style={{ color: category?.color }}>{categoryName}</span>
          <span className="badge bg-secondary ms-2">{items.length}</span>
          {isOverHeader && (
            <span className="badge bg-primary ms-2">
              <i className="bi bi-arrow-down me-1"></i>
              Ablegen
            </span>
          )}
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
        ref={setMainRef}
        className={`list-group ${isOverMain ? 'border-primary border-2' : ''}`}
        style={{
          minHeight: '60px', // Always minimum height for drop zone
          backgroundColor: isOverMain ? 'rgba(13, 110, 253, 0.1)' : 'transparent',
          borderRadius: '0.375rem',
          transition: 'all 0.2s ease',
          paddingBottom: items.length > 0 ? '8px' : '0' // Extra Platz für Mini-Dropzone
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
            {isOverMain ? (
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

        {/* Mini-Dropzone - immer verfügbar wenn Kategorie Items hat */}
        {items.length > 0 && (
          <div 
            className="mt-2 p-3 text-center"
            style={{
              border: isOverMain ? '2px solid #0d6efd' : '1px dashed #dee2e6',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              backgroundColor: isOverMain ? 'rgba(13, 110, 253, 0.1)' : 'transparent',
              color: isOverMain ? '#0d6efd' : '#6c757d',
              transition: 'all 0.2s ease',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isOverMain ? (
              <>
                <i className="bi bi-arrow-down me-1"></i>
                Hier ablegen
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-1"></i>
                Weitere Items ablegen...
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};