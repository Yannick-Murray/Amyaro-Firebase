import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { sanitizeString } from '../../utils/helpers';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCategory: (name: string, color: string) => Promise<void>;
}

const CATEGORY_COLORS = [
  '#6c757d', // Default gray
  '#dc3545', // Red
  '#fd7e14', // Orange  
  '#ffc107', // Yellow
  '#28a745', // Green
  '#20c997', // Teal
  '#17a2b8', // Cyan
  '#007bff', // Blue
  '#6f42c1', // Purple
  '#e83e8c'  // Pink
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCreateCategory
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onCreateCategory(sanitizeString(name), selectedColor);
      setName('');
      setSelectedColor(CATEGORY_COLORS[0]);
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
      setSelectedColor(CATEGORY_COLORS[0]);
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

        <div className="mb-4">
          <label className="form-label">Farbe wählen</label>
          <div className="d-flex flex-wrap gap-2">
            {CATEGORY_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`btn p-0 border ${selectedColor === color ? 'border-dark border-2' : 'border-light'}`}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: color,
                  borderRadius: '50%'
                }}
                onClick={() => setSelectedColor(color)}
                disabled={isLoading}
                title={`Farbe ${color}`}
              />
            ))}
          </div>
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