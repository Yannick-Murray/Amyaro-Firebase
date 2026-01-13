import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface CloseListConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  listName: string;
  isReopenMode?: boolean;
}

export const CloseListConfirmModal: React.FC<CloseListConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  listName,
  isReopenMode = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReopenMode ? 'Liste wiedereröffnen?' : 'Liste abschließen?'}
      size="md"
      centered
    >
      <div className="mb-4">
        {isReopenMode ? (
          <>
            <p>
              Möchten Sie die Liste <strong>"{listName}"</strong> wirklich wieder öffnen?
            </p>
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Alle abgehakten Items werden wieder aktiv gesetzt.
            </div>
          </>
        ) : (
          <>
            <p>
              Möchten Sie die Liste <strong>"{listName}"</strong> wirklich abschließen?
            </p>
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Alle nicht abgehakten Items werden dabei endgültig entfernt.
            </div>
          </>
        )}
      </div>
      
      <div className="d-flex gap-2 justify-content-end">
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Abbrechen
        </Button>
        <Button
          variant={isReopenMode ? 'primary' : 'success'}
          onClick={onConfirm}
        >
          {isReopenMode ? 'Wiedereröffnen' : 'Bestätigen'}
        </Button>
      </div>
    </Modal>
  );
};
