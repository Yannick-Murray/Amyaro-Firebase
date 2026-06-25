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
  limit,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  deleteField
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logger } from '../utils/logger';
import { NotificationService } from './notificationService';
import type { List, Category, ListType, Item, ListHistory } from '../types/todoList';

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
    } catch (error: any) {
      // Nur loggen wenn es nicht ein Permission-Problem für unverifizierte Benutzer ist
      if (error.code !== 'permission-denied' || auth.currentUser?.emailVerified) {
        console.error('Fehler beim Laden der Listen:', error);
      }
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
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: List-Access-Check
      const listDoc = await getDoc(doc(db, this.COLLECTION, listId));
      if (!listDoc.exists()) {
        throw new Error('Liste nicht gefunden');
      }

      const listData = listDoc.data();
      const currentUserId = auth.currentUser.uid;
      
      // Nur Liste-Owner kann Liste löschen
      if (listData.userId !== currentUserId) {
        throw new Error('Keine Berechtigung zum Löschen dieser Liste');
      }

      // 🔥 ATOMIC BATCH DELETE - alles oder nichts!
      const batch = writeBatch(db);

      // SCHRITT 1: Alle TodoItems sammeln und zur Batch hinzufügen
      const itemsQuery = query(
        collection(db, 'todoItems'), // Richtige Collection!
        where('listId', '==', listId)
      );
      const itemsSnapshot = await getDocs(itemsQuery);
      
      itemsSnapshot.docs.forEach(itemDoc => {
        batch.delete(itemDoc.ref);
      });
      
      // SCHRITT 2: Alle Categories sammeln und zur Batch hinzufügen
      try {
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('listId', '==', listId)
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        categoriesSnapshot.docs.forEach(categoryDoc => {
          batch.delete(categoryDoc.ref);
        });
      } catch (error) {
        console.warn('⚠️ Categories query failed (collection might not exist):', error);
        // Collection existiert nicht - das ist ok, weitermachen
      }

      // SCHRITT 3: Liste selbst zur Batch hinzufügen
      const listRef = doc(db, this.COLLECTION, listId);
      batch.delete(listRef);
      
      // 🚀 ATOMIC COMMIT - alles auf einmal!
      await batch.commit();
      
      console.log(`✅ Liste ${listId} vollständig gelöscht (atomic)`);
      
    } catch (error) {
      logger.error('❌ Fehler beim Löschen der Liste:', error);
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
        collection(db, 'todoItems'),
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

  /**
   * Schließt eine Einkaufsliste ab und löscht alle nicht-abgehakten Items
   */
  static async closeList(
    listId: string, 
    destination?: string, 
    price?: number
  ): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Liste abrufen und prüfen
      const listDoc = await getDoc(doc(db, this.COLLECTION, listId));
      if (!listDoc.exists()) {
        throw new Error('Liste nicht gefunden');
      }

      const listData = listDoc.data();
      
      // Nur Shopping-Listen können abgeschlossen werden
      if (listData.type !== 'shopping') {
        throw new Error('Nur Einkaufslisten können abgeschlossen werden');
      }

      // Batch für atomare Operation
      const batch = writeBatch(db);

      // Abgehakte Items abrufen für Count und optional destination update
      const completedItemsQuery = query(
        collection(db, 'todoItems'),
        where('listId', '==', listId),
        where('isCompleted', '==', true)
      );
      
      const completedItemsSnapshot = await getDocs(completedItemsQuery);
      const completedItemsCount = completedItemsSnapshot.docs.length;

      // Wenn destination angegeben, alle abgehakten Items mit destination updaten
      if (destination) {
        completedItemsSnapshot.docs.forEach(itemDoc => {
          batch.update(itemDoc.ref, {
            destination: destination,
            updatedAt: serverTimestamp()
          });
        });
      }

      // Alle nicht-abgehakten Items löschen (Namen vorher für Notification sichern)
      const itemsQuery = query(
        collection(db, 'todoItems'),
        where('listId', '==', listId),
        where('isCompleted', '==', false)
      );
      
      const itemsSnapshot = await getDocs(itemsQuery);
      const unclosedItemNames = itemsSnapshot.docs.map(d => d.data().name as string);
      itemsSnapshot.docs.forEach(itemDoc => {
        batch.delete(itemDoc.ref);
      });

      // Liste als geschlossen markieren mit optionalen Feldern
      const listRef = doc(db, this.COLLECTION, listId);
      const updateData: any = {
        isClosed: true,
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (destination) {
        updateData.destination = destination;
      }
      
      if (price !== undefined && price !== null) {
        updateData.price = price;
      }
      
      batch.update(listRef, updateData);

      // History-Eintrag erstellen
      const historyRef = doc(collection(db, 'listHistory'));
      const historyEntry: Omit<ListHistory, 'id'> = {
        listId: listId,
        listName: listData.name,
        userId: auth.currentUser.uid,
        ownerId: listData.userId,
        closedBy: auth.currentUser.uid,
        shop: destination,
        price: price,
        itemCount: completedItemsCount,
        closedAt: serverTimestamp() as any,
        sharedWith: listData.sharedWith || []
      };
      batch.set(historyRef, historyEntry);

      await batch.commit();
      
      // Item Count aktualisieren
      await this.updateListItemCount(listId);

      // Andere Listenmitglieder über das Schließen benachrichtigen (non-critical)
      try {
        const sharedWith: string[] = listData.sharedWith || [];
        if (sharedWith.length > 0 || listData.userId !== auth.currentUser.uid) {
          const fromName = auth.currentUser.displayName || auth.currentUser.email || 'Unbekannter Nutzer';
          await NotificationService.createNotificationsForListMembers(
            listId,
            listData.name,
            auth.currentUser.uid,
            fromName,
            sharedWith,
            listData.userId,
            'list_closed',
            undefined,
            unclosedItemNames
          );
        }
      } catch (notifyError) {
        // Benachrichtigung ist nicht kritisch — Liste ist bereits geschlossen
        logger.log('Benachrichtigung nach Listenschluss konnte nicht gesendet werden', notifyError);
      }

      logger.log(`Liste ${listId} wurde abgeschlossen`);
    } catch (error) {
      logger.error('Fehler beim Abschließen der Liste:', error);
      throw error;
    }
  }

  /**
   * Öffnet eine geschlossene Liste wieder und setzt alle Items zurück auf nicht-abgehakt
   */
  static async reopenList(listId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Liste abrufen und prüfen
      const listDoc = await getDoc(doc(db, this.COLLECTION, listId));
      if (!listDoc.exists()) {
        throw new Error('Liste nicht gefunden');
      }

      const listData = listDoc.data();
      
      if (!listData.isClosed) {
        throw new Error('Liste ist nicht geschlossen');
      }

      // Batch für atomare Operation
      const batch = writeBatch(db);

      // Alle Items wieder auf nicht-abgehakt setzen
      const itemsQuery = query(
        collection(db, 'todoItems'),
        where('listId', '==', listId)
      );
      
      const itemsSnapshot = await getDocs(itemsQuery);
      itemsSnapshot.docs.forEach(itemDoc => {
        batch.update(itemDoc.ref, {
          isCompleted: false,
          completedBy: null,
          completedAt: null
        });
      });

      // Liste wieder öffnen
      const listRef = doc(db, this.COLLECTION, listId);
      batch.update(listRef, {
        isClosed: false,
        closedAt: null,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      
      // Item Count aktualisieren
      await this.updateListItemCount(listId);

      // Andere Listenmitglieder über das Wiedereröffnen benachrichtigen (non-critical)
      try {
        const sharedWith: string[] = listData.sharedWith || [];
        if (sharedWith.length > 0 || listData.userId !== auth.currentUser.uid) {
          const fromName = auth.currentUser.displayName || auth.currentUser.email || 'Unbekannter Nutzer';
          await NotificationService.createNotificationsForListMembers(
            listId,
            listData.name,
            auth.currentUser.uid,
            fromName,
            sharedWith,
            listData.userId,
            'list_reopened'
          );
        }
      } catch (notifyError) {
        logger.log('Benachrichtigung nach Wiedereröffnen konnte nicht gesendet werden', notifyError);
      }
      
      logger.log(`Liste ${listId} wurde wieder geöffnet`);
    } catch (error) {
      logger.error('Fehler beim Wiedereröffnen der Liste:', error);
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

      // 🔒 SECURITY: List-Access-Check first
      const listDoc = await getDoc(doc(db, 'lists', listId));
      if (!listDoc.exists()) {
        throw new Error('Liste nicht gefunden');
      }

      const listData = listDoc.data();
      const currentUserId = auth.currentUser.uid;
      
      // Prüfe ob User Zugriff auf die Liste hat
      if (listData.userId !== currentUserId && 
          (!listData.sharedWith || !listData.sharedWith.includes(currentUserId))) {
        throw new Error('Keine Berechtigung für diese Liste');
      }

      // 🔥 FIX: Alle Kategorien der Liste laden (nicht nur eigene!)
      const q = query(
        collection(db, this.COLLECTION),
        where('listId', '==', listId)
        // KEIN userId Filter! Alle Kategorien der Liste sollen sichtbar sein
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

  /**
   * Reorder categories by updating their order values one by one
   */
  static async reorderCategories(categoryIds: string[]): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('Benutzer muss angemeldet sein');
      }

      // Update categories one by one to avoid batch permission issues
      for (let i = 0; i < categoryIds.length; i++) {
        const categoryRef = doc(db, this.COLLECTION, categoryIds[i]);
        await updateDoc(categoryRef, {
          order: i,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Fehler beim Neuordnen der Kategorien:', error);
      throw error;
    }
  }
}

// Backward compatibility export
export const TodoListService = ListService;

export class ItemService {
  private static collection = 'todoItems';

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
      
      // Update the list's item count
      await ListService.updateListItemCount(listId);

      // Andere Listenmitglieder über neue Items benachrichtigen (non-critical)
      try {
        const listDoc = await getDoc(doc(db, 'lists', listId));
        if (listDoc.exists()) {
          const listData = listDoc.data();
          const sharedWith: string[] = listData.sharedWith || [];
          if (sharedWith.length > 0 || listData.userId !== userId) {
            const currentUser = auth.currentUser!;
            const fromName = currentUser.displayName || currentUser.email || 'Unbekannter Nutzer';
            await NotificationService.createNotificationsForListMembers(
              listId,
              listData.name,
              userId,
              fromName,
              sharedWith,
              listData.userId,
              'items_added',
              itemNames
            );
          }
        }
      } catch (notifyError) {
        // Non-critical — Items wurden erstellt
        logger.log('Benachrichtigung nach Bulk-Add konnte nicht gesendet werden', notifyError);
      }

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
      
      // Clean up undefined values for Firebase
      const cleanItemData = { ...itemData };
      if (cleanItemData.categoryId === undefined) {
        delete cleanItemData.categoryId;
      }
      if (cleanItemData.completedBy === undefined) {
        delete cleanItemData.completedBy;
      }
      if (cleanItemData.assignedTo === undefined) {
        delete cleanItemData.assignedTo;
      }
      if (cleanItemData.link === undefined) {
        delete cleanItemData.link;
      }
      
      const item: Omit<Item, 'id'> = {
        ...cleanItemData,
        listId,
        createdAt: now as any,
        updatedAt: now as any,
        order: orderValue
      };

      // Remove undefined fields to prevent Firestore errors
      // Only remove optional fields that are undefined
      const cleanItem = { ...item };
      if (cleanItem.categoryId === undefined) {
        delete cleanItem.categoryId;
      }
      if (cleanItem.description === undefined) {
        delete cleanItem.description;
      }
      if (cleanItem.quantity === undefined) {
        delete cleanItem.quantity;
      }
      if (cleanItem.price === undefined) {
        delete cleanItem.price;
      }
      if (cleanItem.link === undefined) {
        delete cleanItem.link;
      }
      if (cleanItem.category === undefined) {
        delete cleanItem.category;
      }
      if (cleanItem.completedBy === undefined) {
        delete cleanItem.completedBy;
      }
      if (cleanItem.completedAt === undefined) {
        delete cleanItem.completedAt;
      }

      const docRef = await addDoc(collection(db, this.collection), cleanItem);
      
      // Update the list's item count
      await ListService.updateListItemCount(listId);

      // Andere Listenmitglieder über das neue Item benachrichtigen (non-critical)
      try {
        const listDoc = await getDoc(doc(db, 'lists', listId));
        if (listDoc.exists()) {
          const listData = listDoc.data();
          const sharedWith: string[] = listData.sharedWith || [];
          if (sharedWith.length > 0 || listData.userId !== auth.currentUser!.uid) {
            const fromName = auth.currentUser!.displayName || auth.currentUser!.email || 'Unbekannter Nutzer';
            await NotificationService.createNotificationsForListMembers(
              listId,
              listData.name,
              auth.currentUser!.uid,
              fromName,
              sharedWith,
              listData.userId,
              'items_added',
              [cleanItem.name as string]
            );
          }
        }
      } catch (notifyError) {
        // Non-critical — Item wurde erstellt
        logger.log('Benachrichtigung nach Item-Erstellung konnte nicht gesendet werden', notifyError);
      }

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

      // 🔒 SECURITY FIX: Get category first to find the listId
      const categoryRef = doc(db, 'categories', categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        console.warn('Category not found:', categoryId);
        return;
      }
      
      const categoryData = categoryDoc.data();
      const listId = categoryData.listId;
      
      if (!listId) {
        console.warn('Category has no listId:', categoryId);
        return;
      }

      // Now find items within this specific list
      const q = query(
        collection(db, this.collection),
        where('listId', '==', listId),
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
      
      const updates: any = {
        isCompleted,
        updatedAt: serverTimestamp()
      };

      if (isCompleted) {
        updates.completedBy = auth.currentUser.uid;
        updates.completedAt = serverTimestamp();
      } else {
        // Felder explizit löschen statt auf undefined setzen
        updates.completedBy = deleteField();
        updates.completedAt = deleteField();
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
   * Reaktiviert ein abgehaktes Item (setzt isCompleted auf false)
   */
  static async reactivateItem(itemId: string): Promise<void> {
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

      await updateDoc(itemRef, {
        isCompleted: false,
        completedBy: deleteField(),
        completedAt: deleteField(),
        updatedAt: serverTimestamp()
      });
      
      // Update list item count
      await ListService.updateListItemCount(currentItem.listId);
    } catch (error) {
      console.error('Fehler beim Reaktivieren des Items:', error);
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

// ─── Frequency types ──────────────────────────────────────────────────────────

export interface FrequentItem {
  name: string;
  count: number;
  categoryName?: string;
}

export interface FrequentCategory {
  name: string;
  color: string;
  count: number;
}

export interface FrequentSuggestions {
  items: FrequentItem[];
  categories: FrequentCategory[];
}

// ─── FrequencyService ─────────────────────────────────────────────────────────

export class FrequencyService {
  private static readonly MIN_ITEM_FREQ = 4;
  private static readonly MIN_CAT_FREQ = 2;
  private static readonly MAX_ITEMS = 20;
  private static readonly IN_QUERY_BATCH_SIZE = 10;

  private static chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  /**
   * Returns items and categories that appeared on at least minItemFreq / minCatFreq
   * *different* lists owned by the user (of the given type).
   * Counts are per distinct list, not total occurrences.
   */
  static async getFrequentItemsAndCategories(
    userId: string,
    listType: ListType,
    minItemFreq: number = FrequencyService.MIN_ITEM_FREQ,
    minCatFreq: number = FrequencyService.MIN_CAT_FREQ
  ): Promise<FrequentSuggestions> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      throw new Error('Benutzer muss angemeldet sein');
    }

    // 1. All own lists of the given type
    const listsSnap = await getDocs(
      query(
        collection(db, 'lists'),
        where('userId', '==', userId),
        where('type', '==', listType)
      )
    );
    const listIds = listsSnap.docs.map(d => d.id);
    if (listIds.length === 0) return { items: [], categories: [] };

    // 2. Batch-query todoItems (safe limit for Firestore `in` queries)
    const allItemDocs: any[] = [];
    for (const batch of FrequencyService.chunkArray(listIds, FrequencyService.IN_QUERY_BATCH_SIZE)) {
      const snap = await getDocs(
        query(collection(db, 'todoItems'), where('listId', 'in', batch))
      );
      allItemDocs.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    // 3. Batch-query categories
    const allCategoryDocs: any[] = [];
    for (const batch of FrequencyService.chunkArray(listIds, FrequencyService.IN_QUERY_BATCH_SIZE)) {
      const snap = await getDocs(
        query(collection(db, 'categories'), where('listId', 'in', batch))
      );
      allCategoryDocs.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    // 4. categoryId → name map for item enrichment
    const categoryIdToName = new Map<string, string>();
    for (const cat of allCategoryDocs) {
      categoryIdToName.set(cat.id as string, cat.name as string);
    }

    // 5. Count items per distinct list
    const itemListSets = new Map<string, Set<string>>();
    const itemDataMap = new Map<string, { name: string; categoryName?: string }>();

    for (const item of allItemDocs) {
      const key = (item.name as string).toLowerCase().trim();
      if (!itemListSets.has(key)) itemListSets.set(key, new Set());
      itemListSets.get(key)!.add(item.listId as string);

      if (!itemDataMap.has(key)) {
        const catName = item.categoryId
          ? categoryIdToName.get(item.categoryId as string)
          : undefined;
        itemDataMap.set(key, { name: item.name as string, categoryName: catName });
      } else if (!itemDataMap.get(key)!.categoryName && item.categoryId) {
        const catName = categoryIdToName.get(item.categoryId as string);
        if (catName) itemDataMap.get(key)!.categoryName = catName;
      }
    }

    // 6. Count categories per distinct list
    const catListSets = new Map<string, Set<string>>();
    const catDataMap = new Map<string, { name: string; color: string }>();

    for (const cat of allCategoryDocs) {
      const key = (cat.name as string).toLowerCase().trim();
      if (!catListSets.has(key)) catListSets.set(key, new Set());
      catListSets.get(key)!.add(cat.listId as string);
      if (!catDataMap.has(key)) {
        catDataMap.set(key, {
          name: cat.name as string,
          color: (cat.color as string) || '#6c757d'
        });
      }
    }

    // 7. Build filtered results
    const frequentItems: FrequentItem[] = Array.from(itemListSets.entries())
      .filter(([, s]) => s.size >= minItemFreq)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, FrequencyService.MAX_ITEMS)
      .map(([key, s]) => ({
        name: itemDataMap.get(key)!.name,
        count: s.size,
        categoryName: itemDataMap.get(key)!.categoryName
      }));

    const frequentCategories: FrequentCategory[] = Array.from(catListSets.entries())
      .filter(([, s]) => s.size >= minCatFreq)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([key, s]) => ({
        name: catDataMap.get(key)!.name,
        color: catDataMap.get(key)!.color,
        count: s.size
      }));

    return { items: frequentItems, categories: frequentCategories };
  }

  /**
   * Creates the given categories and items in the specified list.
   * Items are linked to newly created category IDs where possible.
   */
  static async populateListFromFrequent(
    listId: string,
    categories: FrequentCategory[],
    items: FrequentItem[]
  ): Promise<void> {
    if (!auth.currentUser) throw new Error('Benutzer muss angemeldet sein');

    const listDoc = await getDoc(doc(db, 'lists', listId));
    if (!listDoc.exists()) {
      throw new Error('Liste wurde nicht gefunden');
    }

    const listData = listDoc.data() as { userId?: string; sharedWith?: string[] };
    const currentUserId = auth.currentUser.uid;
    const hasAccess =
      listData.userId === currentUserId ||
      (Array.isArray(listData.sharedWith) && listData.sharedWith.includes(currentUserId));

    if (!hasAccess) {
      throw new Error('Keine Berechtigung für diese Liste');
    }

    const existingItemsSnap = await getDocs(
      query(collection(db, 'todoItems'), where('listId', '==', listId), limit(1))
    );
    if (!existingItemsSnap.empty) {
      // Idempotent guard: list is no longer empty, so skip auto-population.
      return;
    }

    // 1. Create categories and build name → newId map
    const categoryNameToId = new Map<string, string>();
    for (const cat of categories) {
      const newId = await CategoryService.createListCategory(listId, cat.name, cat.color);
      categoryNameToId.set(cat.name.toLowerCase().trim(), newId);
    }

    if (items.length === 0) return;

    // 2. Batch-create items
    const batch = writeBatch(db);
    const now = Timestamp.now();

    items.forEach((item, index) => {
      const docRef = doc(collection(db, 'todoItems'));
      const categoryId = item.categoryName
        ? categoryNameToId.get(item.categoryName.toLowerCase().trim())
        : undefined;
      const itemData: any = {
        listId,
        name: item.name,
        quantity: 1,
        isCompleted: false,
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
        order: (index + 1) * 1000
      };
      if (categoryId) itemData.categoryId = categoryId;
      batch.set(docRef, itemData);
    });

    await batch.commit();
    await ListService.updateListItemCount(listId);
  }
}