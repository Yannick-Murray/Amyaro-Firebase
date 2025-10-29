import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ListService, CategoryService, ItemService } from '../services/listService';
import type { List, Category, Item } from '../types/todoList';
import { getListTypeIcon } from '../utils/helpers';
import { QuickAddInput } from '../components/business/QuickAddInput';
import { CategorySection } from '../components/business/CategorySection';
import { CreateCategoryModal } from '../components/business/CreateCategoryModal';
import { ShareListModal } from '../components/business/ShareListModal';
import { SharedInfoModal } from '../components/business/SharedInfoModal';
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
import { MobileItem } from '../components/business/MobileItem';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSharedInfoModal, setShowSharedInfoModal] = useState(false); // Für geteilte Listen Info
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false); // Focus Mode State
  const [dragOverState, setDragOverState] = useState<{
    activeItemId: string | null;
    overId: string | null;
  }>({
    activeItemId: null,
    overId: null
  });
  
  // Debounced state für bessere Performance bei schnellen Bewegungen
  const [lastValidOverId, setLastValidOverId] = useState<string | null>(null);

  // Mobile-optimized drag sensors 
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Sehr niedrig für sofortige Aktivierung
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Kurzer Delay um Touch von Scroll zu unterscheiden
        tolerance: 10, // Mehr Toleranz für Touch-Bewegungen
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
  
  // Prüfe ob die Liste mit dem aktuellen User geteilt wurde (User ist nicht der ursprüngliche Ersteller)
  const isSharedWithUser = user && list && list.userId !== user.uid && list.sharedWith?.includes(user.uid);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = items.find(i => i.id === active.id);
    setActiveItem(item || null);
    setDragOverState({
      activeItemId: active.id as string,
      overId: null
    });
    console.log('🎬 Drag Start:', active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    // Update drag over state für visuelles Feedback
    const overId = over?.id as string || null;
    
    setDragOverState({
      activeItemId: active.id as string,
      overId: overId
    });
    
    // Speichere die letzte gültige over-Position für Fallback
    if (overId && items.find(item => item.id === overId)) {
      setLastValidOverId(overId);
    }
    
    if (!over || !active) return;
    
    const activeId = active.id as string;
    
    // Finde active und over items
    const activeItem = items.find(item => item.id === activeId);
    const overItem = items.find(item => item.id === overId);
    
    if (!activeItem) return;
    
    const activeContainer = activeItem.categoryId || 'uncategorized';
    const overContainer = overItem ? (overItem.categoryId || 'uncategorized') : overId;
    
    console.log('🔄 DragOver:', {
      activeId,
      activeItemName: activeItem.name,
      overId,
      overItemName: overItem?.name || 'Container',
      activeContainer,
      overContainer,
      isItemToItem: !!overItem,
      isItemToContainer: !overItem
    });
    // Für jetzt nur logging für debugging
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    
    // Reset drag state
    setDragOverState({
      activeItemId: null,
      overId: null
    });

    let finalOverId = over?.id as string;
    
    // Fallback: Wenn kein over detected, verwende die letzte gültige Position
    if (!over && lastValidOverId) {
      console.log('🔄 Using fallback overId:', lastValidOverId);
      finalOverId = lastValidOverId;
    }
    
    // Reset lastValidOverId
    setLastValidOverId(null);

    if (!finalOverId) {
      console.log('❌ No drop target detected');
      return;
    }

    const activeId = active.id as string;
    const overId = finalOverId;
    
    const activeItem = items.find(item => item.id === activeId);
    const overItem = items.find(item => item.id === overId);
    
    if (!activeItem) {
      console.log('❌ Active item not found:', activeId);
      return;
    }

    const activeContainer = activeItem.categoryId || 'uncategorized';
    const overContainer = overItem ? (overItem.categoryId || 'uncategorized') : overId;

    console.log('🎯 Drag End:', {
      activeId,
      activeItemName: activeItem.name,
      overId,
      overItemName: overItem?.name || 'Container',
      activeContainer,
      overContainer,
      isItemToItem: !!overItem,
      isSameContainer: activeContainer === overContainer
    });

    try {
      // Case 1: Item-to-Item Sorting (innerhalb derselben Kategorie)
      if (overItem && activeContainer === overContainer && activeId !== overId) {
        console.log('🔄 Item-to-Item sorting within same container');
        
        const containerItems = items
          .filter(item => (item.categoryId || 'uncategorized') === activeContainer && !item.isCompleted)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const activeIndex = containerItems.findIndex(item => item.id === activeId);
        const overIndex = containerItems.findIndex(item => item.id === overId);
        
        console.log('📍 Sorting indices:', { activeIndex, overIndex });
        
        if (activeIndex !== -1 && overIndex !== -1) {
          // Reorder logic
          const reorderedItems = [...containerItems];
          const [movedItem] = reorderedItems.splice(activeIndex, 1);
          reorderedItems.splice(overIndex, 0, movedItem);
          
          // Update all affected items with new order
          for (let i = 0; i < reorderedItems.length; i++) {
            const newOrder = i * 1000;
            console.log(`📝 Updating order: ${reorderedItems[i].name} → ${newOrder}`);
            await ItemService.updateItemOrder(reorderedItems[i].id, newOrder);
          }
          
          console.log('✅ Item-to-Item sorting completed');
        }
      }
      // Case 2: Item-to-Container Transfer
      else if (!overItem || activeContainer !== overContainer) {
        console.log('� Item-to-Container transfer');
        
        const targetCategoryId = overContainer === 'uncategorized' ? null : overContainer;
        
        // Update category assignment
        await ItemService.assignItemToCategory(activeId, targetCategoryId);
        
        // Set order to end of target category
        const targetItems = items.filter(item => 
          (item.categoryId || 'uncategorized') === overContainer && !item.isCompleted
        );
        const maxOrder = Math.max(0, ...targetItems.map(item => item.order || 0));
        const newOrder = maxOrder + 1000;
        
        console.log(`📝 Setting new order: ${newOrder}`);
        await ItemService.updateItemOrder(activeId, newOrder);
        
        console.log('✅ Item-to-Container transfer completed');
      }
      else {
        console.log('⚠️ No action needed - same item/position');
      }
      
      console.log('🔄 Reloading data...');
      await loadListData();
      
    } catch (error) {
      console.error('❌ Error during drag operation:', error);
      await loadListData();
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

  const handleToggleItem = async (itemId: string, completed?: boolean) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      // Verwende den completed Parameter falls vorhanden, sonst toggle
      const newCompletedState = completed !== undefined ? completed : !item.isCompleted;

      await ItemService.updateItem(itemId, {
        isCompleted: newCompletedState
      });
      
      await loadListData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Items:', error);
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

  const handleDeleteList = async () => {
    if (!list) return;
    
    const confirmed = window.confirm(
      `Liste "${list.name}" wirklich löschen?\n\n` +
      `Dies löscht auch alle ${items.length} Items und ${categories.length} Kategorien unwiderruflich!`
    );
    
    if (!confirmed) return;
    
    try {
      await ListService.deleteList(list.id);
      
      // Zurück zum Dashboard navigieren
      navigate('/', { 
        replace: true,
        state: { message: `Liste "${list.name}" wurde gelöscht` }
      });
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Liste:', error);
      alert('Fehler beim Löschen der Liste. Bitte versuchen Sie es erneut.');
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
        {/* Focus Mode Header - Kompakt */}
        {isFocusMode ? (
          <div className="mb-3">
            <div 
              className="d-flex align-items-center justify-content-between py-2 px-3 bg-primary text-white rounded cursor-pointer"
              onClick={() => setIsFocusMode(false)}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center gap-2">
                <i className={`${getListTypeIcon(list.type === 'gift' ? 'gifts' : list.type)}`}></i>
                <span className="fw-medium">{list.name}</span>
              </div>
              
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-1">
                  <small className="opacity-75">{completedItems.length}/{items.length}</small>
                  <div 
                    className="bg-white bg-opacity-25 rounded"
                    style={{ width: '60px', height: '4px' }}
                  >
                    <div 
                      className="bg-white rounded h-100"
                      style={{ 
                        width: `${items.length > 0 ? (completedItems.length / items.length) * 100 : 0}%`,
                        transition: 'width 0.3s ease'
                      }}
                    ></div>
                  </div>
                </div>
                <i className="bi bi-chevron-up"></i>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Header */
          <>
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
                  
                  {/* Share Button - Conditional Behavior */}
                  <button
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => {
                      if (isSharedWithUser) {
                        setShowSharedInfoModal(true);
                      } else {
                        setShowShareModal(true);
                      }
                    }}
                    title={isSharedWithUser ? "Geteilte Liste Info" : "Liste teilen"}
                  >
                    <i className={isSharedWithUser ? "bi bi-info-circle" : "bi bi-share"}></i>
                    <span className="d-none d-sm-inline">{isSharedWithUser ? "Info" : "Teilen"}</span>
                  </button>
                  
                  {/* List Actions Dropdown */}
                  <div className="dropdown position-relative">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => setShowListDropdown(!showListDropdown)}
                      title="Liste bearbeiten"
                    >
                      <i className="bi bi-three-dots"></i>
                    </button>
                
                {showListDropdown && (
                  <>
                    {/* Backdrop zum Schließen */}
                    <div 
                      className="position-fixed top-0 start-0 w-100 h-100"
                      style={{ zIndex: 1000 }}
                      onClick={() => setShowListDropdown(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <ul 
                      className="dropdown-menu show position-absolute end-0"
                      style={{ zIndex: 1001 }}
                    >
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            setShowListDropdown(false);
                            /* TODO: Edit List Modal */
                          }}
                        >
                          <i className="bi bi-pencil me-2"></i>
                          Liste bearbeiten
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => {
                            setShowListDropdown(false);
                            handleDeleteList();
                          }}
                        >
                          <i className="bi bi-trash me-2"></i>
                          Liste löschen
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
            
            {list.description && (
              <p className="text-muted mt-2">{list.description}</p>
            )}

            {/* Focus Mode Button - Replaces SharedListBanner */}
            <div className="mb-3">
              <button
                className="btn btn-outline-secondary w-100 d-flex align-items-center gap-2"
                onClick={() => setIsFocusMode(true)}
              >
                <i className="bi bi-arrow-up-circle text-primary"></i>
                <span className="fw-medium">Listenansicht</span>
              </button>
            </div>

            {/* Quick Add Input - nur in Normal Mode */}
            <QuickAddInput
              onAddItems={handleAddItems}
              placeholder="Neue Items"
            />

            {/* Progress - nur in Normal Mode */}
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
          </>
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
                    onDeleteItem={handleDeleteItem}
                    onReorderItems={() => {}} // TODO: Implementierung für Reorder
                  />
                )}

                {/* Category Sections */}
                {categories.map(category => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    items={grouped[category.id] || []}
                    onToggleItem={handleToggleItem}
                    onDeleteItem={handleDeleteItem}
                    onDeleteCategory={handleDeleteCategory}
                    onReorderItems={() => {}} // TODO: Implementierung für Reorder
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
                    onDeleteItem={handleDeleteItem}
                    onReorderItems={() => {}} // Completed items nicht reorderbar
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
            <MobileItem
              item={activeItem}
              onToggle={() => {}}
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

        {/* Share List Modal */}
        <ShareListModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          listId={id!}
          listName={list.name}
        />

        {/* Shared Info Modal */}
        <SharedInfoModal
          isOpen={showSharedInfoModal}
          onClose={() => setShowSharedInfoModal(false)}
          listName={list.name}
          originalCreatorId={list.userId}
        />
      </div>
    </DndContext>
  );
};

export default ListDetail;