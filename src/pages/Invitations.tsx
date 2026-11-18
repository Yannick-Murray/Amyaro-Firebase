import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InvitationCard } from '../components/business';
import { useInvitations } from '../hooks';
import { clearAuthRedirect } from '../utils/authRedirect';
import { getErrorMessage } from '../utils/errors';

export default function Invitations() {
  const navigate = useNavigate();
  const {
    invitations,
    loading,
    acceptInvitation,
    declineInvitation
  } = useInvitations();
  const [processingId, setProcessingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Nach dem Login über den Einladungslink ist das Ziel erreicht.
  useEffect(() => {
    clearAuthRedirect();
  }, []);

  const handleAccept = async (invitationId: string) => {
    const invitation = invitations.find((item) => item.id === invitationId);

    setProcessingId(invitationId);
    setErrorMessage('');

    try {
      await acceptInvitation(invitationId);

      // Nach dem Annehmen direkt in die freigegebene Liste springen.
      if (invitation?.listId) {
        navigate(`/list/${invitation.listId}`);
      }
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
      await declineInvitation(invitationId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Fehler beim Ablehnen der Einladung'));
    } finally {
      setProcessingId('');
    }
  };

  return (
    <div className="container py-4 py-md-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
            <div>
              <h1 className="h3 mb-1">
                <i className="bi bi-envelope me-2 text-primary"></i>
                Einladungen
                {invitations.length > 0 && (
                  <span className="badge bg-primary ms-2">{invitations.length}</span>
                )}
              </h1>
              <p className="text-muted mb-0">
                Listen, die andere mit dir teilen möchten.
              </p>
            </div>

            <Link to="/" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1"></i>
              Zum Dashboard
            </Link>
          </div>

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
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Laden...</span>
              </div>
              <div className="mt-2 text-muted">Einladungen werden geladen...</div>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted mb-3"></i>
              <h5 className="text-muted">Keine offenen Einladungen</h5>
              <p className="text-muted small mb-3">
                Wenn jemand eine Liste mit dir teilt, erscheint die Einladung hier. Prüfe gegebenenfalls, ob du mit der eingeladenen E-Mail-Adresse angemeldet bist. Einladungen sind 7 Tage gültig.
              </p>
              <Link to="/" className="btn btn-primary btn-sm">
                <i className="bi bi-list-ul me-1"></i>
                Zu meinen Listen
              </Link>
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
      </div>
    </div>
  );
}
