import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TodoListService } from '../services/listService';
import { CategoryService } from '../services/listService';
import { TodoItemService } from '../services/itemService';
import type { TodoList, Category, TodoItem } from '../types';
import { getListTypeIcon, getListTypeLabel } from '../utils/helpers';

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [list, setList] = useState<TodoList | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !user) return;

    const loadListData = async () => {
      try {
        setLoading(true);
        
        // TODO: Implement getListById method in TodoListService
        // const listData = await TodoListService.getListById(id);
        // const categoriesData = await CategoryService.getListCategories(id);
        // const itemsData = await TodoItemService.getListItems(id);
        
        // setList(listData);
        // setCategories(categoriesData);
        // setItems(itemsData);
        
        // Placeholder für jetzt
        console.log('Loading list:', id);
        
      } catch (err: any) {
        setError('Fehler beim Laden der Liste');
        console.error('Error loading list:', err);
      } finally {
        setLoading(false);
      }
    };

    loadListData();
  }, [id, user]);

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border spinner-border-custom" role="status">
            <span className="visually-hidden">Lädt...</span>
          </div>
          <p className="mt-2 text-muted">Liste wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>
          Zurück zum Dashboard
        </button>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Liste nicht gefunden
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>
          Zurück zum Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center mb-3">
            <button 
              className="btn btn-outline-secondary me-3"
              onClick={handleBack}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <div 
              className="rounded-circle p-2 me-3"
              style={{ backgroundColor: list.color + '20', color: list.color }}
            >
              <i className={`bi ${getListTypeIcon(list.type)}`}></i>
            </div>
            <div className="flex-grow-1">
              <h1 className="h3 mb-1">{list.title}</h1>
              <p className="text-muted mb-0">
                {getListTypeLabel(list.type)}
                {list.description && ` • ${list.description}`}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary">
                <i className="bi bi-share me-2"></i>
                Teilen
              </button>
              <button className="btn btn-primary">
                <i className="bi bi-plus me-2"></i>
                Item hinzufügen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="row">
        <div className="col-12">
          <div className="amyaro-card p-4 text-center">
            <i className="bi bi-tools display-4 text-muted mb-3"></i>
            <h5 className="text-muted">Listen-Detail wird implementiert</h5>
            <p className="text-muted mb-3">
              Hier werden bald die Items und Kategorien der Liste angezeigt.
            </p>
            <div className="alert alert-info" role="alert">
              <strong>Features in Entwicklung:</strong>
              <ul className="list-unstyled mb-0 mt-2">
                <li>• Items hinzufügen/bearbeiten/löschen</li>
                <li>• Kategorien erstellen und verwalten</li>
                <li>• Drag & Drop zwischen Kategorien</li>
                <li>• Items abhaken (mit automatischer Kategorisierung)</li>
                <li>• Listen-spezifische Felder (Preise, Links, etc.)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListDetail;