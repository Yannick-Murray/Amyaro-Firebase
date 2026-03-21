import React, { useState, useCallback } from 'react';
import { Modal } from '../ui';
import { Button } from '../ui';
import { FormField, Input } from '../forms';
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
                htmlFor="list-type-shopping"
                helpText="Wählen Sie aus, welche Art von Liste Sie anlegen möchten."
              >
                <div className="list-type-selector" role="radiogroup" aria-label="Listentyp auswählen">
                  <button
                    id="list-type-shopping"
                    type="button"
                    role="radio"
                    aria-checked={formData.type === 'shopping'}
                    className={`list-type-option ${formData.type === 'shopping' ? 'active' : ''}`}
                    onClick={() => handleInputChange('type', 'shopping')}
                  >
                    <span className="list-type-icon" aria-hidden="true">🛒</span>
                    <span className="list-type-content">
                      <span className="list-type-title">Einkaufsliste</span>
                      <span className="list-type-subtitle">Für Lebensmittel und Besorgungen</span>
                    </span>
                  </button>

                  <button
                    id="list-type-gift"
                    type="button"
                    role="radio"
                    aria-checked={formData.type === 'gift'}
                    className={`list-type-option ${formData.type === 'gift' ? 'active' : ''}`}
                    onClick={() => handleInputChange('type', 'gift')}
                  >
                    <span className="list-type-icon" aria-hidden="true">🎁</span>
                    <span className="list-type-content">
                      <span className="list-type-title">Geschenkeliste</span>
                      <span className="list-type-subtitle">Für Anlässe und Geschenkideen</span>
                    </span>
                  </button>
                </div>
              </FormField>
            </div>

            <div className="col-12">
              <FormField
                label="Listen-Name"
                required
                htmlFor="list-name"
                helpText={formData.type === 'shopping' ? 'Beispiel: Wocheneinkauf, Drogerie, Baumarkt' : 'Beispiel: Geburtstag Mama, Weihnachten 2026'}
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


          </div>
        </div>

        <div className="modal-footer d-flex flex-nowrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="flex-fill text-nowrap"
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            disabled={!formData.name.trim() || submitting}
            className="flex-fill text-nowrap"
          >
            {submitting ? 'Erstelle...' : 'Liste erstellen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};