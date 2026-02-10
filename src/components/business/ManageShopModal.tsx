import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Shop } from '../../types/todoList';

interface ManageShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (displayName: string, category?: string, order?: number) => Promise<void>;
  mode: 'create' | 'edit';
  existingShop?: Shop;
}

export function ManageShopModal({ 
  isOpen, 
  onClose,
  onSave,
  mode,
  existingShop
}: ManageShopModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('');
  const [order, setOrder] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && existingShop) {
        setDisplayName(existingShop.displayName);
        setCategory(existingShop.category || '');
        setOrder(existingShop.order.toString());
      } else {
        setDisplayName('');
        setCategory('');
        setOrder('');
      }
      setError('');
    }
  }, [isOpen, mode, existingShop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!displayName.trim()) {
      setError('Bitte gib einen Namen für den Shop ein');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('Der Shop-Name muss mindestens 2 Zeichen lang sein');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNum = order ? parseInt(order, 10) : undefined;
      await onSave(
        displayName.trim(), 
        category || undefined,
        orderNum
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern des Shops');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'create' ? 'Neuen Shop hinzufügen' : 'Shop bearbeiten'}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="shop-name" className="form-label">
            Shop-Name <span className="text-danger">*</span>
          </label>
          <input
            id="shop-name"
            type="text"
            className="form-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="z.B. DM, Rossmann, ..."
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <div className="mb-3">
          <label htmlFor="shop-category-manage" className="form-label">
            Kategorie (optional)
          </label>
          <select
            id="shop-category-manage"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">-- Keine Kategorie --</option>
            <option value="discount">Discounter</option>
            <option value="supermarket">Supermarkt</option>
            <option value="drugstore">Drogerie</option>
            <option value="specialty">Fachgeschäft</option>
            <option value="online">Online-Shop</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>

        {mode === 'edit' && (
          <div className="mb-3">
            <label htmlFor="shop-order" className="form-label">
              Sortierung (optional)
            </label>
            <input
              id="shop-order"
              type="number"
              className="form-control"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="z.B. 1, 2, 3, ..."
              disabled={isSubmitting}
              min="0"
            />
            <small className="text-muted">
              Niedrigere Zahlen erscheinen weiter oben in der Liste
            </small>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end">
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
