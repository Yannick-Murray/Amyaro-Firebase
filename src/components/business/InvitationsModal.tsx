import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { ListInvitation } from '../../types';

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

  const handleAccept = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await onAccept(invitationId);
    } catch (error: any) {
      alert(error.message || 'Fehler beim Annehmen der Einladung');
    } finally {
      setProcessingId('');
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await onDecline(invitationId);
    } catch (error: any) {
      alert(error.message || 'Fehler beim Ablehnen der Einladung');
    } finally {
      setProcessingId('');
    }
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
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
          aria-label="Close"
        ></button>
      </div>
      
      <div className="modal-body px-3">
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
              Wenn jemand eine Liste mit Ihnen teilt, erscheint sie hier.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {invitations.map((invitation) => {
              const { date, time } = formatDateTime(invitation.createdAt);
              return (
                <div key={invitation.id} className="col-12">
                  <div className="card border border-primary border-opacity-25">
                    <div className="card-body p-3">
                      {/* Header */}
                      <div className="d-flex align-items-start justify-content-between mb-3">
                        <div className="flex-grow-1 min-w-0">
                          <h6 className="card-title mb-1 text-truncate">
                            {invitation.listName}
                          </h6>
                          <p className="card-text text-muted small mb-1">
                            von <strong>{invitation.fromUserName}</strong>
                          </p>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {date} um {time}
                          </div>
                        </div>
                        <i className="bi bi-share text-primary ms-2" style={{ fontSize: '1.25rem' }}></i>
                      </div>
                      
                      {/* Actions */}
                      <div className="d-grid gap-2 d-sm-flex">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAccept(invitation.id)}
                          disabled={processingId === invitation.id}
                          isLoading={processingId === invitation.id}
                          className="flex-grow-1 flex-sm-grow-0"
                        >
                          <i className="bi bi-check-lg me-1"></i>
                          Annehmen
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleDecline(invitation.id)}
                          disabled={processingId === invitation.id}
                          className="flex-grow-1 flex-sm-grow-0"
                        >
                          <i className="bi bi-x-lg me-1"></i>
                          Ablehnen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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