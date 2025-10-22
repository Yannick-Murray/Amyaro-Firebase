import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TodoListService } from '../services/listService';
import type { TodoList } from '../types';
import { getListTypeIcon, getListTypeLabel } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();
  const [userLists, setUserLists] = useState<TodoList[]>([]);
  const [sharedLists, setSharedLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadLists = async () => {
      try {
        setLoading(true);
        const [ownLists, shared] = await Promise.all([
          TodoListService.getUserLists(user.uid),
          TodoListService.getSharedLists(user.uid)
        ]);
        
        setUserLists(ownLists);
        setSharedLists(shared);
      } catch (err: any) {
        setError('Fehler beim Laden der Listen');
        console.error('Error loading lists:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLists();
  }, [user]);

  const handleCreateList = (type: 'shopping' | 'gifts') => {
    // TODO: Implement create list modal or navigate to create page
    console.log('Create list:', type);
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border spinner-border-custom" role="status">
            <span className="visually-hidden">Lädt...</span>
          </div>
          <p className="mt-2 text-muted">Listen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">
                Willkommen zurück, {user?.displayName || user?.email}! 👋
              </h1>
              <p className="text-muted mb-0">
                Hier ist dein persönliches Todo-Dashboard
              </p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-success"
                onClick={() => handleCreateList('shopping')}
              >
                <i className="bi bi-cart-plus me-2"></i>
                Einkaufsliste
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleCreateList('gifts')}
              >
                <i className="bi bi-gift me-2"></i>
                Geschenkeliste
              </button>
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
          <div className="amyaro-card p-3 text-center">
            <i className="bi bi-list-ul display-6 text-primary mb-2"></i>
            <h5 className="mb-1">{userLists.length}</h5>
            <small className="text-muted">Eigene Listen</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="amyaro-card p-3 text-center">
            <i className="bi bi-share display-6 text-success mb-2"></i>
            <h5 className="mb-1">{sharedLists.length}</h5>
            <small className="text-muted">Geteilte Listen</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="amyaro-card p-3 text-center">
            <i className="bi bi-cart display-6 text-warning mb-2"></i>
            <h5 className="mb-1">{userLists.filter(l => l.type === 'shopping').length}</h5>
            <small className="text-muted">Einkaufslisten</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="amyaro-card p-3 text-center">
            <i className="bi bi-gift display-6 text-danger mb-2"></i>
            <h5 className="mb-1">{userLists.filter(l => l.type === 'gifts').length}</h5>
            <small className="text-muted">Geschenkelisten</small>
          </div>
        </div>
      </div>

      {/* Eigene Listen */}
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="mb-3">
            <i className="bi bi-person-circle me-2"></i>
            Meine Listen
          </h4>
          {userLists.length === 0 ? (
            <div className="amyaro-card p-4 text-center">
              <i className="bi bi-list-ul display-4 text-muted mb-3"></i>
              <h5 className="text-muted">Noch keine Listen erstellt</h5>
              <p className="text-muted mb-3">
                Erstelle deine erste Liste um loszulegen!
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <button 
                  className="btn btn-success"
                  onClick={() => handleCreateList('shopping')}
                >
                  <i className="bi bi-cart-plus me-2"></i>
                  Einkaufsliste erstellen
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleCreateList('gifts')}
                >
                  <i className="bi bi-gift me-2"></i>
                  Geschenkeliste erstellen
                </button>
              </div>
            </div>
          ) : (
            <div className="row">
              {userLists.map((list) => (
                <div key={list.id} className="col-md-6 col-lg-4 mb-3">
                  <Link to={`/list/${list.id}`} className="text-decoration-none">
                    <div className="amyaro-card p-3 h-100">
                      <div className="d-flex align-items-center mb-2">
                        <div 
                          className="rounded-circle p-2 me-3"
                          style={{ backgroundColor: list.color + '20', color: list.color }}
                        >
                          <i className={`bi ${getListTypeIcon(list.type)}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{list.title}</h6>
                          <small className="text-muted">
                            {getListTypeLabel(list.type)}
                          </small>
                        </div>
                      </div>
                      {list.description && (
                        <p className="text-muted small mb-2">{list.description}</p>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Erstellt {new Date(list.createdAt).toLocaleDateString('de-DE')}
                        </small>
                        <i className="bi bi-arrow-right text-primary"></i>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Geteilte Listen */}
      {sharedLists.length > 0 && (
        <div className="row">
          <div className="col-12">
            <h4 className="mb-3">
              <i className="bi bi-share me-2"></i>
              Mit mir geteilte Listen
            </h4>
            <div className="row">
              {sharedLists.map((list) => (
                <div key={list.id} className="col-md-6 col-lg-4 mb-3">
                  <Link to={`/list/${list.id}`} className="text-decoration-none">
                    <div className="amyaro-card p-3 h-100">
                      <div className="d-flex align-items-center mb-2">
                        <div 
                          className="rounded-circle p-2 me-3"
                          style={{ backgroundColor: list.color + '20', color: list.color }}
                        >
                          <i className={`bi ${getListTypeIcon(list.type)}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">
                            {list.title}
                            <span className="badge bg-secondary ms-2">Geteilt</span>
                          </h6>
                          <small className="text-muted">
                            {getListTypeLabel(list.type)}
                          </small>
                        </div>
                      </div>
                      {list.description && (
                        <p className="text-muted small mb-2">{list.description}</p>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="bi bi-share me-1"></i>
                          Geteilt von einem anderen Benutzer
                        </small>
                        <i className="bi bi-arrow-right text-primary"></i>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;