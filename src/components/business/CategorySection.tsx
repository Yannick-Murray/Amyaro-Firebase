import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MobileItem } from './MobileItem';
import { DraggableMobileItem } from './DraggableMobileItem';
import { GiftItem } from './GiftItem';

import type { Category, Item } from '../../types/todoList';

export interface CategorySectionProps {
  category: Category | null;
  categoryName?: string; // For custom category names (e.g., person names for gift lists)
  items: Item[];
  onToggleItem: (itemId: string, completed: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => Promise<void>;
  onEditItem?: (itemId: string) => void;
  onDuplicateItem?: (itemId: string) => void;
  onMoveItem?: (itemId: string) => void;
  onReorderItems: (itemIds: string[]) => void;
  onEditCategory?: (categoryId: string, newName: string) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => void;
  onMoveCategoryUp?: (categoryId: string) => void;
  onMoveCategoryDown?: (categoryId: string) => void;
  onToggleExpanded?: () => void;
  onAddItemsToCategory?: (categoryId: string | null, itemNames: string[]) => Promise<void>;
  disabled?: boolean;
  isListView?: boolean; // Neue prop für vereinfachte Listview
  listType?: 'shopping' | 'gift'; // Neue prop für Listen-Typ
  sharedUsers?: Array<{id: string, name: string}>; // Für Zuweisung-Namen
  getAssignedUserName?: (item: Item) => string; // Funktion um zugewiesenen User-Namen zu bekommen
  getPurchaserName?: (item: Item) => string; // Funktion um Käufer-Namen zu bekommen
  onAssignmentChange?: (itemId: string, assignedUserId: string | undefined) => void; // Zuweisung ändern
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  categoryName: customCategoryName,
  items,
  onToggleItem,
  onDeleteItem,
  onQuantityChange,
  onEditItem,
  onDuplicateItem,
  onMoveItem,
  onReorderItems: _onReorderItems,
  onEditCategory,
  onDeleteCategory,
  onMoveCategoryUp,
  onMoveCategoryDown,
  onToggleExpanded: _onToggleExpanded,
  onAddItemsToCategory,
  disabled: _disabled = false,
  isListView = false,
  listType,
  sharedUsers = [],
  getAssignedUserName,
  getPurchaserName,
  onAssignmentChange
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddInput, setQuickAddInput] = useState('');

  // Hilfsfunktion um den Namen der zugewiesenen Person zu finden
  const categoryId = category?.id || 'uncategorized';
  const categoryName = customCategoryName || category?.name || (listType === 'gift' ? 'Noch nicht zugewiesen' : 'Ohne Kategorie');
  
  // Nur für Category-Transfer, nicht für Intra-Category Sorting
  const { isOver, setNodeRef } = useDroppable({
    id: categoryId,
  });

  const completedItems = items.filter(item => item.isCompleted);
  const pendingItems = items.filter(item => !item.isCompleted);

