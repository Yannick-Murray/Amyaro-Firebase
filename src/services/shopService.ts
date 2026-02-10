import {
  collection,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logger } from '../utils/logger';
import type { Shop } from '../types/todoList';

// Shop Service
export class ShopService {
  private static readonly COLLECTION = 'shops';

  /**
   * Alle aktiven Shops abrufen (global + benutzerspezifisch), sortiert nach order
   */
  static async getShops(): Promise<Shop[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User muss angemeldet sein');
      }

      // Query für globale Shops (ohne userId)
      const globalShopsQuery = query(
        collection(db, this.COLLECTION),
        where('isActive', '==', true),
        where('userId', '==', null)
      );

      // Query für benutzerspezifische Shops
      const userShopsQuery = query(
        collection(db, this.COLLECTION),
        where('isActive', '==', true),
        where('userId', '==', userId)
      );

      const [globalSnapshot, userSnapshot] = await Promise.all([
        getDocs(globalShopsQuery),
        getDocs(userShopsQuery)
      ]);

      const globalShops = globalSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shop));

      const userShops = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shop));

      // Kombinieren und sortieren
      const allShops = [...globalShops, ...userShops];
      return allShops.sort((a, b) => a.order - b.order);
    } catch (error) {
      logger.error('Fehler beim Abrufen der Shops:', error);
      throw error;
    }
  }

  /**
   * Real-time Listener für Shops (global + benutzerspezifisch)
   */
  static subscribeToShops(callback: (shops: Shop[]) => void): () => void {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      logger.error('User muss angemeldet sein für Shop-Subscription');
      return () => {};
    }

    const globalShopsQuery = query(
      collection(db, this.COLLECTION),
      where('isActive', '==', true),
      where('userId', '==', null)
    );

    const userShopsQuery = query(
      collection(db, this.COLLECTION),
      where('isActive', '==', true),
      where('userId', '==', userId)
    );

    let globalShops: Shop[] = [];
    let userShops: Shop[] = [];

    const updateCallback = () => {
      const allShops = [...globalShops, ...userShops];
      allShops.sort((a, b) => a.order - b.order);
      callback(allShops);
    };

    const unsubscribeGlobal = onSnapshot(globalShopsQuery, (snapshot) => {
      globalShops = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shop));
      updateCallback();
    });

    const unsubscribeUser = onSnapshot(userShopsQuery, (snapshot) => {
      userShops = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shop));
      updateCallback();
    });

    return () => {
      unsubscribeGlobal();
      unsubscribeUser();
    };
  }

  /**
   * Standard-Shops initialisieren (nur für Admin-Verwendung)
   * Diese Methode sollte nicht vom Client aufgerufen werden
   */
  static async initializeDefaultShops(): Promise<void> {
    try {
      const defaultShops = [
        {
          name: 'aldi-nord',
          displayName: 'Aldi Nord',
          category: 'discount',
          order: 1,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          name: 'aldi-sued',
          displayName: 'Aldi Süd',
          category: 'discount',
          order: 2,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          name: 'lidl',
          displayName: 'Lidl',
          category: 'discount',
          order: 3,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      const batch = writeBatch(db);
      defaultShops.forEach(shop => {
        const shopRef = doc(collection(db, this.COLLECTION));
        batch.set(shopRef, shop);
      });

      await batch.commit();
      logger.log('Standard-Shops wurden initialisiert');
    } catch (error) {
      logger.error('Fehler beim Initialisieren der Standard-Shops:', error);
      throw error;
    }
  }

  /**
   * Nur benutzerspezifische Shops abrufen
   */
  static async getUserShops(): Promise<Shop[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User muss angemeldet sein');
      }

      const userShopsQuery = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(userShopsQuery);
      const shops = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shop));
      
      // Sort in JavaScript to avoid composite index requirement
      return shops.sort((a, b) => a.order - b.order);
    } catch (error) {
      logger.error('Fehler beim Abrufen der User-Shops:', error);
      throw error;
    }
  }

  /**
   * Prüft ob ein Shop mit dem Namen bereits existiert
   */
  static async shopExists(name: string): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return false;

      const normalizedName = name.toLowerCase().trim();

      // Prüfe globale Shops
      const globalQuery = query(
        collection(db, this.COLLECTION),
        where('name', '==', normalizedName),
        where('userId', '==', null)
      );

      // Prüfe User-Shops
      const userQuery = query(
        collection(db, this.COLLECTION),
        where('name', '==', normalizedName),
        where('userId', '==', userId)
      );

      const [globalSnapshot, userSnapshot] = await Promise.all([
        getDocs(globalQuery),
        getDocs(userQuery)
      ]);

      return !globalSnapshot.empty || !userSnapshot.empty;
    } catch (error) {
      logger.error('Fehler beim Prüfen der Shop-Existenz:', error);
      return false;
    }
  }

  /**
   * Erstellt einen neuen benutzerspezifischen Shop
   */
  static async createUserShop(
    displayName: string,
    category?: string
  ): Promise<string> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User muss angemeldet sein');
      }

      // Generiere technischen Namen aus displayName
      const name = displayName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Entferne Sonderzeichen
        .replace(/\s+/g, '-') // Ersetze Leerzeichen mit Bindestrichen
        .replace(/-+/g, '-'); // Entferne doppelte Bindestriche

      // Prüfe ob Shop bereits existiert
      const exists = await this.shopExists(name);
      if (exists) {
        throw new Error('Ein Shop mit diesem Namen existiert bereits');
      }

      // Hole aktuelle User-Shops um order zu bestimmen
      const userShops = await this.getUserShops();
      const maxOrder = userShops.reduce((max, shop) => Math.max(max, shop.order), 100);

      const shopData = {
        name,
        displayName: displayName.trim(),
        category: category || undefined,
        order: maxOrder + 1,
        isActive: true,
        userId,
        type: 'user' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), shopData);
      logger.log('User-Shop erstellt:', docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error('Fehler beim Erstellen des User-Shops:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert einen benutzerspezifischen Shop
   */
  static async updateUserShop(
    shopId: string,
    updates: Partial<Pick<Shop, 'displayName' | 'category' | 'order'>>
  ): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User muss angemeldet sein');
      }

      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Falls displayName geändert wird, auch name aktualisieren
      if (updates.displayName) {
        updateData.name = updates.displayName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }

      await updateDoc(doc(db, this.COLLECTION, shopId), updateData);
      logger.log('User-Shop aktualisiert:', shopId);
    } catch (error) {
      logger.error('Fehler beim Aktualisieren des User-Shops:', error);
      throw error;
    }
  }

  /**
   * Löscht einen benutzerspezifischen Shop (soft delete)
   */
  static async deleteUserShop(shopId: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User muss angemeldet sein');
      }

      // Soft delete durch setzen von isActive = false
      await updateDoc(doc(db, this.COLLECTION, shopId), {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      logger.log('User-Shop gelöscht (soft delete):', shopId);
    } catch (error) {
      logger.error('Fehler beim Löschen des User-Shops:', error);
      throw error;
    }
  }
}
