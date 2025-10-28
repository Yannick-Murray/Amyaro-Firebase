import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import { ListGrid, CreateListModal, type CreateListData } from '../components/business';
import { ListService } from '../services/listService';
import { CategoryMigration } from '../utils/categoryMigration';
import type { List } from '../types/todoList';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'shopping' | 'gift'>('all');

  useEffect(() => {
    if (!user) return;
    
    // Initial listen laden
    loadLists();
    
    // Real-time Listener temporär deaktiviert bis Index erstellt ist
    // const unsubscribe = ListService.subscribeToUserLists(user.uid, (updatedLists) => {
    //   console.log('Real-time update: Listen geändert', updatedLists.length);
    //   setLists(updatedLists);
    //   setLoading(false);
    // });

    // return () => unsubscribe();
  }, [user]);

  const loadLists = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Versuche Firebase Listen zu laden...');
      
      // Versuche nur User-Listen zu laden (einfacher Index)
      const userLists = await ListService.getUserLists(user.uid);
      console.log('Firebase Listen erfolgreich geladen:', userLists.length);
      
      // Shared Lists später implementieren wenn Index bereit ist
      setLists(userLists);
      setError(''); // Clear any previous errors
      
    } catch (err: any) {
      console.warn('Firebase Fehler, verwende Mock-Daten:', err.message);
      
      // Fallback auf Mock-Daten nur wenn wirklich nötig
      if (err.message.includes('index') || err.message.includes('permissions')) {
        const mockLists: List[] = [
          {
            id: '1',
            name: 'Demo Einkaufsliste',
            description: 'Beispiel-Liste (Mock-Daten)',
            type: 'shopping',
            userId: user.uid,
            isPrivate: false,
            createdAt: {
              toDate: () => new Date()
            } as any,
            updatedAt: {
              toDate: () => new Date()
            } as any,
            itemCount: {
              total: 3,
              completed: 1
            }
          },
          {
            id: '2',
            name: 'Demo Geschenkeliste',
            description: 'Beispiel-Liste (Mock-Daten)',
            type: 'gift',
            userId: user.uid,
            isPrivate: true,
            createdAt: {
              toDate: () => new Date()
            } as any,
            updatedAt: {
              toDate: () => new Date()
            } as any,
            itemCount: {
              total: 2,
              completed: 0
            }
          }
        ];
        setLists(mockLists);
        setError('Demo-Modus: Firebase Index wird erstellt...');
      } else {
        setError('Fehler beim Laden der Listen');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (data: CreateListData) => {
    if (!user) return;

    try {
      // Liste wurde bereits im Modal erstellt, jetzt optimistisch zur lokalen Liste hinzufügen
      const newList: List = {
        id: `temp-${Date.now()}`, // Temporäre ID bis echte ID geladen wird
        name: data.name,
        description: data.description,
        type: data.type,
        userId: user.uid,
        isPrivate: data.isPrivate,
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
        itemCount: {
          total: 0,
          completed: 0
        }
      };

      // Liste zur aktuellen Liste hinzufügen
      setLists(prev => [newList, ...prev]);
      setShowCreateModal(false);

      // Listen neu laden um echte Daten zu bekommen
      setTimeout(() => loadLists(), 500);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Listen:', error);
      throw error;
    }
  };

  const handleListClick = (list: List) => {
    navigate(`/list/${list.id}`);
  };

  const handleDeleteList = async (list: List) => {
    const itemCount = list.itemCount?.total || 0;
    
    const confirmed = window.confirm(
      `Liste "${list.name}" wirklich löschen?\n\n` +
      `Dies löscht auch alle ${itemCount} Items unwiderruflich!`
    );
    
    if (!confirmed) return;
    
    try {
      await ListService.deleteList(list.id);
      console.log('✅ Liste erfolgreich gelöscht:', list.name);
      
      // Listen neu laden
      await loadLists();
      
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Liste:', error);
      alert('Fehler beim Löschen der Liste. Bitte versuchen Sie es erneut.');
    }
  };

  // TEMPORÄRE Migration Function (später entfernen)
  const runCategoryMigration = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Running category migration...');
      await CategoryMigration.setUserIdForMyCategories(user.uid);
      alert('✅ Categories erfolgreich migriert!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      alert('❌ Migration fehlgeschlagen. Siehe Console für Details.');
    }
  };

  const filteredLists = lists.filter(list => {
    if (filter === 'all') return true;
    return list.type === filter;
  });

  const totalLists = lists.length;
  const shoppingLists = lists.filter(l => l.type === 'shopping').length;
  const giftLists = lists.filter(l => l.type === 'gift').length;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1">Meine Listen</h1>
              <p className="text-muted mb-0">
                Du hast {totalLists} Listen ({shoppingLists} Einkaufslisten, {giftLists} Geschenkelisten)
              </p>
            </div>
            <div className="d-flex gap-2">
              {/* TEMPORÄRER Migration Button */}
              <Button
                variant="warning"
                onClick={runCategoryMigration}
                className="d-flex align-items-center gap-2"
                title="Einmalig ausführen: Categories Migration"
              >
                <i className="bi bi-wrench"></i>
                Migrate Categories
              </Button>
              
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
          <div className="card p-3 text-center">
            <i className="bi bi-gift display-6 text-danger mb-2"></i>
            <h5 className="mb-1">{giftLists}</h5>
            <small className="text-muted">Geschenkelisten</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card p-3 text-center">
            <i className="bi bi-share display-6 text-info mb-2"></i>
            <h5 className="mb-1">{lists.filter(l => l.sharedWith && l.sharedWith.length > 0).length}</h5>
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
            />
            <label className="btn btn-outline-primary" htmlFor="filter-gift">
              🎁 Geschenkelisten ({giftLists})
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