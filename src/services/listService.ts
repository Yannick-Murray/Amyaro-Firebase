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
import { db } from '../config/firebase';
import type { TodoList, Category, TodoItem, ListShare, ListType } from '../types';
import { generateId } from '../utils/helpers';

// TodoList Services
export class TodoListService {
  private static readonly COLLECTION = 'todoLists';

  // Liste erstellen
  static async createList(
    userId: string,
    title: string,
    type: ListType,
    description?: string,
    color: string = '#3b82f6'
  ): Promise<string> {
    try {
      const listData: Omit<TodoList, 'id'> = {
        title,
        description,
        type,
        color,
        userId,
        sharedWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        order: Date.now(),
        isDefault: false
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...listData,
        createdAt: Timestamp.fromDate(listData.createdAt),
        updatedAt: Timestamp.fromDate(listData.updatedAt)
      });

      // Standard-Kategorien erstellen (falls gewünscht)
      if (type === 'shopping') {
        await CategoryService.createDefaultShoppingCategories(docRef.id);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  }

  // Listen eines Benutzers abrufen
  static async getUserLists(userId: string): Promise<TodoList[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as TodoList));
    } catch (error) {
      console.error('Error getting user lists:', error);
      throw error;
    }
  }

  // Geteilte Listen abrufen
  static async getSharedLists(userId: string): Promise<TodoList[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('sharedWith', 'array-contains', userId),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as TodoList));
    } catch (error) {
      console.error('Error getting shared lists:', error);
      throw error;
    }
  }

  // Liste aktualisieren
  static async updateList(listId: string, updates: Partial<TodoList>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      await updateDoc(doc(db, this.COLLECTION, listId), updateData);
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  }

  // Liste löschen
  static async deleteList(listId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Liste löschen
      batch.delete(doc(db, this.COLLECTION, listId));

      // Alle zugehörigen Items löschen
      const itemsQuery = query(
        collection(db, 'todoItems'),
        where('listId', '==', listId)
      );
      const itemsSnapshot = await getDocs(itemsQuery);
      itemsSnapshot.docs.forEach(itemDoc => {
        batch.delete(itemDoc.ref);
      });

      // Alle zugehörigen Kategorien löschen
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('listId', '==', listId)
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      categoriesSnapshot.docs.forEach(categoryDoc => {
        batch.delete(categoryDoc.ref);
      });

      // Alle Sharing-Einträge löschen
      const sharesQuery = query(
        collection(db, 'listShares'),
        where('listId', '==', listId)
      );
      const sharesSnapshot = await getDocs(sharesQuery);
      sharesSnapshot.docs.forEach(shareDoc => {
        batch.delete(shareDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting list:', error);
      throw error;
    }
  }

  // Liste teilen
  static async shareList(
    listId: string,
    ownerId: string,
    targetUserEmail: string,
    permission: 'read' | 'write'
  ): Promise<void> {
    try {
      // Zielbenutzer anhand E-Mail finden
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', targetUserEmail)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        throw new Error('Benutzer mit dieser E-Mail-Adresse nicht gefunden');
      }

      const targetUserId = usersSnapshot.docs[0].id;

      // Prüfen ob bereits geteilt
      const existingShareQuery = query(
        collection(db, 'listShares'),
        where('listId', '==', listId),
        where('sharedWithId', '==', targetUserId)
      );
      const existingShareSnapshot = await getDocs(existingShareQuery);

      if (!existingShareSnapshot.empty) {
        throw new Error('Liste ist bereits mit diesem Benutzer geteilt');
      }

      const batch = writeBatch(db);

      // Share-Eintrag erstellen
      const shareData: Omit<ListShare, 'id'> = {
        listId,
        ownerId,
        sharedWithId: targetUserId,
        permission,
        sharedAt: new Date(),
        sharedBy: ownerId
      };

      const shareRef = doc(collection(db, 'listShares'));
      batch.set(shareRef, {
        ...shareData,
        sharedAt: Timestamp.fromDate(shareData.sharedAt)
      });

      // Liste aktualisieren: User zur sharedWith-Liste hinzufügen
      const listRef = doc(db, this.COLLECTION, listId);
      const listDoc = await getDoc(listRef);
      
      if (listDoc.exists()) {
        const currentSharedWith = listDoc.data().sharedWith || [];
        batch.update(listRef, {
          sharedWith: [...currentSharedWith, targetUserId],
          updatedAt: Timestamp.fromDate(new Date())
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error sharing list:', error);
      throw error;
    }
  }

  // Real-time Listener für Listen
  static subscribeToUserLists(
    userId: string,
    callback: (lists: TodoList[]) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('order', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as TodoList));
      
      callback(lists);
    });
  }
}

// Category Services
export class CategoryService {
  private static readonly COLLECTION = 'categories';

  // Kategorie erstellen
  static async createCategory(
    listId: string,
    name: string,
    color: string = '#6b7280',
    isSystem: boolean = false,
    createdBy?: string
  ): Promise<string> {
    try {
      const categoryData: Omit<Category, 'id'> = {
        listId,
        name,
        color,
        order: Date.now(),
        isSystem,
        createdBy,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...categoryData,
        createdAt: Timestamp.fromDate(categoryData.createdAt)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Standard-Kategorien für Einkaufslisten erstellen
  static async createDefaultShoppingCategories(listId: string): Promise<void> {
    const defaultCategories = [
      { name: 'Obst & Gemüse', color: '#10b981' },
      { name: 'Frischetheke', color: '#f59e0b' },
      { name: 'Tiefkühl', color: '#3b82f6' },
      { name: 'Getränke', color: '#8b5cf6' }
    ];

    try {
      const batch = writeBatch(db);

      defaultCategories.forEach((category, index) => {
        const categoryRef = doc(collection(db, this.COLLECTION));
        batch.set(categoryRef, {
          listId,
          name: category.name,
          color: category.color,
          order: index,
          isSystem: false,
          createdAt: Timestamp.fromDate(new Date())
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error creating default categories:', error);
      throw error;
    }
  }

  // Kategorien einer Liste abrufen
  static async getListCategories(listId: string): Promise<Category[]> {
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
        createdAt: doc.data().createdAt.toDate()
      } as Category));
    } catch (error) {
      console.error('Error getting list categories:', error);
      throw error;
    }
  }

  // "Erledigt"-Kategorie erstellen (falls nicht vorhanden)
  static async createCompletedCategory(listId: string): Promise<string> {
    try {
      // Prüfen ob bereits vorhanden
      const q = query(
        collection(db, this.COLLECTION),
        where('listId', '==', listId),
        where('name', '==', 'Erledigt'),
        where('isSystem', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }

      // Erstellen wenn nicht vorhanden
      return await this.createCategory(
        listId,
        'Erledigt',
        '#6b7280',
        true
      );
    } catch (error) {
      console.error('Error creating completed category:', error);
      throw error;
    }
  }

  // Benutzer-spezifische Kategorie erstellen (für Geschenkelisten)
  static async createUserCategory(
    listId: string,
    userId: string,
    userName: string
  ): Promise<string> {
    try {
      const categoryName = `Von ${userName}`;
      
      // Prüfen ob bereits vorhanden
      const q = query(
        collection(db, this.COLLECTION),
        where('listId', '==', listId),
        where('name', '==', categoryName),
        where('createdBy', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }

      // Erstellen wenn nicht vorhanden
      return await this.createCategory(
        listId,
        categoryName,
        '#3b82f6',
        true,
        userId
      );
    } catch (error) {
      console.error('Error creating user category:', error);
      throw error;
    }
  }
}