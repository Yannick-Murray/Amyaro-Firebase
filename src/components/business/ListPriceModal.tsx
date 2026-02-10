import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShopService } from '../../services/shopService';
import { SaveShopModal } from './SaveShopModal';
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
  const [shopInput, setShopInput] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [showSaveShopModal, setShowSaveShopModal] = useState(false);
  const [pendingNewShop, setPendingNewShop] = useState<string>('');
  const [pendingDestination, setPendingDestination] = useState<string | undefined>();
  const [pendingPrice, setPendingPrice] = useState<number | undefined>();
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Shops laden
      ShopService.getShops()
        .then((loadedShops) => {
          setShops(loadedShops);
          setFilteredShops(loadedShops);
        })
        .catch(console.error);
      
      // Initial-Werte setzen
      if (initialDestination) {
        setShopInput(initialDestination);
      }
      if (initialPrice !== undefined) {
        setPriceInput(initialPrice.toFixed(2));
      }
    } else {
      // Reset bei Close
      setShopInput('');
      setPriceInput('');
      setValidationError('');
      setShowDropdown(false);
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

  const handleShopInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShopInput(value);
    setShowDropdown(true);
    
    // Filter shops basierend auf Eingabe
    if (value.trim()) {
      const filtered = shops.filter(shop => 
        shop.displayName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredShops(filtered);
    } else {
      setFilteredShops(shops);
    }
  };

  const handleSelectShop = (shop: Shop) => {
    setShopInput(shop.displayName);
    setShowDropdown(false);
  };

  const handleSubmit = () => {
    // Validierung
    if (priceInput && !validatePrice(priceInput)) {
      setValidationError('Bitte gib eine gültige Eingabe ein, z.B.: 110.90');
      return;
    }

    // Prüfe ob eingegebener Shop existiert
    const trimmedShopInput = shopInput.trim();
    const existingShop = shops.find(
      s => s.displayName.toLowerCase() === trimmedShopInput.toLowerCase() ||
           s.name.toLowerCase() === trimmedShopInput.toLowerCase()
    );

    // Werte aufbereiten
    let destination: string | undefined = undefined;
    
    if (existingShop) {
      // Existierender Shop - verwende technischen Namen
      destination = existingShop.name;
    } else if (trimmedShopInput) {
      // Neuer Shop - verwende displayName direkt
      destination = trimmedShopInput;
    }
    
    let price: number | undefined = undefined;
    if (priceInput.trim()) {
      // Komma durch Punkt ersetzen für parseFloat
      const normalizedPrice = priceInput.replace(',', '.');
      price = parseFloat(normalizedPrice);
    }

    // Prüfen ob neuer Shop gespeichert werden soll
    if (!existingShop && trimmedShopInput) {
      // Daten zwischenspeichern und SaveShopModal öffnen
      setPendingDestination(destination);
      setPendingPrice(price);
      setPendingNewShop(trimmedShopInput);
      setShowSaveShopModal(true);
    } else {
      // Kein neuer Shop - direkt bestätigen
      onConfirm(destination, price);
    }
  };

  const handleSaveShop = async (category?: string) => {
    try {
      await ShopService.createUserShop(pendingNewShop, category);
      setShowSaveShopModal(false);
      setPendingNewShop('');
      
      // Shops neu laden
      const updatedShops = await ShopService.getShops();
      setShops(updatedShops);
      
      // Liste schließen mit gespeicherten Werten
      onConfirm(pendingDestination, pendingPrice);
    } catch (error) {
      console.error('Fehler beim Speichern des Shops:', error);
      // Trotz Fehler Liste schließen
      onConfirm(pendingDestination, pendingPrice);
    }
  };

  const handleSkipSaveShop = () => {
    setShowSaveShopModal(false);
    setPendingNewShop('');
    
    // Liste schließen ohne Shop zu speichern
    onConfirm(pendingDestination, pendingPrice);
  };

  const handleSkip = () => {
    onConfirm(undefined, undefined);
  };

  return (
    <>
      <Modal isOpen={isOpen && !showSaveShopModal} onClose={onClose} title="Einkaufsdetails">
        <div className="mb-3">
          <p className="text-muted mb-3">
            Optional: Wo hast du eingekauft und wie viel hast du ausgegeben?
          </p>

          <div className="mb-3 position-relative">
            <label htmlFor="shop-input" className="form-label">
              Einkaufsort
            </label>
            <input
              id="shop-input"
              type="text"
              className="form-control"
              value={shopInput}
              onChange={handleShopInputChange}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Shop auswählen oder eingeben"
              autoComplete="off"
            />
            {showDropdown && filteredShops.length > 0 && (
              <div 
                className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                style={{ maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}
              >
                {filteredShops.map(shop => (
                  <div
                    key={shop.id}
                    className="px-3 py-2 cursor-pointer hover:bg-light"
                    style={{ cursor: 'pointer' }}
                    onMouseDown={() => handleSelectShop(shop)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{shop.displayName}</span>
                      {shop.userId && (
                        <small className="text-muted">Eigener Shop</small>
                      )}
                    </div>
                    {shop.category && (
                      <small className="text-muted">{shop.category}</small>
                    )}
                  </div>
                ))}
              </div>
            )}
            <small className="text-muted">
              Wähle einen Shop aus der Liste oder gib einen neuen ein
            </small>
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

      <SaveShopModal
        isOpen={showSaveShopModal}
        shopName={pendingNewShop}
        onSave={handleSaveShop}
        onSkip={handleSkipSaveShop}
        onClose={handleSkipSaveShop}
      />
    </>
  );
}
