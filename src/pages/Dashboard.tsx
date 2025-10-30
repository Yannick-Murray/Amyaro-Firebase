import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useListsContext } from '../context/ListsContext';
import { Button } from '../components/ui';
import { ListGrid, CreateListModal, type CreateListData } from '../components/business';
import { ListService } from '../services/listService';
import type { List } from '../types/todoList';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lists, loading, error, refreshLists } = useListsContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'shopping' | 'gift'>('all');

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

  const handleDeleteList = async (list: List) => {
    if (!window.confirm(`Möchtest du die Liste "${list.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      await ListService.deleteList(list.id);
      
      // Listen neu laden
      await refreshLists();
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Liste:', error);
      alert('Fehler beim Löschen der Liste. Bitte versuche es erneut.');
    }
  };

  const filteredLists = lists.filter(list => {
    if (filter === 'all') return true;
    // Temporarily disable gift lists
    if (filter === 'gift') return false;
    return list.type === filter;
  });

  const totalLists = lists.length;
  const shoppingLists = lists.filter(l => l.type === 'shopping').length;
  // const giftLists = lists.filter(l => l.type === 'gift').length;

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

      {/* Statistiken */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center">
            <i className="bi bi-list-ul display-6 text-primary mb-2"></i>
            <h5 className="mb-1">{totalLists}</h5>
            <small className="text-muted">Alle Listen</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center">
            <i className="bi bi-cart display-6 text-success mb-2"></i>
            <h5 className="mb-1">{shoppingLists}</h5>
            <small className="text-muted">Einkaufslisten</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center border-dashed bg-light">
            <i className="bi bi-gift display-6 text-muted mb-2"></i>
            <h5 className="mb-1 text-muted">
              <small className="badge bg-warning text-dark">Bald verfügbar</small>
            </h5>
            <small className="text-muted">Geschenkelisten</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center">
            <i className="bi bi-share display-6 text-info mb-2"></i>
            <h5 className="mb-1">{sharedLists}</h5>
            <small className="text-muted">Geteilte Listen</small>
          </div>
        </div>
      </div>

      {/* Filter */}
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
              disabled
            />
            <label className="btn btn-outline-secondary" htmlFor="filter-gift" style={{ cursor: 'not-allowed' }}>
              🎁 Geschenkelisten <small className="badge bg-warning text-dark ms-1">Bald</small>
            </label>
          </div>
        </div>
      </div>

      {/* Listen Grid */}
      <div className="row">
        <div className="col-12">
          <ListGrid
            lists={filteredLists}
            loading={loading}
            onListClick={handleListClick}
            onListDelete={handleDeleteList}
            currentUserId={user?.uid}
          />
        </div>
      </div>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateList}
      />
    </div>
  );
};

export default Dashboard;