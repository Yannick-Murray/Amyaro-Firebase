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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { TodoItem, ListType } from '../types/todoList';
import { CategoryService, ListService } from './listService';

// TodoItem Services
export class TodoItemService {
  private static readonly COLLECTION = 'todoItems';

  // Item erstellen
  static async createItem(
    listId: string,
    title: string,
    additionalData?: Partial<TodoItem>
  ): Promise<string> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: List-Access-Check
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

      const itemData: Omit<TodoItem, 'id'> = {
        listId,
        name: title,
        description: additionalData?.description,
        categoryId: additionalData?.categoryId,
        isCompleted: false,
        quantity: additionalData?.quantity ?? 1,
        priority: (additionalData?.priority as 'low' | 'medium' | 'high') ?? 'medium',
        price: additionalData?.price,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        order: additionalData?.order ?? 0
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), itemData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  // Items einer Liste abrufen
  static async getListItems(listId: string): Promise<TodoItem[]> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: List-Access-Check
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

      const q = query(
        collection(db, this.COLLECTION),
        where('listId', '==', listId),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      } as TodoItem));
    } catch (error) {
      console.error('Error getting list items:', error);
      throw error;
    }
  }

  // Items einer Kategorie abrufen
  static async getCategoryItems(listId: string, categoryId: string): Promise<TodoItem[]> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: List-Access-Check
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

      const q = query(
        collection(db, this.COLLECTION),
        where('listId', '==', listId),
        where('categoryId', '==', categoryId),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      } as TodoItem));
    } catch (error) {
      console.error('Error getting category items:', error);
      throw error;
    }
  }

  // Item aktualisieren
  static async updateItem(itemId: string, updates: Partial<TodoItem>): Promise<void> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: Item-Access-Check
      const itemDoc = await getDoc(doc(db, this.COLLECTION, itemId));
      if (!itemDoc.exists()) {
        throw new Error('Item nicht gefunden');
      }

      const itemData = itemDoc.data();
      const listId = itemData.listId;

      // Prüfe Liste-Zugriff
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

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      // Zeitstempel-Felder behandeln
      if (updates.completedAt instanceof Date) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt);
      }
      
      await updateDoc(doc(db, this.COLLECTION, itemId), updateData);
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  // Item abhaken/abhaken rückgängig machen
  static async toggleItemCompletion(
    itemId: string,
    listId: string,
    listType: ListType,
    userId: string,
    userName: string,
    completed: boolean
  ): Promise<void> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: Verify userId matches current user
      if (auth.currentUser.uid !== userId) {
        throw new Error('User ID stimmt nicht überein');
      }

      // 🔒 SECURITY: List-Access-Check
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

      const batch = writeBatch(db);
      const itemRef = doc(db, this.COLLECTION, itemId);

      let targetCategoryId: string | undefined;

      if (completed) {
        // Item als erledigt markieren und in entsprechende Kategorie verschieben
        if (listType === 'shopping') {
          // Für Shopping-Listen: "Erledigte Items" Kategorie
          targetCategoryId = await CategoryService.createListCategory(listId, 'Erledigte Items', '#28a745');
        } else if (listType === 'gift') {
          // Für Geschenke-Listen: "Von [UserName]" Kategorie
          targetCategoryId = await CategoryService.createCategory(`Von ${userName}`, '#17a2b8', userId, 'gift');
        }

        batch.update(itemRef, {
          completed: true,
          completedBy: userId,
          completedAt: Timestamp.fromDate(new Date()),
          categoryId: targetCategoryId,
          updatedAt: Timestamp.fromDate(new Date())
        });
      } else {
        // Item als nicht erledigt markieren (aus spezieller Kategorie entfernen)
        batch.update(itemRef, {
          completed: false,
          completedBy: null,
          completedAt: null,
          categoryId: null, // Item wird in "Ohne Kategorie" verschoben
          updatedAt: Timestamp.fromDate(new Date())
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error toggling item completion:', error);
      throw error;
    }
  }

  // Item zwischen Kategorien verschieben
  static async moveItemToCategory(
    itemId: string,
    newCategoryId: string | null
  ): Promise<void> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: Item-Access-Check
      const itemDoc = await getDoc(doc(db, this.COLLECTION, itemId));
      if (!itemDoc.exists()) {
        throw new Error('Item nicht gefunden');
      }

      const itemData = itemDoc.data();
      const listId = itemData.listId;

      // Prüfe Liste-Zugriff
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

      await updateDoc(doc(db, this.COLLECTION, itemId), {
        categoryId: newCategoryId,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error moving item to category:', error);
      throw error;
    }
  }

  // Item-Reihenfolge aktualisieren
  static async updateItemOrder(itemId: string, newOrder: number): Promise<void> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: Item-Access-Check
      const itemDoc = await getDoc(doc(db, this.COLLECTION, itemId));
      if (!itemDoc.exists()) {
        throw new Error('Item nicht gefunden');
      }

      const itemData = itemDoc.data();
      const listId = itemData.listId;

      // Prüfe Liste-Zugriff
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

      await updateDoc(doc(db, this.COLLECTION, itemId), {
        order: newOrder,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating item order:', error);
      throw error;
    }
  }

  // Item löschen
  static async deleteItem(itemId: string): Promise<void> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: Item-Access-Check
      const itemDoc = await getDoc(doc(db, this.COLLECTION, itemId));
      if (!itemDoc.exists()) {
        throw new Error('Item nicht gefunden');
      }

      const itemData = itemDoc.data();
      const listId = itemData.listId;

      // Prüfe Liste-Zugriff
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

      await deleteDoc(doc(db, this.COLLECTION, itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // Real-time Listener für Items einer Liste
  static subscribeToListItems(
    listId: string,
    callback: (items: TodoItem[]) => void
  ): () => void {
    // 🔒 SECURITY: Auth-Check wird im Frontend vor dem Aufruf gemacht
    // Real-time listeners können nicht direkt auth-gecheckt werden
    // TODO: Auth-Validation sollte in Firestore Rules sein
    
    const q = query(
      collection(db, this.COLLECTION),
      where('listId', '==', listId),
      orderBy('order', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      } as TodoItem));
      
      callback(items);
    });
  }

  // Batch-Update für Items (für Drag & Drop Reordering)
  static async updateMultipleItemOrders(
    updates: Array<{ itemId: string; order: number; categoryId?: string }>
  ): Promise<void> {
    try {
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: Validate access to all items
      for (const update of updates) {
        const itemDoc = await getDoc(doc(db, this.COLLECTION, update.itemId));
        if (!itemDoc.exists()) {
          throw new Error(`Item ${update.itemId} nicht gefunden`);
        }

        const itemData = itemDoc.data();
        const listId = itemData.listId;

        // Prüfe Liste-Zugriff für jedes Item
        const listDoc = await getDoc(doc(db, 'lists', listId));
        if (!listDoc.exists()) {
          throw new Error(`Liste ${listId} nicht gefunden`);
        }

        const listData = listDoc.data();
        const currentUserId = auth.currentUser.uid;
        
        // Prüfe ob User Zugriff auf die Liste hat
        if (listData.userId !== currentUserId && 
            (!listData.sharedWith || !listData.sharedWith.includes(currentUserId))) {
          throw new Error(`Keine Berechtigung für Liste ${listId}`);
        }
      }
      const batch = writeBatch(db);
      const now = Timestamp.fromDate(new Date());

      updates.forEach(({ itemId, order, categoryId }) => {
        const itemRef = doc(db, this.COLLECTION, itemId);
        const updateData: any = {
          order,
          updatedAt: now
        };

        if (categoryId !== undefined) {
          updateData.categoryId = categoryId;
        }

        batch.update(itemRef, updateData);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error updating multiple item orders:', error);
      throw error;
    }
  }

  // Statistiken für eine Liste abrufen
  static async getListStatistics(listId: string): Promise<{
    totalItems: number;
    completedItems: number;
    completionRate: number;
  }> {
    try {
      const items = await this.getListItems(listId);
      const totalItems = items.length;
      const completedItems = items.filter(item => item.isCompleted).length;
      const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      return {
        totalItems,
        completedItems,
        completionRate: Math.round(completionRate)
      };
    } catch (error) {
      console.error('Error getting list statistics:', error);
      throw error;
    }
  }
}