import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ItemService } from '../../services/listService';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { FormField, Input, Textarea, Select } from '../forms';
import { 
  sanitizeString, 
  sanitizeUrl, 
  validateTextInput, 
  validatePrice, 
  validateQuantity, 
  isValidUrl 
} from '../../utils/helpers';
import type { Item } from '../../types/todoList';

interface AddItemModalProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: Item) => void;
  listType?: 'shopping' | 'gift';
  sharedUsers?: Array<{id: string, name: string}>;
  categories?: Array<{id: string, name: string}>;
}

const AddItemModal = ({ listId, isOpen, onClose, onItemAdded, listType = 'shopping', sharedUsers = [], categories = [] }: AddItemModalProps) => {
  const { user } = useAuth();
  const formId = 'add-item-form';
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
    notes: '',
    link: '',
    assignedTo: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔒 SECURITY: Enhanced Input Validation with XSS Protection
    if (!user) {
      setError('Benutzer ist nicht angemeldet');
      return;
    }

    // Name validation with security checks
    const nameValidation = validateTextInput(formData.name, 200);
    if (!nameValidation.isValid) {
      setError(nameValidation.error || 'Ungültiger Name');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Name ist erforderlich');
      return;
    }

    // Description validation with security checks
    if (formData.description.trim()) {
      const descValidation = validateTextInput(formData.description, 500);
      if (!descValidation.isValid) {
        setError(descValidation.error || 'Ungültige Beschreibung');
        return;
      }
    }

    // Quantity validation with enhanced checks
    const quantityValidation = validateQuantity(formData.quantity);
    if (!quantityValidation.isValid) {
      setError(quantityValidation.error || 'Ungültige Menge');
      return;
    }

    // Price validation with enhanced checks
    if (formData.price.trim()) {
      const priceValidation = validatePrice(formData.price);
      if (!priceValidation.isValid) {
        setError(priceValidation.error || 'Ungültiger Preis');
        return;
      }
    }

    // Notes validation with security checks
    if (formData.notes.trim()) {
      const notesValidation = validateTextInput(formData.notes, 1000);
      if (!notesValidation.isValid) {
        setError(notesValidation.error || 'Ungültige Notizen');
        return;
      }
    }
    
    // URL validation with security checks
    if (formData.link && formData.link.trim()) {
      if (!isValidUrl(formData.link)) {
        setError('Link muss eine gültige HTTPS/HTTP URL sein (keine lokalen Adressen)');
        return;
      }
    }

    try {
      setIsLoading(true);
      setError('');

      // 🔒 SECURITY: Sanitize all user inputs before database submission
      const itemData = {
        name: sanitizeString(formData.name),
        description: formData.description.trim() ? sanitizeString(formData.description) : undefined,
        quantity: validateQuantity(formData.quantity).value || 1,
        price: formData.price.trim() ? validatePrice(formData.price).value : undefined,
        priority: formData.priority,
        categoryId: formData.categoryId || undefined,
        tags: Array.isArray(formData.tags) ? formData.tags.map(tag => sanitizeString(String(tag))) : [],
        notes: formData.notes.trim() ? sanitizeString(formData.notes) : undefined,
        link: formData.link && formData.link.trim() ? sanitizeUrl(formData.link) : undefined,
        assignedTo: formData.assignedTo || undefined,
        isCompleted: false,
        order: Date.now() // Simple ordering system
      };
      
      // 🔒 SECURITY: Final validation - ensure no empty or invalid data reaches database
      if (!itemData.name || itemData.name.length === 0) {
        setError('Name konnte nicht verarbeitet werden - bitte überprüfen Sie Ihre Eingabe');
        return;
      }

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
        notes: '',
        link: '',
        assignedTo: ''
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
        notes: '',
        link: '',
        assignedTo: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" className="add-item-modal-content">
      <ModalHeader>
        <h5 className="modal-title">
          {listType === 'gift' ? 'Geschenk hinzufügen' : 'Item hinzufügen'}
        </h5>
      </ModalHeader>
      
      <ModalBody>
        <form id={formId} onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {listType === 'gift' ? (
            // Gift-specific form layout
            <>
              <div className="gift-form-section-title">Basisdaten</div>

              <FormField label="Geschenkname" required htmlFor="gift-name">
                <Input
                  id="gift-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="z.B. Kuscheltierlöwe, Lego Baukasten"
                  disabled={isLoading}
                  autoFocus
                />
              </FormField>

              <div className="row">
                <div className="col-md-6">
                  <FormField label="Preis" htmlFor="gift-price">
                    <div className="position-relative">
                      <Input
                        id="gift-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="25.00"
                        disabled={isLoading}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <span className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted">
                        €
                      </span>
                    </div>
                  </FormField>
                </div>
                
                <div className="col-md-6">
                  <FormField label="Priorität" htmlFor="gift-priority-medium">
                    <div className="gift-priority-selector" role="radiogroup" aria-label="Priorität auswählen">
                      <button
                        id="gift-priority-low"
                        type="button"
                        role="radio"
                        aria-checked={formData.priority === 'low'}
                        className={`gift-priority-option ${formData.priority === 'low' ? 'active' : ''}`}
                        onClick={() => handleInputChange('priority', 'low')}
                        disabled={isLoading}
                      >
                        Niedrig
                      </button>
                      <button
                        id="gift-priority-medium"
                        type="button"
                        role="radio"
                        aria-checked={formData.priority === 'medium'}
                        className={`gift-priority-option ${formData.priority === 'medium' ? 'active' : ''}`}
                        onClick={() => handleInputChange('priority', 'medium')}
                        disabled={isLoading}
                      >
                        Mittel
                      </button>
                      <button
                        id="gift-priority-high"
                        type="button"
                        role="radio"
                        aria-checked={formData.priority === 'high'}
                        className={`gift-priority-option ${formData.priority === 'high' ? 'active' : ''}`}
                        onClick={() => handleInputChange('priority', 'high')}
                        disabled={isLoading}
                      >
                        Hoch
                      </button>
                    </div>
                  </FormField>
                </div>
              </div>

              <div className="gift-form-section-title">Optionale Details</div>

              <FormField label="Link zum Geschenk" htmlFor="gift-link">
                <Input
                  id="gift-link"
                  type="url"
                  value={formData.link || ''}
                  onChange={(e) => handleInputChange('link', e.target.value)}
                  placeholder="https://www.amazon.de/..."
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Beschreibung" htmlFor="gift-description">
                <Textarea
                  id="gift-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Zusätzliche Details zum Geschenk..."
                  rows={3}
                  disabled={isLoading}
                />
              </FormField>

              <div className="row">
                <div className="col-md-8">
                  <FormField label="Zugewiesen an" htmlFor="gift-assignment">
                    <Select
                      id="gift-assignment"
                      value={formData.assignedTo || ''}
                      onChange={(e) => handleInputChange('assignedTo', e.target.value || undefined)}
                      disabled={isLoading}
                      options={[
                        { value: '', label: 'Noch nicht zugewiesen' },
                        ...sharedUsers.map(user => ({
                          value: user.id,
                          label: user.name
                        }))
                      ]}
                    />
                  </FormField>
                </div>
                
                <div className="col-md-12">
                  <FormField label="Notizen" htmlFor="gift-notes">
                    <Textarea
                      id="gift-notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="z.B. Falls verfügbar"
                      rows={2}
                      disabled={isLoading}
                    />
                  </FormField>
                </div>
              </div>
            </>
          ) : (
            // Shopping list form layout (existing)
            <>
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
                      placeholder="z.B. Milch, Brot"
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

              <div className="row">
                <div className="col-md-8">
                  <FormField
                    label="Kategorie"
                    htmlFor="item-category"
                  >
                    <Select
                      id="item-category"
                      value={formData.categoryId || ''}
                      onChange={(e) => handleInputChange('categoryId', e.target.value || undefined)}
                      disabled={isLoading}
                      placeholder="Kategorie wählen..."
                      options={categories.map(category => ({
                        value: category.id,
                        label: category.name
                      }))}
                    />
                  </FormField>
                </div>
                
                <div className="col-md-4">
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
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0.00"
                        disabled={isLoading}
                      />
                    </div>
                  </FormField>
                </div>
                
                <div className="col-md-6">
                  <FormField
                    label="Link"
                    htmlFor="item-link"
                  >
                    <Input
                      id="item-link"
                      type="url"
                      value={formData.link || ''}
                      onChange={(e) => handleInputChange('link', e.target.value)}
                      placeholder="https://..."
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

              <FormField
                label="Notizen"
                htmlFor="item-notes"
              >
                <Input
                  id="item-notes"
                  type="text"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Nur falls es geht"
                  disabled={isLoading}
                />
              </FormField>
            </>
          )}
        </form>
      </ModalBody>
      
      <ModalFooter className="d-flex flex-nowrap gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary flex-fill text-nowrap"
          onClick={handleClose}
          disabled={isLoading}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="btn btn-primary flex-fill text-nowrap"
          form={formId}
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
              {listType === 'gift' ? 'Geschenk hinzufügen' : 'Item hinzufügen'}
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default AddItemModal;