import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useListsContext } from '../context/ListsContext';
import { Button, Toast } from '../components/ui';
import { 
  ListGrid, 
  CreateListModal, 
  ClosedListsModal,
  CloseListConfirmModal,
  ListPriceModal,
  type CreateListData 
} from '../components/business';
import { ListService } from '../services/listService';
import { logger } from '../utils/logger';
import type { List } from '../types/todoList';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 🔧 DEBUG: Safe context access with fallback
  let lists: List[] = [];
  let loading = false;
  let error = null;
  let refreshLists = () => {};
  
  try {
    const context = useListsContext();
    lists = context.lists;
    loading = context.loading;
    error = context.error;
    refreshLists = context.refreshLists;
  } catch (contextError) {
    console.error('ListsContext not available:', contextError);
    // Fallback to empty state
  }
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'shopping' | 'gift' | 'closed'>('all');
  
  // Closed Lists Modal
  const [showClosedListsModal, setShowClosedListsModal] = useState(false);
  
  // Close/Reopen Confirm Modal
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [listToClose, setListToClose] = useState<List | null>(null);
  const [isReopenMode, setIsReopenMode] = useState(false);
  
  // Price Modal (shown after close confirmation)
  const [showPriceModal, setShowPriceModal] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleCreateList = async (_data: CreateListData) => {
    if (!user) return;

    try {
      setShowCreateModal(false);

      // Listen neu laden um echte Daten zu bekommen
      setTimeout(() => refreshLists(), 500);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Listen:', error);
      throw error;
    }
  };

  const handleListClick = (list: List) => {
    navigate(`/list/${list.id}`);
  };

  const handleListDelete = async (list: List) => {
    try {
      await ListService.deleteList(list.id);
      // Liste aus dem Context entfernen / neu laden
      refreshLists();
      showToast(`Liste "${list.name}" wurde gelöscht`, 'success');
    } catch (error) {
      logger.error('Fehler beim Löschen der Liste:', error);
      
      // Spezifische Meldung für fehlende Berechtigung
      if (error instanceof Error && error.message.includes('Keine Berechtigung')) {
        showToast('Diese Liste kann nur vom Ersteller der Liste gelöscht werden.', 'error');
      } else {
        showToast('Fehler beim Löschen der Liste. Bitte versuchen Sie es erneut.', 'error');
      }
    }
  };

  const handleListClose = (list: List) => {
    setListToClose(list);
    setIsReopenMode(false);
    setShowCloseConfirmModal(true);
  };

  const handleListReopen = (list: List) => {
    setListToClose(list);
    setIsReopenMode(true);
    setShowCloseConfirmModal(true);
  };

  const handleConfirmCloseReopen = async () => {
    if (!listToClose) return;

    try {
      if (isReopenMode) {
        // Beim Wiedereröffnen: DIREKT wiedereröffnen ohne Price Modal
        await ListService.reopenList(listToClose.id);
        showToast(`Liste "${listToClose.name}" wurde wieder geöffnet`, 'success');
        
        // Schließe das "Geschlossene Listen" Modal falls offen
        setShowClosedListsModal(false);
        
        refreshLists();
        setShowCloseConfirmModal(false);
        setListToClose(null);
      } else {
        // Beim Schließen: zeige Price Modal
        setShowCloseConfirmModal(false);
        setShowPriceModal(true);
      }
    } catch (error) {
      logger.error('Fehler beim Schließen/Wiedereröffnen der Liste:', error);
      showToast('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', 'error');
    }
  };

  const handlePriceModalConfirm = async (destination?: string, price?: number) => {
    if (!listToClose) return;

    try {
      // Nur beim Schließen (nicht beim Wiedereröffnen)
      await ListService.closeList(listToClose.id, destination, price);
      showToast(`Liste "${listToClose.name}" wurde abgeschlossen`, 'success');
      
      refreshLists();
      setShowPriceModal(false);
      setListToClose(null);
    } catch (error) {
      logger.error('Fehler beim Abschließen der Liste:', error);
      showToast('Fehler beim Abschließen der Liste. Bitte versuchen Sie es erneut.', 'error');
    }
  };

  const filteredLists = lists.filter(list => {
    if (filter === 'all') return !list.isClosed; // Alle offenen Listen
    if (filter === 'closed') return list.isClosed; // Nur geschlossene Listen
    return list.type === filter && !list.isClosed; // Nach Typ filtern (nur offene)
  });

  const closedLists = lists.filter(list => list.isClosed && list.type === 'shopping');

  const totalLists = lists.filter(l => !l.isClosed).length;
  const shoppingLists = lists.filter(l => l.type === 'shopping' && !l.isClosed).length;
  const giftLists = lists.filter(l => l.type === 'gift' && !l.isClosed).length;
  const closedListsCount = lists.filter(l => l.isClosed).length;

  // Geteilte Listen: Listen die der User erstellt und geteilt hat ODER Listen die mit dem User geteilt wurden
  const sharedLists = lists.filter(list => {
    // Listen die der User erstellt und mit anderen geteilt hat
    const isOwnerAndShared = list.userId === user?.uid && list.sharedWith && list.sharedWith.length > 0;
    // Listen die mit dem User geteilt wurden (User ist nicht der ursprüngliche Ersteller)
    const isSharedWithUser = list.userId !== user?.uid && list.sharedWith && list.sharedWith.includes(user?.uid || '');
    
    return isOwnerAndShared || isSharedWithUser;
  }).length;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-0">Meine Listen</h1>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="d-flex align-items-center gap-2"
              >
                <i className="bi bi-plus-lg"></i>
                Neue Liste
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Filter - direkt nach Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="btn-group" role="group">
            <input
              type="radio"
              className="btn-check"
              name="listFilter"
              id="filter-all"
              checked={filter === 'all'}
              onChange={() => setFilter('all')}
            />
            <label className="btn btn-outline-primary" htmlFor="filter-all">
              Alle ({totalLists})
            </label>

            <input
              type="radio"
              className="btn-check"
              name="listFilter"
              id="filter-shopping"
              checked={filter === 'shopping'}
              onChange={() => setFilter('shopping')}
            />
            <label className="btn btn-outline-primary" htmlFor="filter-shopping">
              🛒 Einkaufslisten ({shoppingLists})
            </label>

            <input
              type="radio"
              className="btn-check"
              name="listFilter"
              id="filter-gift"
              checked={filter === 'gift'}
              onChange={() => setFilter('gift')}
            />
            <label className="btn btn-outline-primary" htmlFor="filter-gift">
              🎁 Geschenkelisten ({giftLists})
            </label>

            <input
              type="radio"
              className="btn-check"
              name="listFilter"
              id="filter-closed"
              checked={filter === 'closed'}
              onChange={() => setFilter('closed')}
            />
            <label className="btn btn-outline-primary" htmlFor="filter-closed">
              ✓ Geschlossene ({closedListsCount})
            </label>
          </div>
        </div>
      </div>

      {/* Listen Grid - jetzt direkt nach Filter */}
      <div className="row">
        <div className="col-12">
          <ListGrid
            lists={filteredLists}
            loading={loading}
            onListClick={handleListClick}
            onListDelete={handleListDelete}
            onListClose={handleListClose}
            onListReopen={handleListReopen}
            currentUserId={user?.uid}
          />
        </div>
      </div>

      {/* Kompakte Statistiken - am Ende */}
      <div className="row mt-5">
        <div className="col-12">
          <h5 className="text-muted mb-3">Übersicht</h5>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="card p-2 text-center">
            <i className="bi bi-list-ul text-primary mb-1"></i>
            <h6 className="mb-0">{totalLists}</h6>
            <small className="text-muted">Alle Listen</small>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="card p-2 text-center">
            <i className="bi bi-cart text-success mb-1"></i>
            <h6 className="mb-0">{shoppingLists}</h6>
            <small className="text-muted">Einkaufslisten</small>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="card p-2 text-center">
            <i className="bi bi-gift text-warning mb-1"></i>
            <h6 className="mb-0">{giftLists}</h6>
            <small className="text-muted">Geschenkelisten</small>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="card p-2 text-center">
            <i className="bi bi-share text-info mb-1"></i>
            <h6 className="mb-0">{sharedLists}</h6>
            <small className="text-muted">Geteilte Listen</small>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div 
            className="card p-2 text-center cursor-pointer hover-shadow"
            onClick={() => setFilter('closed')}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <i className="bi bi-check-circle text-success mb-1"></i>
            <h6 className="mb-0">{closedListsCount}</h6>
            <small className="text-muted">Geschlossene Listen</small>
          </div>
        </div>
      </div>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateList}
      />
      
      {/* Closed Lists Modal */}
      <ClosedListsModal
        isOpen={showClosedListsModal}
        onClose={() => setShowClosedListsModal(false)}
        lists={closedLists}
        onListClick={handleListClick}
        onListDelete={handleListDelete}
        onListReopen={handleListReopen}
        currentUserId={user?.uid}
      />
      
      {/* Close/Reopen Confirm Modal */}
      <CloseListConfirmModal
        isOpen={showCloseConfirmModal}
        onClose={() => {
          setShowCloseConfirmModal(false);
          setListToClose(null);
        }}
        onConfirm={handleConfirmCloseReopen}
        listName={listToClose?.name || ''}
        isReopenMode={isReopenMode}
      />
      
      {/* Price Modal (shown after confirmation) */}
      <ListPriceModal
        isOpen={showPriceModal}
        onClose={() => {
          setShowPriceModal(false);
          setListToClose(null);
        }}
        onConfirm={handlePriceModalConfirm}
      />
      
      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default Dashboard;