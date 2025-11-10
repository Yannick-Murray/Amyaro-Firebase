import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useListsContext } from '../context/ListsContext';
import { ListService, CategoryService, ItemService } from '../services/listService';
import type { List, Category, Item } from '../types/todoList';
import { getListTypeIcon } from '../utils/helpers';
import { QuickAddInput } from '../components/business/QuickAddInput';
import { CategorySection } from '../components/business/CategorySection';
import { CreateCategoryModal } from '../components/business/CreateCategoryModal';
import { ShareListModal } from '../components/business/ShareListModal';
import { SharedInfoModal } from '../components/business/SharedInfoModal';
import { DuplicateItemModal } from '../components/business/DuplicateItemModal';
import { MoveToCategoryModal } from '../components/business/MoveToCategoryModal';
import { EditListModal } from '../components/business/EditListModal';
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
  const { refreshLists } = useListsContext();
  const navigate = useNavigate();
  
  const [list, setList] = useState<List | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSharedInfoModal, setShowSharedInfoModal] = useState(false); // Für geteilte Listen Info
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false); // Focus Mode State
  
  // Duplicate item handling
  const [duplicateItems, setDuplicateItems] = useState<{name: string, existingItem: Item}[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingNewItems, setPendingNewItems] = useState<string[]>([]);
  
  // Move to Category Modal State
  const [showMoveToCategoryModal, setShowMoveToCategoryModal] = useState(false);
  const [itemToMove, setItemToMove] = useState<Item | null>(null);
  
  // Debounced state für bessere Performance bei schnellen Bewegungen
  const [lastValidOverId, setLastValidOverId] = useState<string | null>(null);

  // Drag sensors - reverted to working configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Zurück zur ursprünglichen Konfiguration
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Zurück zur ursprünglichen Konfiguration
        tolerance: 10, // Zurück zur ursprünglichen Konfiguration
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
    console.log('🎬 Drag Start:', active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    // Update drag over state für visuelles Feedback
    const overId = over?.id as string || null;
    
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
    console.log('🏁 DRAG END CALLED:', { 
      activeId: active.id, 
      overId: over?.id,
      hasOver: !!over 
    });
    
    setActiveItem(null);
    
    // Reset drag state
    setActiveItem(null);

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
    
    // Item drag handling
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

  // Helper function to find duplicate items by name (case-insensitive)
  const findDuplicateItems = (newNames: string[]) => {
    const duplicates: {name: string, existingItem: Item}[] = [];
    const nonDuplicates: string[] = [];
    
    newNames.forEach(name => {
      const trimmedName = name.trim();
      const existingItem = items.find(item => 
        item.name.toLowerCase() === trimmedName.toLowerCase() && !item.isCompleted
      );
      
      if (existingItem) {
        duplicates.push({ name: trimmedName, existingItem });
      } else {
        nonDuplicates.push(trimmedName);
      }
    });
    
    return { duplicates, nonDuplicates };
  };

  const handleAddItems = async (names: string[]) => {
    try {
      const { duplicates, nonDuplicates } = findDuplicateItems(names);
      
      // If there are duplicates, show confirmation modal
      if (duplicates.length > 0) {
        setDuplicateItems(duplicates);
        setPendingNewItems(nonDuplicates);
        setShowDuplicateModal(true);
        return;
      }
      
      // No duplicates, create all items directly
      await createNewItems(nonDuplicates);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Items:', error);
      setError('Fehler beim Hinzufügen der Items');
    }
  };

  // Helper to create new items
  const createNewItems = async (names: string[]) => {
    try {
      for (const name of names) {
        if (name.trim()) {
          await ItemService.createItem(id!, {
            name: name.trim(),
            quantity: 1,
            isCompleted: false,
            priority: 'low',
            order: 0
          });
        }
      }
      await loadListData();
      // Refresh lists context to update dashboard card counts
      refreshLists();
    } catch (error) {
      console.error('Fehler beim Erstellen der Items:', error);
      setError('Fehler beim Erstellen der Items');
    }
  };

  // Handle duplicate modal actions
  const handleIncreaseQuantity = async (duplicates: {name: string, existingItem: Item}[]) => {
    try {
      // Increase quantity of existing items
      for (const duplicate of duplicates) {
        const newQuantity = Math.min(9, (duplicate.existingItem.quantity || 1) + 1);
        await ItemService.updateQuantity(duplicate.existingItem.id, newQuantity);
      }
      
      // Create remaining non-duplicate items
      await createNewItems(pendingNewItems);
      
      // Reset state
      setDuplicateItems([]);
      setPendingNewItems([]);
      // Refresh lists context to update dashboard card counts
      refreshLists();
    } catch (error) {
      console.error('Fehler beim Erhöhen der Menge:', error);
      setError('Fehler beim Erhöhen der Menge');
    }
  };

  const handleCreateAnyway = async (duplicates: {name: string, existingItem: Item}[]) => {
    try {
      // Create all items including duplicates
      const allNames = [...duplicates.map(d => d.name), ...pendingNewItems];
      await createNewItems(allNames);
      
      // Reset state
      setDuplicateItems([]);
      setPendingNewItems([]);
    } catch (error) {
      console.error('Fehler beim Erstellen der Items:', error);
      setError('Fehler beim Erstellen der Items');
    }
  };

  const handleToggleItem = async (itemId: string, completed?: boolean) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      // Verwende den completed Parameter falls vorhanden, sonst toggle
      const newCompletedState = completed !== undefined ? completed : !item.isCompleted;

      // 🚀 OPTIMISTIC UPDATE - update UI immediately
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, isCompleted: newCompletedState } : item
        )
      );

      // Then update backend
      await ItemService.updateItem(itemId, {
        isCompleted: newCompletedState
      });
      
      // Refresh lists context to update dashboard card counts (no scroll reset)
      refreshLists();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Items:', error);
      // On error, revert optimistic update by reloading
      await loadListData();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      // 🚀 OPTIMISTIC UPDATE - remove from UI immediately
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));

      // Then delete from backend
      await ItemService.deleteItem(itemId);
      
      // Refresh lists context to update dashboard card counts (no scroll reset)
      refreshLists();
    } catch (error) {
      console.error('Fehler beim Löschen des Items:', error);
      // On error, revert optimistic update by reloading
      await loadListData();
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await CategoryService.deleteCategory(categoryId);
      loadListData();
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
    }
  };

  const handleMoveCategoryUp = async (categoryId: string) => {
    try {
      const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
      const currentIndex = sortedCategories.findIndex(cat => cat.id === categoryId);
      
      if (currentIndex > 0) {
        // Swap with previous category
        const newOrder = [...sortedCategories];
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
        
        const categoryIds = newOrder.map(cat => cat.id);
        await CategoryService.reorderCategories(categoryIds);
        loadListData();
      }
    } catch (error) {
      console.error('Fehler beim Verschieben der Kategorie:', error);
    }
  };

  const handleMoveCategoryDown = async (categoryId: string) => {
    try {
      const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
      const currentIndex = sortedCategories.findIndex(cat => cat.id === categoryId);
      
      if (currentIndex < sortedCategories.length - 1) {
        // Swap with next category
        const newOrder = [...sortedCategories];
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
        
        const categoryIds = newOrder.map(cat => cat.id);
        await CategoryService.reorderCategories(categoryIds);
        loadListData();
      }
    } catch (error) {
      console.error('Fehler beim Verschieben der Kategorie:', error);
    }
  };

  const handleEditCategory = async (categoryId: string, newName: string) => {
    try {
      // 🚀 OPTIMISTIC UPDATE - update UI immediately
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === categoryId ? { ...cat, name: newName } : cat
        )
      );

      await CategoryService.updateCategory(categoryId, { name: newName });
    } catch (error) {
      console.error('Fehler beim Bearbeiten der Kategorie:', error);
      // Revert optimistic update on error
      await loadListData();
      throw error; // Re-throw so the component can handle it
    }
  };

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      // 🚀 OPTIMISTIC UPDATE - update UI immediately
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      );

      // Then update backend
      await ItemService.updateItem(itemId, { quantity });
      
      // Refresh lists context to update dashboard card counts (no scroll reset)
      refreshLists();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Menge:', error);
      // On error, revert optimistic update by reloading
      await loadListData();
    }
  };

  const handleMoveToCategory = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setItemToMove(item);
      setShowMoveToCategoryModal(true);
    }
  };

  const handleMoveToCategoryConfirm = async (categoryId: string | null) => {
    if (!itemToMove) return;

    try {
      // 🚀 OPTIMISTIC UPDATE - update UI immediately
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemToMove.id ? { ...item, categoryId: categoryId || undefined } : item
        )
      );

      // Then update backend
      await ItemService.assignItemToCategory(itemToMove.id, categoryId);
      
      // Refresh lists context to update dashboard card counts (no scroll reset)
      refreshLists();
    } catch (error) {
      console.error('Fehler beim Verschieben des Items:', error);
      // On error, revert optimistic update by reloading
      await loadListData();
    }
  };

  const handleDeleteList = async () => {
    if (!list) return;
    
    // Prüfe ob der aktuelle Benutzer berechtigt ist, die Liste zu löschen
    if (isSharedWithUser) {
      console.log('🚫 Geteilter Benutzer versucht Liste zu löschen - zeige Meldung');
      window.alert('Diese Liste kann nur vom Ersteller der Liste gelöscht werden.');
      return;
    }
    
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

  const handleListUpdated = (updatedName: string) => {
    if (list) {
      setList({ ...list, name: updatedName });
      // Auch den Context aktualisieren
      refreshLists();
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
                <i className={`${getListTypeIcon(list.type)}`}></i>
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
                  <i className={`${getListTypeIcon(list.type)} fs-4`}></i>
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
                            setShowEditListModal(true);
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
                {grouped['uncategorized'] && grouped['uncategorized'].length > 0 && 
                  // In Focus Mode: nur anzeigen wenn es pending Items gibt
                  (!isFocusMode || grouped['uncategorized'].some(item => !item.isCompleted)) && (
                  <CategorySection
                    category={null}
                    items={grouped['uncategorized']}
                    onToggleItem={handleToggleItem}
                    onDeleteItem={handleDeleteItem}
                    onQuantityChange={handleQuantityChange}
                    onMoveItem={handleMoveToCategory}
                    onReorderItems={() => {}} // TODO: Implementierung für Reorder
                  />
                )}

                {/* Category Sections */}
                {categories
                  .filter(category => {
                    const categoryItems = grouped[category.id] || [];
                    // In Focus Mode: nur Kategorien mit pending (nicht erledigten) Items anzeigen
                    if (isFocusMode) {
                      return categoryItems.some(item => !item.isCompleted);
                    }
                    // In Normal Mode: alle Kategorien anzeigen (wie bisher)
                    return true;
                  })
                  .map(category => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      items={grouped[category.id] || []}
                      onToggleItem={handleToggleItem}
                      onDeleteItem={handleDeleteItem}
                      onQuantityChange={handleQuantityChange}
                      onMoveItem={handleMoveToCategory}
                      onEditCategory={handleEditCategory}
                      onDeleteCategory={handleDeleteCategory}
                      onMoveCategoryUp={handleMoveCategoryUp}
                      onMoveCategoryDown={handleMoveCategoryDown}
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
                    onQuantityChange={handleQuantityChange}
                    onMoveItem={handleMoveToCategory}
                    onReorderItems={() => {}} // Completed items nicht reorderbar
                    // Keine onDeleteCategory - Erledigt-Kategorie kann nicht gelöscht werden
                  />
                )}

                {/* Add Category Button - nur im normalen Modus, nicht im Focus Mode */}
                {!isFocusMode && (
                  <div className="mb-4">
                    <button
                      className="btn btn-outline-primary w-100"
                      onClick={() => setShowCreateCategoryModal(true)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Neue Kategorie
                    </button>
                  </div>
                )}
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
          list={list}
        />

        {/* Shared Info Modal */}
        <SharedInfoModal
          isOpen={showSharedInfoModal}
          onClose={() => setShowSharedInfoModal(false)}
          listName={list.name}
          originalCreatorId={list.userId}
        />

        {/* Duplicate Item Modal */}
        <DuplicateItemModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          duplicates={duplicateItems}
          onConfirmIncreaseQuantity={handleIncreaseQuantity}
          onConfirmCreateAnyway={handleCreateAnyway}
        />

        {/* Move to Category Modal */}
        <MoveToCategoryModal
          isOpen={showMoveToCategoryModal}
          onClose={() => setShowMoveToCategoryModal(false)}
          categories={categories}
          currentCategoryId={itemToMove?.categoryId || null}
          itemName={itemToMove?.name || ''}
          onMoveToCategory={handleMoveToCategoryConfirm}
        />

        {/* Edit List Modal */}
        {list && (
          <EditListModal
            isOpen={showEditListModal}
            onClose={() => setShowEditListModal(false)}
            list={list}
            onListUpdated={handleListUpdated}
          />
        )}
      </div>
    </DndContext>
  );
};

export default ListDetail;