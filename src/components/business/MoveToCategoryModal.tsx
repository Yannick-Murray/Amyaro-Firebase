import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Category } from '../../types/todoList';

interface MoveToCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentCategoryId?: string | null;
  itemName: string;
  onMoveToCategory: (categoryId: string | null) => void;
}

export const MoveToCategoryModal: React.FC<MoveToCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentCategoryId,
  itemName,
  onMoveToCategory
}) => {
  const handleMoveToCategory = (categoryId: string | null) => {
    onMoveToCategory(categoryId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="modal-header">
        <h5 className="modal-title mb-0">
          <i className="bi bi-arrow-right-circle text-primary me-2"></i>
          Item verschieben
        </h5>
      </div>

      <div className="modal-body">
        <p className="mb-3">
          Wohin möchtest du <strong>"{itemName}"</strong> verschieben?
        </p>

        <div className="d-grid gap-2">
          {/* Uncategorized Option */}
          <Button
            variant={currentCategoryId === null ? "outline-secondary" : "outline-primary"}
            onClick={() => handleMoveToCategory(null)}
            disabled={currentCategoryId === null}
            className="text-start d-flex align-items-center gap-2"
          >
            <i className="bi bi-inbox"></i>
            <span>Ohne Kategorie</span>
            {currentCategoryId === null && (
              <span className="badge bg-secondary ms-auto">Aktuell hier</span>
            )}
          </Button>

          {/* Category Options */}
          {categories.map(category => (
            <Button
              key={category.id}
              variant={currentCategoryId === category.id ? "outline-secondary" : "outline-primary"}
              onClick={() => handleMoveToCategory(category.id)}
              disabled={currentCategoryId === category.id}
              className="text-start d-flex align-items-center gap-2"
            >
              <div 
                className="rounded-circle"
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: category.color || '#6c757d',
                  flexShrink: 0
                }}
              ></div>
              <span>{category.name}</span>
              {currentCategoryId === category.id && (
                <span className="badge bg-secondary ms-auto">Aktuell hier</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="modal-footer">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Abbrechen
        </Button>
      </div>
    </Modal>
  );
};