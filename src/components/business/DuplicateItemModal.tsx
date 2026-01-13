import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Item } from '../../types/todoList';

interface DuplicateItem {
  name: string;
  existingItem: Item;
}

interface DuplicateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateItem[];
  onConfirmIncreaseQuantity: (duplicates: DuplicateItem[]) => void;
  onConfirmCreateAnyway: (duplicates: DuplicateItem[]) => void;
}

export const DuplicateItemModal: React.FC<DuplicateItemModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  onConfirmIncreaseQuantity,
  onConfirmCreateAnyway
}) => {
  if (duplicates.length === 0) return null;

  const handleIncreaseQuantity = () => {
    onConfirmIncreaseQuantity(duplicates);
    onClose();
  };

  const handleCreateAnyway = () => {
    onConfirmCreateAnyway(duplicates);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="modal-header">
        <h5 className="modal-title mb-0">
          <i className="bi bi-exclamation-triangle text-warning me-2"></i>
          {duplicates.length === 1 ? 'Item bereits vorhanden' : 'Items bereits vorhanden'}
        </h5>
      </div>

      <div className="modal-body">
        <p className="mb-3">
          {duplicates.length === 1 
            ? 'Dieses Item existiert bereits auf deiner Liste:' 
            : 'Diese Items existieren bereits auf deiner Liste:'
          }
        </p>

        <div className="bg-light rounded p-3 mb-4">
          {duplicates.map((duplicate, index) => {
            // Wenn abgehakt: Menge ist quasi 0, wird auf 1 gesetzt
            // Wenn aktiv: Normale Mengenerhöhung
            const isCompleted = duplicate.existingItem.isCompleted;
            const currentQty = duplicate.existingItem.quantity || 1;
            const newQty = isCompleted ? 1 : Math.min(9, currentQty + 1);
            
            return (
              <div key={index} className="mb-3 last:mb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <strong>{duplicate.name}</strong>
                    <div className="text-muted small">
                      {isCompleted ? (
                        <>Abgehakt (Menge: {currentQty})</>
                      ) : (
                        <>Aktuelle Menge: {currentQty}</>
                      )}
                    </div>
                    {isCompleted && (
                      <div className="text-success small">
                        <i className="bi bi-check-circle me-1"></i>
                        Wird reaktiviert
                      </div>
                    )}
                  </div>
                  <div className="text-end">
                    <span className="badge bg-secondary">
                      {isCompleted ? `→ ${newQty}` : `+1 → ${newQty}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-muted mb-0">
          Möchtest du die Menge {duplicates.length === 1 ? 'dieses Items' : 'dieser Items'} um eins erhöhen, 
          oder trotzdem {duplicates.length === 1 ? 'ein neues Item' : 'neue Items'} erstellen?
        </p>
      </div>

      <div className="modal-footer d-flex flex-column gap-2">
        {/* Primärer Action Button - groß und prominent */}
        <Button
          type="button"
          variant="primary"
          onClick={handleIncreaseQuantity}
          className="btn-lg w-100"
        >
          <i className="bi bi-arrow-up-circle me-2"></i>
          Menge erhöhen
        </Button>
        
        {/* Sekundäre Actions - kleinere Buttons nebeneinander */}
        <div className="d-flex gap-2 w-100">
          <Button
            type="button"
            variant="outline-primary"
            onClick={handleCreateAnyway}
            className="flex-fill"
          >
            <i className="bi bi-plus-circle me-1"></i>
            Trotzdem erstellen
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-fill"
          >
            Abbrechen
          </Button>
        </div>
      </div>
    </Modal>
  );
};