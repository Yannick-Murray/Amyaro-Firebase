import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { sanitizeString } from '../../utils/helpers';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCategory: (name: string, color: string) => Promise<void>;
}

const DEFAULT_CATEGORY_COLOR = '#6c757d'; // Standard grau

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCreateCategory
}) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onCreateCategory(sanitizeString(name), DEFAULT_CATEGORY_COLOR);
      setName('');
      onClose();
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Neue Kategorie">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="categoryName" className="form-label">
            Kategorie-Name
          </label>
          <input
            type="text"
            className="form-control"
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Obst & Gemüse"
            disabled={isLoading}
            maxLength={50}
            required
          />
        </div>



        <div className="d-flex justify-content-end gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !name.trim()}
            isLoading={isLoading}
          >
            Erstellen
          </Button>
        </div>
      </form>
    </Modal>
  );
};