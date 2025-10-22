import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { TodoItem, ListType } from '../types';
import { CategoryService } from './listService';

// TodoItem Services
export class TodoItemService {
  private static readonly COLLECTION = 'todoItems';

  // Item erstellen
  static async createItem(
    listId: string,
    title: string,
    userId: string,
    categoryId?: string,
    additionalData?: Partial<TodoItem>
  ): Promise<string> {
    try {
      const itemData: Omit<TodoItem, 'id'> = {
        listId,
        categoryId,
        title,
        description: additionalData?.description,
        completed: false,
        quantity: additionalData?.quantity,
        unit: additionalData?.unit,
        price: additionalData?.price,
        currency: additionalData?.currency || 'EUR',
        productUrl: additionalData?.productUrl,
        priority: additionalData?.priority,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: Date.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...itemData,
        createdAt: Timestamp.fromDate(itemData.createdAt),
        updatedAt: Timestamp.fromDate(itemData.updatedAt)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  // Items einer Liste abrufen
  static async getListItems(listId: string): Promise<TodoItem[]> {
    try {
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
      const batch = writeBatch(db);
      const itemRef = doc(db, this.COLLECTION, itemId);

      let targetCategoryId: string | undefined;

      if (completed) {
        // Item als erledigt markieren und in entsprechende Kategorie verschieben
        if (listType === 'shopping') {
          // Einkaufsliste: In "Erledigt"-Kategorie verschieben
          targetCategoryId = await CategoryService.createCompletedCategory(listId);
        } else if (listType === 'gifts') {
          // Geschenkeliste: In Benutzer-spezifische Kategorie verschieben
          targetCategoryId = await CategoryService.createUserCategory(listId, userId, userName);
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
      const completedItems = items.filter(item => item.completed).length;
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