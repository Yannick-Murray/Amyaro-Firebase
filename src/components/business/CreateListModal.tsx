import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui';
import { Button } from '../ui';
import { FormField, Input, Textarea, Select, Checkbox, type SelectOption } from '../forms';
import { ListService } from '../../services/listService';
import { useAuth } from '../../context/AuthContext';
import { sanitizeString } from '../../utils/helpers';
import type { Category } from '../../types/todoList';

export interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListData) => Promise<void>;
}

export interface CreateListData {
  name: string;
  description: string;
  type: 'shopping' | 'gift';
  categoryId: string;
  isPrivate: boolean;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateListData>({
    name: '',
    description: '',
    type: 'shopping',
    categoryId: '',
    isPrivate: false
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!user) return;
    
    setCategoriesLoading(true);
    try {
      // 🔒 SECURITY FIX: CreateListModal braucht keine existierenden Kategorien
      // Kategorien werden nach Listenerstellung list-spezifisch erstellt
      setCategories([]);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      // Fallback auf leere Liste
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [user]);

  // Kategorien laden (hier temporär mit statischen Daten)
  useEffect(() => {
    if (isOpen && user) {
      loadCategories();
    }
  }, [isOpen, user, formData.type, loadCategories]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔒 SECURITY: Enhanced Input Validation
    if (!formData.name.trim()) {
      return;
    }

    if (formData.name.trim().length > 100) {
      console.error('Name darf maximal 100 Zeichen haben');
      return;
    }

    if (formData.description.trim().length > 500) {
      console.error('Beschreibung darf maximal 500 Zeichen haben');
      return;
    }

    setSubmitting(true);
    try {
      // Liste in Firebase erstellen
      await ListService.createList(
        user!.uid,
        sanitizeString(formData.name),
        formData.type,
        formData.description.trim() ? sanitizeString(formData.description) : undefined,
        formData.categoryId || undefined,
        formData.isPrivate
      );
      
      // Modal schließen und Parent benachrichtigen
      handleClose();
      await onSubmit(formData);
    } catch (error) {
      console.error('Fehler beim Erstellen der Liste:', error);
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSubmit]);

  const handleClose = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      type: 'shopping',
      categoryId: '',
      isPrivate: false
    });
    onClose();
  }, [onClose]);

  const handleInputChange = useCallback((field: keyof CreateListData, value: any) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'name' || field === 'description' ? sanitizeString(value) : value 
    }));
  }, []);

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Keine Kategorie' },
    ...categories.map(cat => ({
      value: cat.id,
      label: cat.name
    }))
  ];

  const typeOptions: SelectOption[] = [
    { value: 'shopping', label: '🛒 Einkaufsliste' },
    // Temporarily disabled: Gift lists coming soon
    // { value: 'gift', label: '🎁 Geschenkeliste' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="modal-header">
        <h5 className="modal-title mb-0">
          Neue Liste erstellen
        </h5>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="row g-3">
            <div className="col-12">
              <FormField
                label="Listentyp"
                required
                htmlFor="list-type"
              >
                <Select
                  id="list-type"
                  value={formData.type}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'shopping' | 'gift',
                      categoryId: '' // Reset category when type changes
                    }));
                  }}
                  options={typeOptions}
                  placeholder="Listentyp auswählen"
                />
                <div className="form-text text-muted small">
                  🎁 Geschenkelisten kommen bald verfügbar!
                </div>
              </FormField>
            </div>

            <div className="col-12">
              <FormField
                label="Name"
                required
                htmlFor="list-name"
              >
                <Input
                  id="list-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={formData.type === 'shopping' ? 'z.B. Wocheneinkauf' : 'z.B. Weihnachtsgeschenke'}
                  maxLength={100}
                  autoFocus
                />
              </FormField>
            </div>

            <div className="col-12">
              <FormField
                label="Beschreibung (optional)"
                htmlFor="list-description"
              >
                <Textarea
                  id="list-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optionale Beschreibung..."
                  rows={3}
                  maxLength={500}
                />
              </FormField>
            </div>

            <div className="col-12">
              <FormField
                label="Kategorie (optional)"
                htmlFor="list-category"
              >
                <Select
                  id="list-category"
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    categoryId: e.target.value 
                  }))}
                  options={categoryOptions}
                  placeholder={categoriesLoading ? 'Kategorien werden geladen...' : 'Kategorie auswählen'}
                  disabled={categoriesLoading}
                />
              </FormField>
            </div>

            <div className="col-12">
              <Checkbox
                id="list-private"
                checked={formData.isPrivate}
                onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                label="Private Liste (nur für mich sichtbar)"
              />
              <div className="form-text text-muted small">
                Private Listen können nicht geteilt werden
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            disabled={!formData.name.trim() || submitting}
          >
            {submitting ? 'Erstelle...' : 'Liste erstellen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};