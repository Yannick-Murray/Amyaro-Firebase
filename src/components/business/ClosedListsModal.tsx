import React from 'react';
import { Modal } from '../ui/Modal';
import { ListGrid } from './ListGrid';
import type { List } from '../../types/todoList';

interface ClosedListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: List[];
  onListClick: (list: List) => void;
  onListDelete: (list: List) => void;
  onListReopen: (list: List) => void;
  currentUserId?: string;
}

export const ClosedListsModal: React.FC<ClosedListsModalProps> = ({
  isOpen,
  onClose,
  lists,
  onListClick,
  onListDelete,
  onListReopen,
  currentUserId
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Geschlossene Listen"
      size="xl"
      centered
    >
      <div className="mb-3">
        <p className="text-muted small">
          Hier sehen Sie alle abgeschlossenen Einkaufslisten. Klicken Sie auf <i className="bi bi-arrow-counterclockwise text-primary"></i> um eine Liste wieder zu öffnen.
        </p>
      </div>
      
      {lists.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-1 text-muted"></i>
          <p className="text-muted mt-3">Keine geschlossenen Listen vorhanden</p>
        </div>
      ) : (
        <ListGrid
          lists={lists}
          loading={false}
          onListClick={onListClick}
          onListDelete={onListDelete}
          onListReopen={onListReopen}
          currentUserId={currentUserId}
        />
      )}
    </Modal>
  );
};
