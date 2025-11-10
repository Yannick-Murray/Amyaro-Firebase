import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { sanitizeString } from '../../utils/helpers';
import type { List } from '../../types/todoList';

interface EditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: List;
  onListUpdated: (updatedName: string) => void;
}

export const EditListModal: React.FC<EditListModalProps> = ({
  isOpen,
  onClose,
  list,
  onListUpdated
}) => {
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize with current list name when modal opens
  useEffect(() => {
    if (isOpen && list) {
      setListName(list.name);
      setError('');
    }
  }, [isOpen, list]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = listName.trim();
    if (!trimmedName) {
      setError('Listenname darf nicht leer sein');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Listenname muss mindestens 2 Zeichen haben');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Listenname darf maximal 50 Zeichen haben');
      return;
    }

    // No change needed
    if (trimmedName === list.name) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sanitizedName = sanitizeString(trimmedName);
      
      // Update list in Firestore
      const listRef = doc(db, 'lists', list.id);
      await updateDoc(listRef, {
        name: sanitizedName,
        updatedAt: new Date().toISOString()
      });

      // Notify parent component
      onListUpdated(sanitizedName);
      onClose();
    } catch (error) {
      console.error('Error updating list name:', error);
      setError('Fehler beim Aktualisieren des Listennamens');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="modal-header border-0 pb-0">
        <h5 className="modal-title d-flex align-items-center">
          <i className="bi bi-pencil me-2 text-primary"></i>
          Liste bearbeiten
        </h5>
        <button 
          type="button" 
          className="btn-close" 
          onClick={handleClose}
          disabled={loading}
          aria-label="Close"
        ></button>
      </div>
      
      <div className="modal-body px-3">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="listName" className="form-label">
              Listenname
            </label>
            <input
              type="text"
              className="form-control"
              id="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Listenname eingeben"
              disabled={loading}
              maxLength={50}
              autoFocus
            />
            <div className="form-text">
              {listName.length}/50 Zeichen
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
        </form>
      </div>
      
      <div className="modal-footer border-0 pt-0">
        <div className="d-flex gap-2 w-100">
          <Button 
            variant="outline-secondary" 
            onClick={handleClose}
            disabled={loading}
            className="flex-fill"
          >
            Abbrechen
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={loading || !listName.trim()}
            className="flex-fill"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Speichern...
              </>
            ) : (
              <>
                <i className="bi bi-check2 me-2"></i>
                Speichern
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};