import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ItemService } from '../../services/listService';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { FormField, Input, Textarea, Select } from '../forms';
import type { Item } from '../../types/todoList';

interface AddItemModalProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: Item) => void;
}

const AddItemModal = ({ listId, isOpen, onClose, onItemAdded }: AddItemModalProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    price: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    categoryId: '',
    tags: [],
    notes: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔒 SECURITY: Enhanced Input Validation
    if (!user) {
      setError('Benutzer ist nicht angemeldet');
      return;
    }

    // Name validation
    if (!formData.name.trim()) {
      setError('Name ist erforderlich');
      return;
    }

    if (formData.name.trim().length > 200) {
      setError('Name darf maximal 200 Zeichen haben');
      return;
    }

    // Description validation
    if (formData.description.trim().length > 500) {
      setError('Beschreibung darf maximal 500 Zeichen haben');
      return;
    }

    // Quantity validation
    if (formData.quantity < 1 || formData.quantity > 99 || !Number.isInteger(formData.quantity)) {
      setError('Menge muss eine ganze Zahl zwischen 1 und 99 sein');
      return;
    }

    // Price validation
    if (formData.price && (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0 || parseFloat(formData.price) > 99999)) {
      setError('Preis muss eine gültige Zahl zwischen 0 und 99999 sein');
      return;
    }

    // Notes validation
    if (formData.notes.trim().length > 1000) {
      setError('Notizen dürfen maximal 1000 Zeichen haben');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        quantity: formData.quantity,
        price: formData.price ? parseFloat(formData.price) : undefined,
        priority: formData.priority,
        categoryId: formData.categoryId || undefined,
        tags: formData.tags,
        notes: formData.notes.trim() || undefined,
        isCompleted: false,
        order: Date.now() // Simple ordering system
      };

      const itemId = await ItemService.createItem(listId, itemData);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        quantity: 1,
        price: '',
        priority: 'medium',
        categoryId: '',
        tags: [],
        notes: ''
      });

      // Callback for optimistic updates
      if (onItemAdded) {
        onItemAdded({
          id: itemId,
          ...itemData,
          listId,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Error creating item:', err);
      setError('Fehler beim Erstellen des Items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        description: '',
        quantity: 1,
        price: '',
        priority: 'medium',
        categoryId: '',
        tags: [],
        notes: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader>
        <h5 className="modal-title">Item hinzufügen</h5>
      </ModalHeader>
      
      <ModalBody>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="row">
            <div className="col-md-8">
              <FormField
                label="Name *"
                htmlFor="item-name"
              >
                <Input
                  id="item-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="z.B. Milch, Geschenk für Anna"
                  disabled={isLoading}
                  autoFocus
                />
              </FormField>
            </div>
            
            <div className="col-md-4">
              <FormField
                label="Menge"
                htmlFor="item-quantity"
              >
                <Input
                  id="item-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </div>

          <FormField
            label="Beschreibung"
            htmlFor="item-description"
          >
            <Textarea
              id="item-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Zusätzliche Details..."
              rows={3}
              disabled={isLoading}
            />
          </FormField>

          <div className="row">
            <div className="col-md-6">
              <FormField
                label="Preis"
                htmlFor="item-price"
              >
                <div className="input-group">
                  <span className="input-group-text">€</span>
                  <Input
                    id="item-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
              </FormField>
            </div>
            
            <div className="col-md-6">
              <FormField
                label="Priorität"
                htmlFor="item-priority"
              >
                <Select
                  id="item-priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={isLoading}
                  options={[
                    { value: 'low', label: 'Niedrig' },
                    { value: 'medium', label: 'Mittel' },
                    { value: 'high', label: 'Hoch' }
                  ]}
                />
              </FormField>
            </div>
          </div>

          <FormField
            label="Notizen"
            htmlFor="item-notes"
          >
            <Textarea
              id="item-notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Interne Notizen..."
              rows={2}
              disabled={isLoading}
            />
          </FormField>
        </form>
      </ModalBody>
      
      <ModalFooter>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleClose}
          disabled={isLoading}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading || !formData.name.trim()}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Erstellen...
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle me-2"></i>
              Item hinzufügen
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default AddItemModal;