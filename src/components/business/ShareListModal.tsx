import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InvitationService } from '../../services/invitationService';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, sanitizeEmail } from '../../utils/helpers';

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  isOpen,
  onClose,
  listId,
  listName
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !user) return;
    
    // 🔒 SECURITY: Use robust email validation
    if (!isValidEmail(email)) {
      setMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      setMessageType('error');
      return;
    }

    if (email.toLowerCase() === user.email?.toLowerCase()) {
      setMessage('Sie können die Liste nicht mit sich selbst teilen');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('Wir prüfen Ihre Teilen-Anfrage...');
    setMessageType('');

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

      // Success message
      setMessage(`✅ Einladung gesendet! ${sanitizedEmail} erhält eine Benachrichtigung und kann die Liste nach der Bestätigung bearbeiten.`);
      setMessageType('success');
      
      // Reset form after delay
      setTimeout(() => {
        setEmail('');
        setMessage('');
        setMessageType('');
        onClose();
      }, 3000);

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setMessage(error.message || 'Fehler beim Senden der Einladung. Bitte versuchen Sie es erneut.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setMessage('');
      setMessageType('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Liste teilen">
      <form onSubmit={handleShare}>
        <div className="mb-4">
          <label className="form-label fw-semibold">
            E-Mail-Adresse der Person, mit der Sie teilen möchten:
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
          <small className="text-muted mt-1">
            Die Person erhält eine Einladung und muss diese bestätigen, bevor sie Zugriff erhält.
          </small>
        </div>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : messageType === 'error' ? 'alert-danger' : 'alert-info'} mb-3`}>
            <i className={`bi bi-${messageType === 'success' ? 'check-circle' : messageType === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
            {message}
          </div>
        )}

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
            disabled={isLoading || !email.trim()}
            isLoading={isLoading}
          >
            {isLoading ? 'Sende Einladung...' : 'Einladung senden'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};