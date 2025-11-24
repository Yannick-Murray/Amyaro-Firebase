import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SharedInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  listName: string;
  originalCreatorId: string;
}

export const SharedInfoModal: React.FC<SharedInfoModalProps> = ({
  isOpen,
  onClose,
  listName,
  originalCreatorId
}) => {
  const [creatorName, setCreatorName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (!originalCreatorId || !isOpen) return;
      
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', originalCreatorId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCreatorName(userData.displayName || userData.email || 'Unbekannter Nutzer');
        } else {
          setCreatorName('Unbekannter Nutzer');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Creator-Namens:', error);
        setCreatorName('Unbekannter Nutzer');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorName();
  }, [originalCreatorId, isOpen]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="modal-header border-0 pb-0">
        <h5 className="modal-title d-flex align-items-center">
          <i className="bi bi-info-circle me-2 text-primary"></i>
          Geteilte Liste
        </h5>
      </div>
      
      <div className="modal-body px-3">
        <div className="d-flex align-items-start gap-3">
          <i className="bi bi-share-fill text-primary mt-1" style={{ fontSize: '1.5rem' }}></i>
          <div>
            <h6 className="mb-2">Liste "{listName}" wurde geteilt</h6>
            {loading ? (
              <div className="d-flex align-items-center mb-3">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                <span className="text-muted">Lade Informationen...</span>
              </div>
            ) : (
              <p className="text-muted mb-3">
                <strong>{creatorName}</strong> hat diese Liste mit Ihnen geteilt. 
                Sie können Artikel bearbeiten und abhaken.
              </p>
            )}
            <div className="alert alert-light mb-0">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Nur {loading ? 'der Ersteller' : creatorName} kann diese Liste mit weiteren Personen teilen.
              </small>
            </div>
          </div>
        </div>
      </div>
      
      <div className="modal-footer border-0 pt-0">
        <Button variant="primary" onClick={onClose} className="w-100">
          Verstanden
        </Button>
      </div>
    </Modal>
  );
};