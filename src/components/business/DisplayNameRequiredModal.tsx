import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../forms/Input';
import { FormField } from '../forms/FormField';
import { sanitizeString } from '../../utils/helpers';

interface DisplayNameRequiredModalProps {
  isOpen: boolean;
  onClose: (displayName: string) => void;
}

export const DisplayNameRequiredModal: React.FC<DisplayNameRequiredModalProps> = ({
  isOpen,
  onClose
}) => {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Bitte gib einen Namen ein');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('Name muss mindestens 2 Zeichen haben');
      return;
    }

    if (displayName.trim().length > 50) {
      setError('Name darf maximal 50 Zeichen haben');
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedName = sanitizeString(displayName.trim());
      onClose(sanitizedName);
    } catch (error) {
      console.error('Error setting display name:', error);
      setError('Fehler beim Speichern des Namens');
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} // Nicht schließbar ohne Namen
      size="md"
      backdrop="static" // Modal kann nicht durch Klick außerhalb geschlossen werden
    >
      <div className="modal-header">
        <h5 className="modal-title mb-0">
          <i className="bi bi-person-badge text-primary me-2"></i>
          Anzeigename erforderlich
        </h5>
      </div>

      <div className="modal-body">
        <div className="alert alert-info mb-4">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Wichtiger Hinweis:</strong> Du benötigst einen Anzeigenamen, damit andere Nutzer dich in geteilten Listen erkennen können.
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <FormField
            label="Dein Anzeigename *"
            htmlFor="displayName"
          >
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="z.B. Max Mustermann"
              disabled={isLoading}
              autoFocus
              maxLength={50}
            />
          </FormField>
          <small className="text-muted">
            Dieser Name wird anderen Nutzern in geteilten Listen angezeigt
          </small>

          <div className="d-grid mt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !displayName.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Namen festlegen
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};