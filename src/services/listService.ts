import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { List, Category, ListType, Item } from '../types/todoList';

// List Service (umbenannt von TodoListService)
export class ListService {
  private static readonly COLLECTION = 'lists';

  // Liste erstellen
  static async createList(
    userId: string,
    name: string,
    type: ListType,
    description?: string,
    categoryId?: string,
    isPrivate: boolean = false
  ): Promise<string> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      if (auth.currentUser.uid !== userId) {
        throw new Error('User ID stimmt nicht überein');
      }

      // Auth Token refresh versuchen
      try {
        await auth.currentUser.getIdToken(true); // Force refresh
      } catch (tokenError) {
        console.error('Token refresh fehler:', tokenError);
      }

      const now = Timestamp.now();
      const listData: any = {
        name,
        type,
        userId,
        isPrivate,
        createdAt: now,
        updatedAt: now
      };

      // Nur definierte optionale Felder hinzufügen
      if (description) {
        listData.description = description;
      }
      if (categoryId) {
        listData.categoryId = categoryId;
      }
      // sharedWith nur hinzufügen wenn nicht private
      if (!isPrivate) {
        listData.sharedWith = [];
      }
      const docRef = await addDoc(collection(db, this.COLLECTION), listData);
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Liste:', error);
      throw error;
    }
  }

  // Listen des Users abrufen (eigene + geteilte Listen)
  static async getUserLists(userId: string): Promise<List[]> {
    try {
      // 1. Eigene Listen laden
      const ownListsQuery = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId)
      );
      
      // 2. Geteilte Listen laden (wo User in sharedWith Array ist)
      const sharedListsQuery = query(
        collection(db, this.COLLECTION),
        where('sharedWith', 'array-contains', userId)
      );
      
      // Beide Queries parallel ausführen
      const [ownListsSnapshot, sharedListsSnapshot] = await Promise.all([
        getDocs(ownListsQuery),
        getDocs(sharedListsQuery)
      ]);
      
      // Listen zusammenführen und Duplikate entfernen
      const allListsMap = new Map<string, List>();
      
      // Eigene Listen hinzufügen
      ownListsSnapshot.docs.forEach(doc => {
        allListsMap.set(doc.id, {
          id: doc.id,
          ...doc.data()
        } as List);
      });
      
      // Geteilte Listen hinzufügen (überschreibt Duplikate nicht)
      sharedListsSnapshot.docs.forEach(doc => {
        if (!allListsMap.has(doc.id)) {
          allListsMap.set(doc.id, {
            id: doc.id,
            ...doc.data()
          } as List);
        }
      });
      
      // Zu Array konvertieren und sortieren
      const lists = Array.from(allListsMap.values());
      
      // Manuell sortieren bis Index fertig ist
      return lists.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
    } catch (error) {
      console.error('Fehler beim Laden der Listen:', error);
      throw error;
    }
  }

  // Einzelne Liste abrufen
  static async getListById(listId: string): Promise<List | null> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const listRef = doc(db, this.COLLECTION, listId);
      const listDoc = await getDoc(listRef);
      
      if (!listDoc.exists()) {
        return null;
      }

      const listData = {
        id: listDoc.id,
        ...listDoc.data()
      } as List;

      // Check if user has access to this list
      if (listData.userId !== auth.currentUser.uid && 
          (!listData.sharedWith || !listData.sharedWith.includes(auth.currentUser.uid))) {
        throw new Error('Keine Berechtigung für diese Liste');
      }

      return listData;
    } catch (error) {
      console.error('Fehler beim Laden der Liste:', error);
      throw error;
    }
  }

  // Geteilte Listen abrufen
  static async getSharedLists(userId: string): Promise<List[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('sharedWith', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as List));
    } catch (error) {
      console.error('Fehler beim Laden der geteilten Listen:', error);
      throw error;
    }
  }

  // Liste aktualisieren
  static async updateList(listId: string, updates: Partial<List>): Promise<void> {
    try {
      const listRef = doc(db, this.COLLECTION, listId);
      await updateDoc(listRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Liste:', error);
      throw error;
    }
  }

  // Liste löschen
  static async deleteList(listId: string): Promise<void> {
    try {
      // SCHRITT 1: Einzeln alle Items löschen
      const itemsQuery = query(
        collection(db, 'items'),
        where('listId', '==', listId)
      );
      const itemsSnapshot = await getDocs(itemsQuery);
      
      for (const itemDoc of itemsSnapshot.docs) {
        try {
          await deleteDoc(itemDoc.ref);
        } catch (error) {
          console.error(`❌ Failed to delete item ${itemDoc.id}:`, error);
          throw error;
        }
      }
      
      // SCHRITT 2: Einzeln alle Categories löschen
      try {
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('listId', '==', listId)
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        for (const categoryDoc of categoriesSnapshot.docs) {
          try {
            await deleteDoc(categoryDoc.ref);
          } catch (error) {
            console.error(`❌ Failed to delete category ${categoryDoc.id}:`, error);
            // Einzelne Category-Fehler nicht weiterwerfen - Liste trotzdem löschen
          }
        }
      } catch (error) {
        console.warn('⚠️ Categories query failed (collection might not exist):', error);
        // Collection existiert nicht oder andere Probleme - trotzdem weitermachen
      }
      
      // SCHRITT 3: Liste selbst löschen
      const listRef = doc(db, this.COLLECTION, listId);
      try {
        await deleteDoc(listRef);
      } catch (error) {
        console.error(`❌ Failed to delete list ${listId}:`, error);
        throw error;
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Liste:', error);
      throw error;
    }
  }

  // Liste teilen
  static async shareList(listId: string, userEmail: string): Promise<void> {
    try {
      const listRef = doc(db, this.COLLECTION, listId);
      const listDoc = await getDoc(listRef);
      
      if (!listDoc.exists()) {
        throw new Error('Liste nicht gefunden');
      }

      const listData = listDoc.data() as List;
      const currentSharedWith = listData.sharedWith || [];
      
      if (!currentSharedWith.includes(userEmail)) {
        await updateDoc(listRef, {
          sharedWith: [...currentSharedWith, userEmail],
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Fehler beim Teilen der Liste:', error);
      throw error;
    }
  }

  // Real-time Listener für Listen
  static subscribeToUserLists(
    userId: string,
    callback: (lists: List[]) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as List));
      callback(lists);
    });
  }

  /**
   * Updates the item count for a list
   */
  static async updateListItemCount(listId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Count total and completed items
      const itemsQuery = query(
        collection(db, 'items'),
        where('listId', '==', listId)
      );
      
      const itemsSnapshot = await getDocs(itemsQuery);
      const items = itemsSnapshot.docs.map(doc => doc.data());
      
      const total = items.length;
      const completed = items.filter(item => item.isCompleted).length;

      // Update the list document
      const listRef = doc(db, this.COLLECTION, listId);
      await updateDoc(listRef, {
        itemCount: {
          total,
          completed
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Item-Anzahl:', error);
      throw error;
    }
  }
}

// Category Service
export class CategoryService {
  private static readonly COLLECTION = 'categories';

  /**
   * Creates a new category for a specific list
   */
  static async createListCategory(listId: string, name: string, color: string = '#6c757d'): Promise<string> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const now = Timestamp.now();
      const categoryData = {
        name,
        color,
        listId, // List-spezifische Kategorie
        userId: auth.currentUser.uid,
        createdAt: now,
        updatedAt: now,
        order: Date.now() // Einfache Reihenfolge
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), categoryData);
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
      throw error;
    }
  }

  /**
   * Gets all categories for a specific list
   */
  static async getListCategories(listId: string): Promise<Category[]> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Einfache Query ohne Index-Bedarf - sortieren wir client-seitig
      const q = query(
        collection(db, this.COLLECTION),
        where('listId', '==', listId),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));

      // Client-seitige Sortierung nach order
      return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      throw error;
    }
  }

  /**
   * Updates a category
   */
  static async updateCategory(categoryId: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'userId' | 'listId'>>): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const categoryRef = doc(db, this.COLLECTION, categoryId);
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kategorie:', error);
      throw error;
    }
  }

  /**
   * Deletes a category and uncategorizes all items
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Erst alle Items aus der Kategorie entfernen
      await ItemService.uncategorizeItemsByCategory(categoryId);
      
      // Dann Kategorie löschen
      const categoryRef = doc(db, this.COLLECTION, categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      throw error;
    }
  }

  // Legacy method - wird schrittweise ersetzt
  static async createCategory(
    name: string,
    color: string,
    userId: string,
    type: ListType
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const categoryData = {
        name,
        color,
        userId,
        type,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), categoryData);
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
      throw error;
    }
  }

  // Kategorien des Users abrufen
  static async getUserCategories(userId: string, type?: ListType): Promise<Category[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('name')
      );

      if (type) {
        q = query(
          collection(db, this.COLLECTION),
          where('userId', '==', userId),
          where('type', '==', type),
          orderBy('name')
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      throw error;
    }
  }
}

// Backward compatibility export
export const TodoListService = ListService;

export class ItemService {
  private static collection = 'items';

  /**
   * Creates multiple items from an array of names (bulk add)
   */
  static async createItemsFromNames(listId: string, itemNames: string[]): Promise<string[]> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const userId = auth.currentUser.uid;
      const now = Timestamp.now();
      
      // Batch write für bessere Performance
      const batch = writeBatch(db);
      const itemIds: string[] = [];

      itemNames.forEach((name) => {
        const docRef = doc(collection(db, this.collection));
        const itemData = {
          listId,
          name: name.trim(),
          quantity: 1, // Standard-Menge
          completed: false,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
          order: Date.now() // Einfache Reihenfolge
        };
        
        batch.set(docRef, itemData);
        itemIds.push(docRef.id);
      });

      await batch.commit();
      return itemIds;
    } catch (error) {
      console.error('Fehler beim Erstellen der Items:', error);
      throw error;
    }
  }

  /**
   * Creates a new item in a list
   */
  static async createItem(listId: string, itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'listId'>): Promise<string> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Calculate next order value if not provided
      let orderValue = itemData.order;
      if (orderValue === undefined) {
        const existingItems = await this.getListItems(listId);
        const maxOrder = Math.max(0, ...existingItems.map(item => item.order || 0));
        orderValue = maxOrder + 1000; // 1000er Schritte für Zwischeneinfügungen
      }

      const now = serverTimestamp();
      const item: Omit<Item, 'id'> = {
        ...itemData,
        listId,
        createdAt: now as any,
        updatedAt: now as any,
        order: orderValue
      };

      const docRef = await addDoc(collection(db, this.collection), item);
      
      // Update the list's item count
      await ListService.updateListItemCount(listId);
      
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Erstellen des Items:', error);
      throw error;
    }
  }

  /**
   * Gets all items for a specific list
   */
  static async getListItems(listId: string): Promise<Item[]> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Einfache Query ohne Index-Bedarf - sortieren wir client-seitig
      const q = query(
        collection(db, this.collection),
        where('listId', '==', listId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Item));

      // Client-seitige Sortierung: erst nach order, dann nach createdAt
      return items.sort((a, b) => {
        // Erst nach order sortieren (falls vorhanden)
        if (a.order !== undefined && b.order !== undefined) {
          if (a.order !== b.order) {
            return a.order - b.order;
          }
        }
        // Falls order gleich oder nicht vorhanden, nach createdAt sortieren
        return a.createdAt.toMillis() - b.createdAt.toMillis();
      });
    } catch (error) {
      console.error('Fehler beim Laden der Items:', error);
      throw error;
    }
  }

  /**
   * Updates the quantity of an item (0 = delete)
   */
  static async updateQuantity(itemId: string, quantity: number): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Wenn quantity 0 ist, Item löschen
      if (quantity === 0) {
        await this.deleteItem(itemId);
        return;
      }

      // Quantity zwischen 1-9 limitieren
      const clampedQuantity = Math.max(1, Math.min(9, quantity));
      
      const itemRef = doc(db, this.collection, itemId);
      await updateDoc(itemRef, {
        quantity: clampedQuantity,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Menge:', error);
      throw error;
    }
  }

  /**
   * Assigns an item to a category
   */
  static async assignItemToCategory(itemId: string, categoryId: string | null): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const itemRef = doc(db, this.collection, itemId);
      
      // Check if item exists first
      const itemDoc = await getDoc(itemRef);
      if (!itemDoc.exists()) {
        throw new Error('Item nicht gefunden');
      }
      
      const updateData = {
        categoryId: categoryId,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(itemRef, updateData);
    } catch (error) {
      console.error('❌ Fehler beim Zuweisen zur Kategorie:', error);
      throw error;
    }
  }

  /**
   * Removes category assignment from all items of a category
   */
  static async uncategorizeItemsByCategory(categoryId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Find all items with this categoryId
      const q = query(
        collection(db, this.collection),
        where('categoryId', '==', categoryId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(docSnapshot => {
        const itemRef = doc(db, this.collection, docSnapshot.id);
        batch.update(itemRef, {
          categoryId: null,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Fehler beim Entfernen der Kategorie-Zuweisungen:', error);
      throw error;
    }
  }

  /**
   * Gets items grouped by category for a list
   */
  static async getItemsByCategory(listId: string): Promise<{ [categoryId: string]: Item[] }> {
    try {
      const items = await this.getListItems(listId);
      
      // Group items by categoryId
      const grouped: { [categoryId: string]: Item[] } = {};
      
      items.forEach(item => {
        const categoryId = item.categoryId || 'uncategorized';
        if (!grouped[categoryId]) {
          grouped[categoryId] = [];
        }
        grouped[categoryId].push(item);
      });

      return grouped;
    } catch (error) {
      console.error('Fehler beim Gruppieren der Items:', error);
      throw error;
    }
  }

  /**
   * Updates an existing item
   */
  static async updateItem(itemId: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'listId'>>): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const itemRef = doc(db, this.collection, itemId);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // If completion status changed, update list item count
      if ('isCompleted' in updates) {
        const itemDoc = await getDoc(itemRef);
        if (itemDoc.exists()) {
          await ListService.updateListItemCount(itemDoc.data().listId);
        }
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Items:', error);
      throw error;
    }
  }

  /**
   * Toggles the completion status of an item
   */
  static async toggleComplete(itemId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const itemRef = doc(db, this.collection, itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error('Item nicht gefunden');
      }

      const currentItem = itemDoc.data() as Item;
      const isCompleted = !currentItem.isCompleted;
      
      const updates: Partial<Item> = {
        isCompleted,
        updatedAt: serverTimestamp() as any
      };

      if (isCompleted) {
        updates.completedBy = auth.currentUser.uid;
        updates.completedAt = serverTimestamp() as any;
      } else {
        updates.completedBy = undefined;
        updates.completedAt = undefined;
      }

      await updateDoc(itemRef, updates);
      
      // Update list item count
      await ListService.updateListItemCount(currentItem.listId);
    } catch (error) {
      console.error('Fehler beim Ändern des Completion-Status:', error);
      throw error;
    }
  }

  /**
   * Deletes an item
   */
  static async deleteItem(itemId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const itemRef = doc(db, this.collection, itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (itemDoc.exists()) {
        const listId = itemDoc.data().listId;
        await deleteDoc(itemRef);
        
        // Update list item count
        await ListService.updateListItemCount(listId);
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Items:', error);
      throw error;
    }
  }

  /**
   * Reorders items in a list
   */
  static async reorderItems(itemUpdates: { id: string; order: number }[]): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const promises = itemUpdates.map(({ id, order }) => {
        const itemRef = doc(db, this.collection, id);
        return updateDoc(itemRef, {
          order,
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Fehler beim Neu-Ordnen der Items:', error);
      throw error;
    }
  }

  /**
   * Update order of a single item
   */
  static async updateItemOrder(itemId: string, order: number): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      const itemRef = doc(db, this.collection, itemId);
      await updateDoc(itemRef, {
        order,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Item-Reihenfolge:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for list items
   */
  static subscribeToListItems(listId: string, callback: (items: Item[]) => void): () => void {
    if (!auth.currentUser) {
      throw new Error('Benutzer muss angemeldet sein');
    }

    const q = query(
      collection(db, this.collection),
      where('listId', '==', listId),
      orderBy('order', 'asc'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Item));
      callback(items);
    });
  }
}

// Share Service
export class ShareService {
  private static readonly COLLECTION = 'listShares';

  /**
   * Shares a list with another user by email
   */
  static async shareList(
    listId: string, 
    email: string, 
    permission: 'read' | 'write' = 'write'
  ): Promise<string> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Check if already shared with this email
      const existingShareQuery = query(
        collection(db, this.COLLECTION),
        where('listId', '==', listId),
        where('sharedWithEmail', '==', email.toLowerCase())
      );
      
      const existingShares = await getDocs(existingShareQuery);
      if (!existingShares.empty) {
        throw new Error('Liste wurde bereits mit dieser E-Mail-Adresse geteilt');
      }

      const shareData = {
        listId,
        ownerId: auth.currentUser.uid,
        sharedWithEmail: email.toLowerCase(),
        permission,
        sharedAt: serverTimestamp(),
        sharedBy: auth.currentUser.uid,
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), shareData);
      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Teilen der Liste:', error);
      throw error;
    }
  }

  /**
   * Gets all shares for a specific list
   */
  static async getListShares(listId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('listId', '==', listId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Fehler beim Laden der geteilten Listen:', error);
      throw error;
    }
  }

  /**
   * Removes a share
   */
  static async removeShare(shareId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, shareId));
    } catch (error) {
      console.error('Fehler beim Entfernen der Freigabe:', error);
      throw error;
    }
  }
}