import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useListsContext } from '../context/ListsContext';
import { ListService, CategoryService, ItemService } from '../services/listService';
import type { List, Category, Item } from '../types/todoList';
import { getListTypeIcon } from '../utils/helpers';
import { QuickAddInput } from '../components/business/QuickAddInput';
import { CategorySection } from '../components/business/CategorySection';
import { CreateCategoryModal } from '../components/business/CreateCategoryModal';
import AddItemModal from '../components/business/AddItemModal';
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
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSharedInfoModal, setShowSharedInfoModal] = useState(false); // Für geteilte Listen Info
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [showListDropdown, setShowListDropdown] = useState(false);
  // Focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false); // Focus Mode State
  
  // User names cache for assigned users
  const [userNames, setUserNames] = useState<{[userId: string]: string}>({});

  // Function to fetch user name from Firebase
  const fetchUserName = async (userId: string): Promise<string> => {
    if (userNames[userId]) {
      return userNames[userId];
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const name = userData.displayName || userData.email || 'Unbekannter Nutzer';
        setUserNames(prev => ({ ...prev, [userId]: name }));
        return name;
      }
    } catch (error) {
      console.error('Fehler beim Laden des Benutzernamens:', error);
    }
    
    return userId; // Fallback zur ID
  };
  
  // Duplicate item handling
  const [duplicateItems, setDuplicateItems] = useState<{name: string, existingItem: Item}[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingNewItems, setPendingNewItems] = useState<string[]>([]);
  
  // Move to Category Modal State
  const [showMoveToCategoryModal, setShowMoveToCategoryModal] = useState(false);
  const [itemToMove, setItemToMove] = useState<Item | null>(null);
  
  // Debounced state für bessere Performance bei schnellen Bewegungen
  const [lastValidOverId, setLastValidOverId] = useState<string | null>(null);

  // Drag sensors - optimized for gift items
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Niedrigere Distance für responsiveres DnD
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Längere Delay
        tolerance: 5, // Niedrigere Tolerance
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

  // Group items by category for shopping lists OR by assigned person for gift lists
  const grouped = useMemo(() => {
    const groupedItems: { [categoryId: string]: Item[] } = {};
    
    if (list?.type === 'gift') {
      // For gift lists: group by assignedTo (person), but keep completed separate
      items.forEach(item => {
        if (item.isCompleted) {
          if (!groupedItems['completed']) {
            groupedItems['completed'] = [];
          }
          groupedItems['completed'].push(item);
          return;
        }

        // Group active items by assigned person
        const assigneeId = item.assignedTo || 'unassigned';
        if (!groupedItems[assigneeId]) {
          groupedItems[assigneeId] = [];
        }
        groupedItems[assigneeId].push(item);
      });
    } else {
      // For shopping lists: group by category (existing logic)
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
    }

    return groupedItems;
  }, [items, categories, list?.type]);

  const completedItems = items.filter(item => item.isCompleted);
  
  // Prüfe ob die Liste mit dem aktuellen User geteilt wurde (User ist nicht der ursprüngliche Ersteller)
  const isSharedWithUser = user && list && list.userId !== user.uid && list.sharedWith?.includes(user.uid);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = items.find(i => i.id === active.id);
    setActiveItem(item || null);
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
    
    // Update drag state for visual feedback
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveItem(null);

    let finalOverId = over?.id as string;
    
    // Fallback: Wenn kein over detected, verwende die letzte gültige Position
    if (!over && lastValidOverId) {
      finalOverId = lastValidOverId;
    }
    
    // Reset lastValidOverId
    setLastValidOverId(null);

    if (!finalOverId) {
      return;
    }

    const activeId = active.id as string;
    const overId = finalOverId;
    
    // Item drag handling
    const activeItem = items.find(item => item.id === activeId);
    const overItem = items.find(item => item.id === overId);
    
    if (!activeItem) {
      return;
    }

    const activeContainer = activeItem.categoryId || 'uncategorized';
    const overContainer = overItem ? (overItem.categoryId || 'uncategorized') : overId;



    try {
      // Case 1: Item-to-Item Sorting (innerhalb derselben Kategorie)
      if (overItem && activeContainer === overContainer && activeId !== overId) {

        
        const containerItems = items
          .filter(item => (item.categoryId || 'uncategorized') === activeContainer && !item.isCompleted)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const activeIndex = containerItems.findIndex(item => item.id === activeId);
        const overIndex = containerItems.findIndex(item => item.id === overId);
        

        
        if (activeIndex !== -1 && overIndex !== -1) {
          // Reorder logic
          const reorderedItems = [...containerItems];
          const [movedItem] = reorderedItems.splice(activeIndex, 1);
          reorderedItems.splice(overIndex, 0, movedItem);
          
          // Update all affected items with new order
          for (let i = 0; i < reorderedItems.length; i++) {
            const newOrder = i * 1000;

            await ItemService.updateItemOrder(reorderedItems[i].id, newOrder);
          }
          

        }
      }
      // Case 2: Item-to-Container Transfer
      else if (!overItem || activeContainer !== overContainer) {

        
        const targetCategoryId = overContainer === 'uncategorized' ? null : overContainer;
        
        // Update category assignment
        await ItemService.assignItemToCategory(activeId, targetCategoryId);
        
        // Set order to end of target category
        const targetItems = items.filter(item => 
          (item.categoryId || 'uncategorized') === overContainer && !item.isCompleted
        );
        const maxOrder = Math.max(0, ...targetItems.map(item => item.order || 0));
        const newOrder = maxOrder + 1000;
        

        await ItemService.updateItemOrder(activeId, newOrder);
        

      }
      else {

      }
      

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
  const createNewItems = async (names: string[], categoryId: string | null = null) => {
    try {
      for (const name of names) {
        if (name.trim()) {
          const itemData: any = {
            name: name.trim(),
            quantity: 1,
            isCompleted: false,
            priority: 'low',
            order: 0
          };
          
          // Nur categoryId hinzufügen wenn es nicht null/undefined ist
          if (categoryId) {
            itemData.categoryId = categoryId;
          }
          
          await ItemService.createItem(id!, itemData);
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

  // Handle adding items to specific category (for CategorySection quick add)
  const handleAddItemsToCategory = async (categoryId: string | null, itemNames: string[]) => {
    try {
      const { duplicates, nonDuplicates } = findDuplicateItems(itemNames);
      
      // If there are duplicates, show confirmation modal
      if (duplicates.length > 0) {
        setDuplicateItems(duplicates);
        setPendingNewItems(nonDuplicates);
        setShowDuplicateModal(true);
        // TODO: Store the target category for after duplicate resolution
        return;
      }
      
      // No duplicates, create all items directly in the specified category
      await createNewItems(nonDuplicates, categoryId);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Items zur Kategorie:', error);
      setError('Fehler beim Hinzufügen der Items');
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

  // Helper function to get assigned user name
  const getAssignedUserName = (item: Item): string => {
    if (!item.assignedTo) return '';
    
    // Check if it's the current user
    if (user && item.assignedTo === user.uid) {
      return user.displayName || user.email || 'Ich selbst';
    }
    
    // Check if we have the name cached from Firebase
    if (userNames[item.assignedTo]) {
      return userNames[item.assignedTo];
    }
    
    // Fetch the name asynchronously if not cached
    fetchUserName(item.assignedTo);
    
    // Look up the name in shared users (fallback while loading)
    const availablePersons = getAvailablePersons();
    const assignedPerson = availablePersons.find(person => person.id === item.assignedTo);
    
    return assignedPerson ? assignedPerson.name : 'Lädt...';
  };

  // Get all available persons for gift list organization
  const getAvailablePersons = (): Array<{id: string, name: string}> => {
    const persons: Array<{id: string, name: string}> = [];
    
    // Add list creator
    if (list && user) {
      if (list.userId === user.uid) {
        // Current user is creator
        persons.push({
          id: user.uid,
          name: user.displayName || user.email || 'Ich'
        });
      } else {
        // Current user is shared, add creator as first person
        const creatorName = userNames[list.userId] || 'Listenersteller';
        // Fetch creator name if not cached
        if (!userNames[list.userId]) {
          fetchUserName(list.userId);
        }
        persons.push({
          id: list.userId,
          name: creatorName
        });
        // Add current user
        persons.push({
          id: user.uid,
          name: user.displayName || user.email || 'Ich'
        });
      }
    }

    // Add shared users (we need to implement user name lookup later)
    if (list?.sharedWith) {
      list.sharedWith.forEach(userId => {
        if (!persons.find(p => p.id === userId)) {
          persons.push({
            id: userId,
            name: `Benutzer ${userId.substring(0, 8)}...` // Temporary until we have proper names
          });
        }
      });
    }

    return persons;
  };

  // Helper function to get purchaser name (who bought the item)
  const getPurchaserName = (item: Item): string => {
    if (!item.completedBy) return '';
    
    // Check if it's the current user
    if (user && item.completedBy === user.uid) {
      return user.displayName || user.email || 'Ich selbst';
    }
    
    // For now, just return the ID (should be replaced with proper user name lookup)
    return item.completedBy;
  };

  const handleToggleItem = async (itemId: string, completed?: boolean) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      // Verwende den completed Parameter falls vorhanden, sonst toggle
      const newCompletedState = completed !== undefined ? completed : !item.isCompleted;

      // 🚀 OPTIMISTIC UPDATE - update UI immediately
      setItems(prevItems => 
        prevItems.map(item => {
          if (item.id === itemId) {
            const updatedItem = { ...item, isCompleted: newCompletedState };
            
            // For gift lists: track who bought the item
            if (list?.type === 'gift' && newCompletedState && user) {
              updatedItem.completedBy = user.uid;
            } else if (!newCompletedState) {
              updatedItem.completedBy = undefined;
            }
            
            return updatedItem;
          }
          return item;
        })
      );

      // Then update backend
      const updateData: any = {
        isCompleted: newCompletedState
      };

      // For gift lists: track who bought the item
      if (list?.type === 'gift' && newCompletedState && user) {
        updateData.completedBy = user.uid;
        updateData.completedAt = new Date();
      } else if (!newCompletedState) {
        // When unchecking, remove purchaser info
        updateData.completedBy = null;
        updateData.completedAt = null;
      }

      await ItemService.updateItem(itemId, updateData);
      
      // Refresh lists context to update dashboard card counts (no scroll reset)
      refreshLists();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Items:', error);
      // On error, revert optimistic update by reloading
      await loadListData();
    }
  };

  const handleAssignmentChange = async (itemId: string, assignedUserId: string | undefined) => {
    try {
      // 🚀 OPTIMISTIC UPDATE - update UI immediately
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { ...item, assignedTo: assignedUserId }
            : item
        )
      );

      // Update backend
      await ItemService.updateItem(itemId, { assignedTo: assignedUserId });
      
    } catch (error) {
      console.error('Fehler beim Ändern der Zuweisung:', error);
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

            {/* Focus Mode Button - Nur für Shopping-Listen */}
            {list.type === 'shopping' && (
              <div className="mb-3">
                <button
                  className="btn btn-outline-secondary w-100 d-flex align-items-center gap-2"
                  onClick={() => setIsFocusMode(true)}
                >
                  <i className="bi bi-arrow-up-circle text-primary"></i>
                  <span className="fw-medium">Listenansicht</span>
                </button>
              </div>
            )}
            
            {/* TODO: Gift-Listen haben keine Listview - hier könnte ein Gift-spezifischer Button hin */}
            {list.type === 'gift' && (
              <div className="mb-3" style={{ opacity: 0.6 }}>
                {/* Placeholder für Gift-Listen spezifische Funktionen */}
              </div>
            )}

            {/* Input basierend auf Listen-Typ */}
            {list.type === 'shopping' ? (
              <QuickAddInput
                onAddItems={handleAddItems}
                placeholder="Neue Items"
              />
            ) : (
              /* Gift-Listen: Geschenk hinzufügen Button */
              <div className="mb-3">
                <button
                  className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowAddItemModal(true)}
                >
                  <i className="bi bi-gift"></i>
                  <span className="fw-medium">Geschenk hinzufügen</span>
                </button>
              </div>
            )}

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
            ) : list?.type === 'gift' ? (
              <>
                {/* Gift Lists: Person-based organization */}
                
                {/* Unassigned Items Section */}
                {grouped['unassigned'] && grouped['unassigned'].length > 0 && (
                  <CategorySection
                    category={null}
                    categoryName="Noch nicht zugewiesen"
                    items={grouped['unassigned']}
                    onToggleItem={handleToggleItem}
                    onDeleteItem={handleDeleteItem}
                    onQuantityChange={handleQuantityChange}
                    onMoveItem={handleMoveToCategory}
                    onAddItemsToCategory={handleAddItemsToCategory}
                    onReorderItems={() => {}} // No reordering for gift lists
                    isListView={isFocusMode}
                    listType={list?.type}
                    sharedUsers={getAvailablePersons()}
                    getAssignedUserName={getAssignedUserName}
                    getPurchaserName={getPurchaserName}
                    onAssignmentChange={handleAssignmentChange}
                  />
                )}

                {/* Person Sections - Dynamic based on assigned users */}
                {getAvailablePersons()
                  .filter(person => {
                    const personItems = grouped[person.id] || [];
                    // In Focus Mode: nur Personen mit pending Items anzeigen
                    if (isFocusMode) {
                      return personItems.some(item => !item.isCompleted);
                    }
                    // In Normal Mode: nur Personen anzeigen die auch Items haben
                    return personItems.length > 0;
                  })
                  .map(person => (
                    <CategorySection
                      key={person.id}
                      category={null}
                      categoryName={person.name}
                      items={grouped[person.id] || []}
                      onToggleItem={handleToggleItem}
                      onDeleteItem={handleDeleteItem}
                      onQuantityChange={handleQuantityChange}
                      onMoveItem={handleMoveToCategory}
                      onAddItemsToCategory={handleAddItemsToCategory}
                      onReorderItems={() => {}} // No reordering for gift lists
                      isListView={isFocusMode}
                      listType={list?.type}
                      sharedUsers={getAvailablePersons()}
                      getAssignedUserName={getAssignedUserName}
                      getPurchaserName={getPurchaserName}
                      onAssignmentChange={handleAssignmentChange}
                    />
                  ))}
              </>
            ) : (
              <>
                {/* Shopping Lists: Traditional category-based organization */}
                
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
                    onAddItemsToCategory={handleAddItemsToCategory}
                    onReorderItems={() => {}} // TODO: Implementierung für Reorder
                    isListView={isFocusMode}
                    listType={list?.type}
                    sharedUsers={getAvailablePersons()}
                    getAssignedUserName={getAssignedUserName}
                    getPurchaserName={getPurchaserName}
                    onAssignmentChange={handleAssignmentChange}
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
                      onAddItemsToCategory={handleAddItemsToCategory}
                      onReorderItems={() => {}} // TODO: Implementierung für Reorder
                      isListView={isFocusMode}
                      listType={list?.type}
                      sharedUsers={getAvailablePersons()}
                      getAssignedUserName={getAssignedUserName}
                      getPurchaserName={getPurchaserName}
                      onAssignmentChange={handleAssignmentChange}
                    />
                  ))}
              </>
            )}

            {/* Erledigt/Gekauft Kategorie - nur anzeigen wenn es erledigte Items gibt */}
                {grouped['completed'] && grouped['completed'].length > 0 && (
                  <CategorySection
                    category={{
                      id: 'completed',
                      name: list.type === 'gift' ? 'Gekauft' : 'Erledigt',
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
                    isListView={isFocusMode}
                    listType={list?.type}
                    sharedUsers={getAvailablePersons()}
                    getAssignedUserName={getAssignedUserName}
                    getPurchaserName={getPurchaserName}
                    onAssignmentChange={handleAssignmentChange}
                    // Keine onDeleteCategory - Erledigt-Kategorie kann nicht gelöscht werden
                  />
                )}

                {/* Add Category Button - nur für Shopping-Listen im normalen Modus */}
                {!isFocusMode && list?.type !== 'gift' && (
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

        {/* Add Item Modal */}
        <AddItemModal
          listId={id!}
          isOpen={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
          onItemAdded={() => {
            setShowAddItemModal(false);
            loadListData();
          }}
          listType={list?.type || 'shopping'}
          sharedUsers={getAvailablePersons()}
          categories={categories}
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