import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ShareService } from '../../services/listService';
import { auth } from '../../config/firebase';

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
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;
    
    if (!validateEmail(email)) {
      setMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      setMessageType('error');
      return;
    }

    if (email.toLowerCase() === auth.currentUser?.email?.toLowerCase()) {
      setMessage('Sie können die Liste nicht mit sich selbst teilen');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await ShareService.shareList(listId, email, 'write');

      // Success message
      setMessage(`Liste "${listName}" wird mit ${email} geteilt`);
      setMessageType('success');
      
      // Reset form after delay
      setTimeout(() => {
        setEmail('');
        setMessage('');
        setMessageType('');
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error sharing list:', error);
      setMessage(error.message || 'Fehler beim Teilen der Liste. Bitte versuchen Sie es erneut.');
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
            Die Person erhält eine Einladung zur gemeinsamen Bearbeitung der Liste.
          </small>
        </div>

        {message && (
          <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} mb-3`}>
            <i className={`bi bi-${messageType === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
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
            {isLoading ? 'Wird geteilt...' : 'Liste teilen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};