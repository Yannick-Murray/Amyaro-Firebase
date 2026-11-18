import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InvitationService } from '../../services/invitationService';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, sanitizeEmail } from '../../utils/helpers';
import {
  buildInvitationCopyText,
  buildInvitationEmail,
  buildWebmailComposeUrl,
  type InvitationEmailContent
} from '../../utils/invitationEmail';
import { getErrorMessage } from '../../utils/errors';
import type { List } from '../../types/todoList';
import type { ListInvitation } from '../../types';

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
  list?: List; // Optional - für Sharing-Limit-Check
}

interface SentInvitation {
  email: string;
  content: InvitationEmailContent;
}

const formatInvitationDate = (date: Date): string => {
  const safeDate = date instanceof Date ? date : new Date(date);
  return safeDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const ShareListModal: React.FC<ShareListModalProps> = ({
  isOpen,
  onClose,
  listId,
  listName,
  list
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [sentInvitation, setSentInvitation] = useState<SentInvitation | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [sharedWithNames, setSharedWithNames] = useState<string[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<ListInvitation[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [cancellingId, setCancellingId] = useState('');

  // Check if sharing limit is reached
  const isShareLimitReached = list?.sharedWith && list.sharedWith.length >= 4;

  // Load names of users this list is shared with
  useEffect(() => {
    const loadSharedWithNames = async () => {
      if (!list?.sharedWith || list.sharedWith.length === 0 || !isOpen) {
        setSharedWithNames([]);
        return;
      }

      setLoadingNames(true);
      try {
        const names = await Promise.all(
          list.sharedWith.map(async (userId) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return userData.displayName || userData.email || 'Unbekannter Nutzer';
              }
              return 'Unbekannter Nutzer';
            } catch (error) {
              console.error('Error loading user name:', error);
              return 'Unbekannter Nutzer';
            }
          })
        );
        setSharedWithNames(names);
      } catch (error) {
        console.error('Error loading shared with names:', error);
        setSharedWithNames([]);
      } finally {
        setLoadingNames(false);
      }
    };

    loadSharedWithNames();
  }, [list?.sharedWith, isOpen]);

  // Ausstehende Einladungen dieser Liste laden, damit sie zurückgezogen werden können
  const loadPendingInvitations = useCallback(async () => {
    if (!isOpen || !user) {
      setPendingInvitations([]);
      return;
    }

    setLoadingPending(true);
    try {
      const invitations = await InvitationService.getPendingInvitationsForList(
        listId,
        user.uid
      );
      setPendingInvitations(invitations);
    } finally {
      setLoadingPending(false);
    }
  }, [isOpen, listId, user]);

  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);

  const handleCancelInvitation = async (invitationId: string) => {
    if (!user) return;

    setCancellingId(invitationId);
    setMessage('');
    setMessageType('');

    try {
      await InvitationService.cancelInvitation(invitationId, user.uid);
      setPendingInvitations((previous) =>
        previous.filter((invitation) => invitation.id !== invitationId)
      );
      setMessage('Einladung wurde zurückgezogen.');
      setMessageType('success');
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      setMessage(
        getErrorMessage(
          error,
          'Fehler beim Zurückziehen der Einladung. Bitte versuche es erneut.'
        )
      );
      setMessageType('error');
    } finally {
      setCancellingId('');
    }
  };

  const resetState = () => {
    setEmail('');
    setMessage('');
    setMessageType('');
    setSentInvitation(null);
    setCopyStatus('idle');
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !user) return;
    
    // Frontend validation for sharing limit
    if (isShareLimitReached) {
      setMessage('Listen können nur mit maximal 4 Personen geteilt werden.');
      setMessageType('error');
      return;
    }
    
    // 🔒 SECURITY: Use robust email validation
    if (!isValidEmail(email)) {
      setMessage('Bitte gib eine gültige E-Mail-Adresse ein');
      setMessageType('error');
      return;
    }

    if (email.toLowerCase() === user.email?.toLowerCase()) {
      setMessage('Du kannst die Liste nicht mit dir selbst teilen');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('Einladung wird erstellt...');
    setMessageType('');
    setSentInvitation(null);
    setCopyStatus('idle');

    try {
      const sanitizedEmail = sanitizeEmail(email);

      await InvitationService.sendInvitation(
        listId,
        listName,
        user.uid,
        user.displayName || user.email || 'Unbekannt',
        sanitizedEmail,
        'write'
      );

      const content = buildInvitationEmail({
        toEmail: sanitizedEmail,
        listName,
        inviterName: user.displayName || user.email || 'Unbekannt'
      });

      setSentInvitation({ email: sanitizedEmail, content });
      setMessage('');
      setMessageType('');
    } catch (error) {
      console.error('Error sending invitation:', error);
      setMessage(getErrorMessage(error, 'Fehler beim Senden der Einladung. Bitte versuche es erneut.'));
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEmail = async () => {
    if (!sentInvitation) return;

    const copyText = buildInvitationCopyText(sentInvitation.content);

    try {
      await navigator.clipboard.writeText(copyText);
      setCopyStatus('copied');
      setMessage('Betreff und Text wurden in die Zwischenablage kopiert.');
      setMessageType('success');
    } catch {
      // Fallback für Browser ohne Clipboard-API bzw. ohne HTTPS
      try {
        const textarea = document.createElement('textarea');
        textarea.value = copyText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
          setCopyStatus('copied');
          setMessage('Betreff und Text wurden in die Zwischenablage kopiert.');
          setMessageType('success');
        } else {
          setCopyStatus('error');
          setMessage('Der Text konnte nicht automatisch kopiert werden. Bitte markiere ihn unten und kopiere ihn manuell.');
          setMessageType('error');
        }
      } catch {
        setCopyStatus('error');
        setMessage('Der Text konnte nicht automatisch kopiert werden. Bitte markiere ihn unten und kopiere ihn manuell.');
        setMessageType('error');
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetState();
      onClose();
    }
  };

  const webmailUrls = sentInvitation
    ? {
        gmail: buildWebmailComposeUrl('gmail', sentInvitation.content, sentInvitation.email),
        outlook: buildWebmailComposeUrl('outlook', sentInvitation.content, sentInvitation.email)
      }
    : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Liste teilen">
      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : messageType === 'error' ? 'alert-danger' : 'alert-info'} mb-3`}>
          <i className={`bi bi-${messageType === 'success' ? 'check-circle' : messageType === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
          {message}
        </div>
      )}

      {sentInvitation ? (
        <div>
          <div className="text-center mb-3">
            <i className="bi bi-check-circle display-6 text-success"></i>
            <h5 className="mt-2 mb-1">Einladung erstellt</h5>
            <p className="text-muted mb-0">
              Die Einladung für <strong>{sentInvitation.email}</strong> ist in Amyaro gespeichert.
            </p>
          </div>

          <div className="alert alert-info small">
            <i className="bi bi-check-circle me-1"></i>
            Die Einladung ist bereits in Amyaro gespeichert. Wähle unten, wie du die E-Mail senden möchtest – sie wird aus deinem eigenen Postfach verschickt.
          </div>

          <div className="d-grid gap-2">
            <a
              className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-4 py-2"
              href={sentInvitation.content.mailtoHref}
            >
              <i className="bi bi-envelope-paper"></i>
              E-Mail-Programm öffnen
            </a>

            <div className="d-flex gap-2">
              <a
                className="btn btn-outline-primary flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2"
                href={webmailUrls?.gmail}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-google"></i>
                Gmail (Web)
              </a>
              <a
                className="btn btn-outline-primary flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2"
                href={webmailUrls?.outlook}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-microsoft"></i>
                Outlook (Web)
              </a>
            </div>

            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleCopyEmail}
            >
              <i className="bi bi-clipboard me-1"></i>
              {copyStatus === 'copied' ? 'Betreff und Text kopiert' : 'Betreff und Text kopieren'}
            </Button>
          </div>

          <p className="small text-muted mt-3 mb-2">
            Öffnet sich beim Klick auf „E-Mail-Programm öffnen“ nichts, ist auf diesem Gerät kein E-Mail-Programm eingerichtet. Nutze dann Gmail/Outlook im Browser oder kopiere den Text.
          </p>

          <details className="mt-2">
            <summary className="small text-muted">E-Mail-Text anzeigen</summary>
            <div className="mt-2 p-2 bg-light rounded">
              <p className="small mb-2">
                <strong>Betreff:</strong> {sentInvitation.content.subject}
              </p>
              <pre className="small mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {sentInvitation.content.body}
              </pre>
            </div>
          </details>

          <div className="d-flex justify-content-end mt-3">
            <Button type="button" variant="outline-secondary" onClick={handleClose}>
              Schließen
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleShare}>
          <div className="mb-4">
            <label className="form-label fw-semibold">
              E-Mail-Adresse der Person, mit der du teilen möchtest:
            </label>
            <input
              type="email"
              className="form-control form-control-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="beispiel@email.com"
              disabled={isLoading}
              required
              style={{
                borderRadius: '8px',
                fontSize: '16px' // Prevents zoom on iOS
              }}
            />
            <div className="mt-2 d-flex flex-column gap-1">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1 text-primary"></i>
                Die Person benötigt ein Amyaro-Konto mit genau dieser E-Mail-Adresse. Falls sie noch keins hat, kann sie sich mit dieser Adresse registrieren.
              </small>
              <small className="text-muted">
                <i className="bi bi-envelope me-1 text-secondary"></i>
                Nach dem Erstellen wählst du, ob dein E-Mail-Programm, Gmail/Outlook im Browser oder der kopierte Text verwendet wird. Die E-Mail wird von deiner Adresse gesendet.
              </small>
            </div>
            
            {/* Show shared with users */}
            {list?.sharedWith && list.sharedWith.length > 0 && (
              <div className="mt-2 p-2 bg-light rounded">
                <small className="text-info fw-medium">
                  <i className="bi bi-people me-1"></i>
                  Bereits geteilt mit:
                </small>
                {loadingNames ? (
                  <div className="mt-1">
                    <small className="text-muted">Lade Namen...</small>
                  </div>
                ) : (
                  <div className="mt-1">
                    {sharedWithNames.map((name, index) => (
                      <div key={index} className="d-flex align-items-center gap-1">
                        <i className="bi bi-person text-muted" style={{ fontSize: '0.75rem' }}></i>
                        <small className="text-muted">{name}</small>
                      </div>
                    ))}
                  </div>
                )}
                <small className="text-info mt-1 d-block">
                  ({4 - list.sharedWith.length} von 4 verfügbar)
                </small>
              </div>
            )}

            {/* Ausstehende Einladungen zurückziehen */}
            {(loadingPending || pendingInvitations.length > 0) && (
              <div className="mt-3 p-2 bg-light rounded">
                <small className="text-info fw-medium d-block mb-1">
                  <i className="bi bi-hourglass-split me-1"></i>
                  Ausstehende Einladungen:
                </small>
                {loadingPending ? (
                  <small className="text-muted">Lade Einladungen...</small>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {pendingInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="d-flex align-items-center justify-content-between gap-2"
                      >
                        <div className="min-w-0">
                          <small className="text-muted d-block text-truncate">
                            {invitation.toEmail}
                          </small>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Gültig bis {formatInvitationDate(invitation.expiresAt)} ·{' '}
                            {invitation.permission === 'write' ? 'Bearbeiten' : 'Nur lesen'}
                          </small>
                        </div>
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={cancellingId === invitation.id}
                          isLoading={cancellingId === invitation.id}
                          title="Einladung zurückziehen"
                        >
                          {cancellingId === invitation.id ? null : (
                            <i className="bi bi-x-lg"></i>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isShareLimitReached && (
              <div className="mt-2">
                <small className="text-warning">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Sharing-Limit erreicht: Listen können nur mit maximal 4 Personen geteilt werden.
                </small>
              </div>
            )}
          </div>

          <div className="d-flex gap-2 justify-content-end">
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !email.trim() || isShareLimitReached}
              isLoading={isLoading}
            >
              {isLoading ? 'Erstelle Einladung...' : 'Einladung erstellen'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
