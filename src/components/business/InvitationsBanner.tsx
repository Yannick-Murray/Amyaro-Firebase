import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { InvitationService } from '../../services/invitationService';
import { Button } from '../ui/Button';
import type { ListInvitation } from '../../types';

export const InvitationsBanner: React.FC = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<ListInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadInvitations();
      // Aufräumen abgelaufener Einladungen (optional - kann entfernt werden wenn zu langsam)
      // InvitationService.cleanupExpiredInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userInvitations = await InvitationService.getUserInvitations(user.uid);
      setInvitations(userInvitations);
    } catch (error) {
      console.error('Fehler beim Laden der Einladungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    if (!user) return;
    
    setProcessingId(invitationId);
    try {
      await InvitationService.acceptInvitation(invitationId, user.uid);
      await loadInvitations(); // Neu laden
    } catch (error: any) {
      console.error('Fehler beim Annehmen der Einladung:', error);
      alert(error.message || 'Fehler beim Annehmen der Einladung');
    } finally {
      setProcessingId('');
    }
  };

  const handleDecline = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await InvitationService.declineInvitation(invitationId);
      await loadInvitations(); // Neu laden
    } catch (error: any) {
      console.error('Fehler beim Ablehnen der Einladung:', error);
      alert(error.message || 'Fehler beim Ablehnen der Einladung');
    } finally {
      setProcessingId('');
    }
  };

  if (loading || invitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="alert alert-info border-start border-primary border-4 mb-3">
          <div className="d-flex align-items-start justify-content-between">
            <div className="flex-grow-1">
              <h6 className="alert-heading mb-2">
                <i className="bi bi-envelope me-2"></i>
                Neue Listen-Einladung
              </h6>
              <p className="mb-2">
                <strong>{invitation.fromUserName}</strong> möchte die Liste{' '}
                <strong>"{invitation.listName}"</strong> mit Ihnen teilen.
              </p>
              <small className="text-muted">
                Erhalten am {invitation.createdAt.toLocaleDateString('de-DE')} um{' '}
                {invitation.createdAt.toLocaleTimeString('de-DE', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </small>
            </div>
            
            <div className="d-flex gap-2 ms-3">
              <Button
                variant="success"
                size="sm"
                onClick={() => handleAccept(invitation.id)}
                disabled={processingId === invitation.id}
                isLoading={processingId === invitation.id}
              >
                <i className="bi bi-check-lg me-1"></i>
                Annehmen
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => handleDecline(invitation.id)}
                disabled={processingId === invitation.id}
              >
                <i className="bi bi-x-lg me-1"></i>
                Ablehnen
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};