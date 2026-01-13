import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShopService } from '../../services/shopService';
import type { Shop } from '../../types/todoList';

interface ListPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (destination?: string, price?: number) => void;
  initialDestination?: string;
  initialPrice?: number;
}

export function ListPriceModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  initialDestination,
  initialPrice 
}: ListPriceModalProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Shops laden
      ShopService.getShops()
        .then(setShops)
        .catch(console.error);
      
      // Initial-Werte setzen
      if (initialDestination) {
        setSelectedShop(initialDestination);
      }
      if (initialPrice !== undefined) {
        setPriceInput(initialPrice.toFixed(2));
      }
    } else {
      // Reset bei Close
      setSelectedShop('');
      setPriceInput('');
      setValidationError('');
    }
  }, [isOpen, initialDestination, initialPrice]);

  const validatePrice = (value: string): boolean => {
    if (!value.trim()) return true; // Leer ist ok (optional)
    
    // Regex für Preis: optionales Vorzeichen, Ziffern, optionaler Dezimalpunkt mit 1-2 Dezimalstellen
    const priceRegex = /^\d+([.,]\d{1,2})?$/;
    return priceRegex.test(value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceInput(value);
    
    if (value && !validatePrice(value)) {
      setValidationError('Bitte gib eine gültige Eingabe ein, z.B.: 110.90');
    } else {
      setValidationError('');
    }
  };

  const handleSubmit = () => {
    // Validierung
    if (priceInput && !validatePrice(priceInput)) {
      setValidationError('Bitte gib eine gültige Eingabe ein, z.B.: 110.90');
      return;
    }

    // Werte aufbereiten
    const destination = selectedShop || undefined;
    let price: number | undefined = undefined;
    
    if (priceInput.trim()) {
      // Komma durch Punkt ersetzen für parseFloat
      const normalizedPrice = priceInput.replace(',', '.');
      price = parseFloat(normalizedPrice);
    }

    onConfirm(destination, price);
  };

  const handleSkip = () => {
    onConfirm(undefined, undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Einkaufsdetails">
      <div className="mb-3">
        <p className="text-muted mb-3">
          Optional: Wo hast du eingekauft und wie viel hast du ausgegeben?
        </p>

        <div className="mb-3">
          <label htmlFor="shop-select" className="form-label">
            Einkaufsort
          </label>
          <select
            id="shop-select"
            className="form-select"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
          >
            <option value="">-- Bitte wählen --</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.name}>
                {shop.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="price-input" className="form-label">
            Gesamtpreis (€)
          </label>
          <input
            id="price-input"
            type="text"
            className={`form-control ${validationError ? 'is-invalid' : ''}`}
            placeholder="z.B. 110.90"
            value={priceInput}
            onChange={handlePriceChange}
            inputMode="decimal"
          />
          {validationError && (
            <div className="invalid-feedback">
              {validationError}
            </div>
          )}
        </div>
      </div>

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="secondary" onClick={handleSkip}>
          Überspringen
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={!!validationError}
        >
          Speichern
        </Button>
      </div>
    </Modal>
  );
}
