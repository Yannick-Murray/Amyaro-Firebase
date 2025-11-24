import React, { useState, useCallback } from 'react';
import { Modal } from '../ui';
import { Button } from '../ui';
import { FormField, Input, Textarea, Select, type SelectOption } from '../forms';
import { ListService } from '../../services/listService';
import { useAuth } from '../../context/AuthContext';
import { sanitizeString } from '../../utils/helpers';

export interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListData) => Promise<void>;
}

export interface CreateListData {
  name: string;
  description: string;
  type: 'shopping' | 'gift';
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
    type: 'shopping'
  });

  const [submitting, setSubmitting] = useState(false);

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
        undefined, // categoryId
        false // isPrivate - default to false
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
      type: 'shopping'
    });
    onClose();
  }, [onClose]);

  const handleInputChange = useCallback((field: keyof CreateListData, value: any) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'name' || field === 'description' ? sanitizeString(value) : value 
    }));
  }, []);

  const typeOptions: SelectOption[] = [
    { value: 'shopping', label: '🛜 Einkaufsliste' },
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