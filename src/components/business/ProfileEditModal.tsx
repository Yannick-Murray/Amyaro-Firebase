import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../forms/Input';
import { FormField } from '../forms/FormField';
import { sanitizeString } from '../../utils/helpers';
import type { User } from '../../types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdated: (updatedDisplayName: string) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
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

    // Check if name actually changed
    if (displayName.trim() === user.displayName) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedName = sanitizeString(displayName.trim());
      
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: sanitizedName
        });

        // Update Firestore user document
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          displayName: sanitizedName,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Call callback to update context
      onProfileUpdated(sanitizedName);
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError('Fehler beim Speichern der Änderungen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setDisplayName(user.displayName || '');
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="modal-header">
        <h5 className="modal-title mb-0">
          <i className="bi bi-person-gear text-primary me-2"></i>
          Profil bearbeiten
        </h5>
      </div>

      <div className="modal-body">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <FormField
            label="Anzeigename *"
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

          <div className="d-flex gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-fill"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !displayName.trim()}
              className="flex-fill"
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Speichern
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};