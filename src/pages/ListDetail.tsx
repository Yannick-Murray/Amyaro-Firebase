import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ListService, CategoryService, ItemService } from '../services/listService';
import type { List, Category, Item } from '../types/todoList';
import { getListTypeIcon, getListTypeLabel } from '../utils/helpers';
import { QuickAddInput } from '../components/business/QuickAddInput';
import { CategorySection } from '../components/business/CategorySection';
import { CreateCategoryModal } from '../components/business/CreateCategoryModal';
import { 
  DndContext, 
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import { DraggableItem } from '../components/business/DraggableItem';

const ListDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [list, setList] = useState<List | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  // Mobile-friendly drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Load data function
  const loadListData = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      setError('');
      
      const [listData, itemsData, categoriesData] = await Promise.all([
        ListService.getListById(id),
        ItemService.getListItems(id),
        CategoryService.getListCategories(id)
      ]);
      
      setList(listData);
      setItems(itemsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Fehler beim Laden der Liste:', error);
      setError('Fehler beim Laden der Liste');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListData();
  }, [id, user]);

  // Group items by category - clean up invalid categoryIds
  const grouped = useMemo(() => {
    const groupedItems: { [categoryId: string]: Item[] } = {};
    const validCategoryIds = categories.map(c => c.id);
    
    items.forEach(item => {
      // Erledigt Items kommen in spezielle "completed" Kategorie
      if (item.isCompleted) {
        if (!groupedItems['completed']) {
          groupedItems['completed'] = [];
        }
        groupedItems['completed'].push(item);
        return;
      }

      // Nur aktive Items werden normal kategorisiert
      let categoryId = item.categoryId;
      
      // If item has invalid categoryId, treat as uncategorized
      if (categoryId && !validCategoryIds.includes(categoryId)) {
        categoryId = undefined;
      }
      
      const key = categoryId || 'uncategorized';
      if (!groupedItems[key]) {
        groupedItems[key] = [];
      }
      groupedItems[key].push(item);
    });

    return groupedItems;
  }, [items, categories]);

  const completedItems = items.filter(item => item.isCompleted);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = items.find(i => i.id === active.id);
    setActiveItem(item || null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Optional: Visual feedback during drag over
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const itemId = active.id as string;
    let targetCategoryId = over.id as string;
    
    // Handle header dropzones (format: "categoryId-header")
    if (targetCategoryId.includes('-header')) {
      targetCategoryId = targetCategoryId.replace('-header', '');
    }
    
    const newCategoryId = targetCategoryId === 'uncategorized' ? null : targetCategoryId;

    try {
      // Update in Firebase
      await ItemService.assignItemToCategory(itemId, newCategoryId);
      
      // Reload data to get the correct state
      await loadListData();
      
    } catch (error) {
      console.error('Fehler beim Verschieben des Items:', error);
      loadListData();
    }
  };

  const handleAddItems = async (names: string[]) => {
    try {
      for (const name of names) {
        await ItemService.createItem(id!, {
          name: name.trim(),
          quantity: 1,
          isCompleted: false,
          priority: 'low',
          order: 0
        });
      }
      loadListData();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Items:', error);
      setError('Fehler beim Hinzufügen der Items');
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      await ItemService.updateItem(itemId, {
        isCompleted: !item.isCompleted
      });
      loadListData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Items:', error);
    }
  };

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      await ItemService.updateItem(itemId, { quantity });
      loadListData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Menge:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Item wirklich löschen?')) return;
    
    try {
      await ItemService.deleteItem(itemId);
      loadListData();
    } catch (error) {
      console.error('Fehler beim Löschen des Items:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Kategorie und alle zugehörigen Items wirklich löschen?')) return;
    
    try {
      await CategoryService.deleteCategory(categoryId);
      loadListData();
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
    }
  };

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="container mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <button 
                    className="btn btn-link p-0" 
                    onClick={handleBack}
                  >
                    Listen
                  </button>
                </li>
                <li className="breadcrumb-item active">{list.name}</li>
              </ol>
            </nav>
            
            <div className="d-flex align-items-center gap-2">
              <i className={`${getListTypeIcon(list.type === 'gift' ? 'gifts' : list.type)} fs-4`}></i>
              <h1 className="h3 mb-0">{list.name}</h1>
              <span className="badge bg-secondary">{getListTypeLabel(list.type === 'gift' ? 'gifts' : list.type)}</span>
            </div>
            
            {list.description && (
              <p className="text-muted mt-2">{list.description}</p>
            )}
          </div>

          <div className="text-end">
            <small className="text-muted">
              {items.length} Items • {completedItems.length} erledigt
            </small>
          </div>
        </div>

        {/* Quick Add Input */}
        <QuickAddInput
          onAddItems={handleAddItems}
          placeholder="Neue Items hinzufügen (Milch, Brot, Butter...)"
        />

        {/* Progress */}
        {items.length > 0 && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Fortschritt</span>
              <small>{completedItems.length} von {items.length}</small>
            </div>
            <div className="progress">
              <div 
                className="progress-bar" 
                style={{ width: `${(completedItems.length / items.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="row">
          <div className="col-12">
            {items.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-basket fs-1 text-muted"></i>
                <h4 className="mt-3 text-muted">Keine Items vorhanden</h4>
                <p className="text-muted">Füge Items über das Eingabefeld hinzu</p>
              </div>
            ) : (
              <>
                {/* Uncategorized Items */}
                {grouped['uncategorized'] && grouped['uncategorized'].length > 0 && (
                  <CategorySection
                    category={null}
                    items={grouped['uncategorized']}
                    onToggleItem={handleToggleItem}
                    onQuantityChange={handleQuantityChange}
                    onDeleteItem={handleDeleteItem}
                  />
                )}

                {/* Category Sections */}
                {categories.map(category => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    items={grouped[category.id] || []}
                    onToggleItem={handleToggleItem}
                    onQuantityChange={handleQuantityChange}
                    onDeleteItem={handleDeleteItem}
                    onDeleteCategory={handleDeleteCategory}
                  />
                ))}

                {/* Erledigt Kategorie - nur anzeigen wenn es erledigte Items gibt */}
                {grouped['completed'] && grouped['completed'].length > 0 && (
                  <CategorySection
                    category={{
                      id: 'completed',
                      name: 'Erledigt',
                      color: '#28a745',
                      listId: id!,
                      userId: user!.uid,
                      createdAt: { seconds: 0, nanoseconds: 0 } as any,
                      updatedAt: { seconds: 0, nanoseconds: 0 } as any,
                      order: 999999 // Am Ende anzeigen
                    }}
                    items={grouped['completed']}
                    onToggleItem={handleToggleItem}
                    onQuantityChange={handleQuantityChange}
                    onDeleteItem={handleDeleteItem}
                    // Keine onDeleteCategory - Erledigt-Kategorie kann nicht gelöscht werden
                  />
                )}

                {/* Add Category Button */}
                <div className="mb-4">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => setShowCreateCategoryModal(true)}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Neue Kategorie
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem ? (
            <DraggableItem
              item={activeItem}
              onToggle={() => {}}
              onQuantityChange={async () => {}}
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>

        {/* Create Category Modal */}
        <CreateCategoryModal
          isOpen={showCreateCategoryModal}
          onClose={() => setShowCreateCategoryModal(false)}
          onCreateCategory={async (name: string, color: string) => {
            try {
              await CategoryService.createListCategory(id!, name, color);
              setShowCreateCategoryModal(false);
              loadListData();
            } catch (error) {
              console.error('Fehler beim Erstellen der Kategorie:', error);
              setError('Fehler beim Erstellen der Kategorie');
            }
          }}
        />
      </div>
    </DndContext>
  );
};

export default ListDetail;