import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ListService } from '../../services/listService';
import { auth, db } from '../../config/firebase';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    uid: string;
    displayName?: string;
    email?: string;
  } | null;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setDeleting(true);
      setError(null);

      // Ensure we have a current user id
      const uid = auth.currentUser?.uid || user.uid;
      if (!uid) throw new Error('Kein angemeldeter Benutzer gefunden');

      // 1) Lösche alle eigenen Listen (inkl. Items & Kategorien)
      const allLists = await ListService.getUserLists(uid);
      const ownedLists = allLists.filter(l => l.userId === uid);

      for (const list of ownedLists) {
        try {
          await ListService.deleteList(list.id);
        } catch (err) {
          console.warn('Fehler beim Löschen der Liste', list.id, err);
        }
      }

      // 2) Geteilte Listen bleiben unverändert (für Robustheit)
      // Das Frontend wird mit nicht-existierenden User-IDs umgehen können

      // 3) Lösche Firestore Nutzer-Dokument
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        console.warn('Benutzer-Dokument konnte nicht gelöscht werden:', err);
      }

      // 4) Lösche Firebase Auth User
      try {
        if (auth.currentUser) {
          await deleteUser(auth.currentUser);
        }
      } catch (err: any) {
        // If reauthentication is required, show specific error message
        if (err?.code === 'auth/requires-recent-login') {
          throw new Error('Aus Sicherheitsgründen müssen Sie sich kürzlich angemeldet haben. Bitte melden Sie sich erneut an und versuchen Sie die Account-Löschung noch einmal.');
        }
        throw err;
      }

      setSuccess(true);
      
      // Auto-close after 2 seconds and navigate
      setTimeout(() => {
        onClose();
        navigate('/');
      }, 2000);

    } catch (error: any) {
      console.error('Fehler beim Löschen des Accounts:', error);
      setError(error?.message || 'Unbekannter Fehler beim Löschen des Accounts');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="md"
      backdrop="static"
      showCloseButton={!deleting}
    >
      <ModalHeader>
        <h5 className="modal-title text-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Account permanent löschen
        </h5>
      </ModalHeader>

      <ModalBody>
        {success ? (
          <div className="text-center">
            <div className="mb-3">
              <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
            </div>
            <h5 className="text-success">Account erfolgreich gelöscht</h5>
            <p className="text-muted">Sie werden zur Startseite weitergeleitet...</p>
          </div>
        ) : (
          <>
            <p>Folgende Daten werden <strong>permanent gelöscht</strong>:</p>

            <ul className="list-unstyled mb-3">
              <li className="mb-2">
                <i className="bi bi-list-ul text-danger me-2"></i>
                <strong>Alle Ihre Listen und Items</strong> werden gelöscht
              </li>
              <li className="mb-2">
                <i className="bi bi-person-x text-info me-2"></i>
                <strong>Ihre persönlichen Daten</strong> werden permanent gelöscht
              </li>
              <li className="mb-2">
                <i className="bi bi-shield-x text-secondary me-2"></i>
                <strong>Ihr Benutzeraccount</strong> wird vollständig entfernt
              </li>
            </ul>
            
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              <small>
                <strong>Hinweis:</strong> In geteilten Listen erscheinen Sie als "Unbekannter Benutzer", 
                aber die Listen selbst bleiben für andere Benutzer erhalten.
              </small>
            </div>

            {user && (
              <div className="bg-light p-3 rounded mb-3">
                <small className="text-muted">Account der gelöscht wird:</small>
                <div className="fw-bold">{user.displayName || 'Unbekannter Benutzer'}</div>
                <div className="text-muted">{user.email}</div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            <p className="text-muted small">
              <strong>Hinweis:</strong> Wenn Sie fortfahren möchten, klicken Sie auf "Account löschen".
            </p>
          </>
        )}
      </ModalBody>

      {!success && (
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={deleting}
          >
            Abbrechen
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="ms-2"
          >
            {deleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Lösche Account...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Account löschen
              </>
            )}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  );
};