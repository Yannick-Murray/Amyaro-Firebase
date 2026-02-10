import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SaveShopModalProps {
  isOpen: boolean;
  shopName: string;
  onSave: (category?: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function SaveShopModal({ 
  isOpen, 
  shopName,
  onSave,
  onSkip,
  onClose
}: SaveShopModalProps) {
  const [category, setCategory] = useState<string>('');

  const handleSave = () => {
    onSave(category || undefined);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Shop speichern?"
    >
      <div className="mb-3">
        <p className="mb-3">
          Möchtest du <strong>"{shopName}"</strong> als Shop speichern, damit er bei zukünftigen Einkäufen zur Auswahl steht?
        </p>

        <div className="mb-3">
          <label htmlFor="shop-category" className="form-label">
            Kategorie (optional)
          </label>
          <select
            id="shop-category"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
      </div>

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="secondary" onClick={onSkip}>
          Nein, nicht speichern
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
        >
          Ja, speichern
        </Button>
      </div>
    </Modal>
  );
}
