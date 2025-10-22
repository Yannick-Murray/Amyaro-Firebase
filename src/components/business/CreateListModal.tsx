import React, { useState, useEffect } from 'react';
import { Modal } from '../ui';
import { Button } from '../ui';
import { FormField, Input, Textarea, Select, Checkbox, type SelectOption } from '../forms';
import { CategoryService, ListService } from '../../services/listService';
import { useAuth } from '../../context/AuthContext';
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

  // Kategorien laden (hier temporär mit statischen Daten)
  useEffect(() => {
    if (isOpen && user) {
      loadCategories();
    }
  }, [isOpen, user, formData.type]);

  const loadCategories = async () => {
    if (!user) return;
    
    setCategoriesLoading(true);
    try {
      // Echte Firebase Categories laden
      const userCategories = await CategoryService.getUserCategories(user.uid, formData.type);
      setCategories(userCategories);
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      // Fallback auf leere Liste
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      // Liste in Firebase erstellen
      await ListService.createList(
        user!.uid,
        formData.name.trim(),
        formData.type,
        formData.description.trim() || undefined,
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
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      type: 'shopping',
      categoryId: '',
      isPrivate: false
    });
    onClose();
  };

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'Keine Kategorie' },
    ...categories.map(cat => ({
      value: cat.id,
      label: cat.name
    }))
  ];

  const typeOptions: SelectOption[] = [
    { value: 'shopping', label: '🛒 Einkaufsliste' },
    { value: 'gift', label: '🎁 Geschenkeliste' }
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
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'shopping' | 'gift',
                    categoryId: '' // Reset category when type changes
                  }))}
                  options={typeOptions}
                  placeholder="Listentyp auswählen"
                />
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
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))}
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
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
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
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isPrivate: e.target.checked 
                }))}
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