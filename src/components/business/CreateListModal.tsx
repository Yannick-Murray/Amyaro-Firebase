import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from '../ui';
import { Button } from '../ui';
import { FormField, Input } from '../forms';
import { ListService, FrequencyService } from '../../services/listService';
import type { FrequentSuggestions } from '../../services/listService';
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

  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [createdListId, setCreatedListId] = useState<string | null>(null);
  const [frequentData, setFrequentData] = useState<FrequentSuggestions | null>(null);
  const [loadingFrequent, setLoadingFrequent] = useState(false);
  const [addingItems, setAddingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load frequent items/categories in the background as soon as the modal opens
  useEffect(() => {
    if (!isOpen || !user) {
      setFrequentData(null);
      return;
    }
    let cancelled = false;
    setLoadingFrequent(true);
    FrequencyService.getFrequentItemsAndCategories(user.uid, formData.type)
      .then(data => { if (!cancelled) setFrequentData(data); })
      .catch(() => { if (!cancelled) setFrequentData(null); })
      .finally(() => { if (!cancelled) setLoadingFrequent(false); });
    return () => { cancelled = true; };
  }, [isOpen, user, formData.type]);

  const handleClose = useCallback(() => {
    setFormData({ name: '', description: '', type: 'shopping' });
    setStep('form');
    setCreatedListId(null);
    setFrequentData(null);
    setLoadingFrequent(false);
    setAddingItems(false);
    onClose();
  }, [onClose]);

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
      const listId = await ListService.createList(
        user!.uid,
        sanitizeString(formData.name),
        formData.type,
        formData.description.trim() ? sanitizeString(formData.description) : undefined,
        undefined, // categoryId
        false // isPrivate - default to false
      );
      setCreatedListId(listId);

      // Notify parent so the list appears in the dashboard
      await onSubmit(formData);

      const hasFrequentData =
        (frequentData?.items.length ?? 0) > 0 ||
        (frequentData?.categories.length ?? 0) > 0;

      if (!loadingFrequent && hasFrequentData) {
        setStep('confirm');
      } else {
        handleClose();
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Liste:', error);
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSubmit, frequentData, loadingFrequent, handleClose]);

  const handleAddFrequent = useCallback(async () => {
    if (!createdListId || !frequentData) return;
    setAddingItems(true);
    try {
      await FrequencyService.populateListFromFrequent(
        createdListId,
        frequentData.categories,
        frequentData.items
      );
    } catch (error) {
      console.error('Fehler beim Hinzufügen häufiger Artikel:', error);
    } finally {
      setAddingItems(false);
      handleClose();
    }
  }, [createdListId, frequentData, handleClose]);

  const handleInputChange = useCallback((field: keyof CreateListData, value: any) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'name' || field === 'description' ? sanitizeString(value) : value 
    }));
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      {step === 'form' && (
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title mb-0">
              Neue Liste erstellen
            </h5>
          </div>

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
      )}

      {step === 'confirm' && frequentData && (
        <>
          <div className="modal-header">
            <h5 className="modal-title mb-0">Liste erstellt ✓</h5>
          </div>
          <div className="modal-body">
            <div className="text-center py-3">
              <p className="mb-2 fw-semibold fs-6">
                Meistgekaufte Artikel und Kategorien direkt übernehmen?
              </p>
              <p className="text-muted small mb-0">
                {frequentData.categories.length > 0 && frequentData.items.length > 0 && (
                  <>{frequentData.categories.length} Kategorie{frequentData.categories.length !== 1 ? 'n' : ''} und {frequentData.items.length} Artikel aus deinen bisherigen Einkäufen</>
                )}
                {frequentData.categories.length > 0 && frequentData.items.length === 0 && (
                  <>{frequentData.categories.length} Kategorie{frequentData.categories.length !== 1 ? 'n' : ''} aus deinen bisherigen Einkäufen</>
                )}
                {frequentData.categories.length === 0 && frequentData.items.length > 0 && (
                  <>{frequentData.items.length} Artikel aus deinen bisherigen Einkäufen</>
                )}
              </p>
            </div>
          </div>
          <div className="modal-footer d-flex flex-nowrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={addingItems}
              className="flex-fill text-nowrap"
            >
              Überspringen
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={addingItems}
              disabled={addingItems}
              onClick={handleAddFrequent}
              className="flex-fill text-nowrap"
            >
              {addingItems ? 'Wird hinzugefügt...' : 'Jetzt übernehmen'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};