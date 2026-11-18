import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InvitationCard } from './InvitationCard';
import type { ListInvitation } from '../../types';
import { getErrorMessage } from '../../utils/errors';

interface InvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitations: ListInvitation[];
  loading: boolean;
  onAccept: (invitationId: string) => Promise<void>;
  onDecline: (invitationId: string) => Promise<void>;
}

export const InvitationsModal: React.FC<InvitationsModalProps> = ({
  isOpen,
  onClose,
  invitations,
  loading,
  onAccept,
  onDecline
}) => {
  const [processingId, setProcessingId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleAccept = async (invitationId: string) => {
    setProcessingId(invitationId);
    setErrorMessage('');
    try {
      await onAccept(invitationId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Fehler beim Annehmen der Einladung'));
    } finally {
      setProcessingId('');
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    setErrorMessage('');
    try {
      await onDecline(invitationId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Fehler beim Ablehnen der Einladung'));
    } finally {
      setProcessingId('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="modal-header border-0 pb-0">
        <h5 className="modal-title d-flex align-items-center">
          <i className="bi bi-envelope me-2 text-primary"></i>
          Einladungen
          {invitations.length > 0 && (
            <span className="badge bg-primary ms-2">{invitations.length}</span>
          )}
        </h5>
        <button 
          type="button" 
          className="btn-close" 
          onClick={onClose}
          aria-label="Schließen"
        ></button>
      </div>
      
      <div className="modal-body px-3">
        {errorMessage && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
            <span>
              <i className="bi bi-exclamation-circle me-2"></i>
              {errorMessage}
            </span>
            <button
              type="button"
              className="btn-close"
              onClick={() => setErrorMessage('')}
              aria-label="Schließen"
            ></button>
          </div>
        )}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Laden...</span>
            </div>
            <div className="mt-2 text-muted">Einladungen werden geladen...</div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted mb-3"></i>
            <h6 className="text-muted">Keine neuen Einladungen</h6>
            <p className="text-muted small mb-0">
              Wenn jemand eine Liste mit Dir teilt, erscheint diese hier.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="col-12">
                <InvitationCard
                  invitation={invitation}
                  isProcessing={processingId === invitation.id}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {invitations.length > 0 && (
        <div className="modal-footer border-0 pt-0">
          <Button variant="outline-secondary" onClick={onClose} className="w-100">
            Schließen
          </Button>
        </div>
      )}
    </Modal>
  );
};