  const handleStartEdit = () => {
    if (category) {
      setEditName(category.name);
      setIsEditing(true);
      setShowDropdown(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!category || !onEditCategory || !editName.trim()) return;
    
    const trimmedName = editName.trim();
    if (trimmedName === category.name) {
      setIsEditing(false);
      return;
    }

    try {
      await onEditCategory(category.id, trimmedName);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing category:', error);
      // Könnte hier eine Toast-Meldung zeigen
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleQuickAddItems = async () => {
    if (!quickAddInput.trim() || !onAddItemsToCategory) return;
    
    // Parse comma-separated items
    const itemNames = quickAddInput
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (itemNames.length === 0) return;

    try {
      await onAddItemsToCategory(category?.id || null, itemNames);
      
      // Reset and close quick add
      setQuickAddInput('');
      setShowQuickAdd(false);
    } catch (error) {
      console.error('Error adding items to category:', error);
      // Could show a toast notification here
    }
  };

  const handleQuickAddKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAddItems();
    } else if (e.key === 'Escape') {
      setQuickAddInput('');
      setShowQuickAdd(false);
    }
  };

  const handleStartQuickAdd = () => {
    setShowQuickAdd(true);
    setShowDropdown(false);
  };

  return (
    <div className="mb-4">
      {/* Modern Category Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-2">
        {isEditing && category ? (
          <div className="d-flex align-items-center flex-grow-1 me-2">
            <input
              type="text"
              className="form-control form-control-sm me-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveEdit}
              autoFocus
              maxLength={30}
            />
            <div className="d-flex gap-1">
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
              >
                <i className="bi bi-check"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCancelEdit}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
          </div>
        ) : (
          <h5 className="mb-0 d-flex align-items-center fw-semibold text-body-emphasis">
            <span className="text-truncate">{categoryName}</span>
            {!isListView && (
              <span className="badge bg-secondary bg-opacity-25 text-secondary ms-2 rounded-pill fs-7">
                {items.length}
              </span>
            )}
          </h5>
        )}
        
        {/* Buttons nur im normalen Modus anzeigen, nicht in Listview */}
        {!isListView && (
          <div className="d-flex gap-1">
            {/* Quick Add Button - Green Plus - nur für echte Kategorien, nicht für "Ohne Kategorie" */}
            {onAddItemsToCategory && category && (
              <button
                className="btn btn-sm btn-success"
                onClick={handleStartQuickAdd}
                title="Items zu dieser Kategorie hinzufügen"
              >
                <i className="bi bi-plus"></i>
              </button>
            )}
            
            {category && onDeleteCategory && (
              <div className="position-relative">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <i className="bi bi-three-dots"></i>
                </button>
            
            {showDropdown && (
              <>
                {/* Backdrop zum Schließen */}
                <div 
                  className="position-fixed top-0 start-0 w-100 h-100"
                  style={{ zIndex: 999 }}
                  onClick={() => setShowDropdown(false)}
                />
                
                {/* Dropdown Menu */}
                <div 
                  className="dropdown-menu show position-absolute end-0"
                  style={{ zIndex: 1000 }}
                >
                {/* Move Category Up */}
                {onMoveCategoryUp && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onMoveCategoryUp(category.id);
                      setShowDropdown(false);
                    }}
                  >
                    <i className="bi bi-arrow-up me-2"></i>
                    Nach oben
                  </button>
                )}
                
                {/* Move Category Down */}
                {onMoveCategoryDown && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onMoveCategoryDown(category.id);
                      setShowDropdown(false);
                    }}
                  >
                    <i className="bi bi-arrow-down me-2"></i>
                    Nach unten
                  </button>
                )}
                
                {/* Divider if we have reorder buttons */}
                {(onMoveCategoryUp || onMoveCategoryDown) && (
                  <hr className="dropdown-divider" />
                )}
                
                {onEditCategory && (
                  <button
                    className="dropdown-item"
                    onClick={handleStartEdit}
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
              </>
            )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Add Input - Inline below category header */}
      {showQuickAdd && (
        <div className="mb-3 px-2">
          <div className="d-flex gap-1 align-items-center">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Item hinzufügen (mehrere mit Komma trennen)"
              value={quickAddInput}
              onChange={(e) => setQuickAddInput(e.target.value)}
              onKeyDown={handleQuickAddKeyPress}
              style={{ fontSize: '0.875rem' }}
              autoFocus
            />
            <button
              type="button"
              className="btn btn-success px-2 py-1"
              style={{ fontSize: '0.75rem', lineHeight: '1' }}
              onClick={handleQuickAddItems}
              disabled={!quickAddInput.trim()}
              title="Hinzufügen"
            >
              <i className="bi bi-check"></i>
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary px-2 py-1"
              style={{ fontSize: '0.75rem', lineHeight: '1' }}
              onClick={() => {
                setQuickAddInput('');
                setShowQuickAdd(false);
              }}
              title="Abbrechen"
            >
              <i className="bi bi-x"></i>
            </button>
          </div>
        </div>
      )}

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
          listType === 'gift' ? (
            <div>
              {pendingItems.map(item => (
                <GiftItem
                  key={item.id}
                  item={item}
                  onToggle={onToggleItem}
                  onDelete={onDeleteItem}
                  onEdit={onEditItem}
                  onDuplicate={onDuplicateItem}
                  onMoveToCategory={onMoveItem}
                  onAssignmentChange={onAssignmentChange}
                  assignedUserName={getAssignedUserName ? getAssignedUserName(item) : ''}
                  purchaserName={getPurchaserName ? getPurchaserName(item) : ''}
                  availableUsers={sharedUsers}
                />
              ))}
            </div>
          ) : (
            <SortableContext 
              items={pendingItems.map(item => item.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="list-group list-group-flush">
                {pendingItems.map(item => (
                  <DraggableMobileItem
                    key={item.id}
                    item={item}
                    onToggle={onToggleItem}
                    onDelete={onDeleteItem}
                    onQuantityChange={onQuantityChange}
                    onEdit={onEditItem}
                    onDuplicate={onDuplicateItem}
                    onMoveToCategory={onMoveItem}
                  />
                ))}
              </div>
            </SortableContext>
          )
        )}
        
        {/* Completed Items - not draggable */}
        {completedItems.length > 0 && (
          <div className={`${pendingItems.length > 0 ? 'border-top mt-2 pt-2' : ''}`}>
            {completedItems.map(item => {
              if (listType === 'gift') {
                return (
                  <GiftItem
                    key={item.id}
                    item={item}
                    onToggle={onToggleItem}
                    onDelete={onDeleteItem}
                    onEdit={onEditItem}
                    onDuplicate={onDuplicateItem}
                    onMoveToCategory={onMoveItem}
                    onAssignmentChange={onAssignmentChange}
                    assignedUserName={getAssignedUserName ? getAssignedUserName(item) : ''}
                    purchaserName={getPurchaserName ? getPurchaserName(item) : ''}
                    availableUsers={sharedUsers}
                  />
                );
              } else {
                return (
                  <MobileItem
                    key={item.id}
                    item={item}
                    onToggle={onToggleItem}
                    onDelete={onDeleteItem}
                    onEdit={onEditItem}
                    onDuplicate={onDuplicateItem}
                    onMoveToCategory={onMoveItem}
                  />
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};