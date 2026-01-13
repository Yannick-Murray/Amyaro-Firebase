import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';
import type { Shop } from '../types/todoList';

// Shop Service
export class ShopService {
  private static readonly COLLECTION = 'shops';

  /**
   * Alle aktiven Shops abrufen, sortiert nach order
   */
  static async getShops(): Promise<Shop[]> {
    try {
      const shopsQuery = query(
        collection(db, this.COLLECTION),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      
      const snapshot = await getDocs(shopsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shop));
    } catch (error) {
      logger.error('Fehler beim Abrufen der Shops:', error);
      throw error;
    }
  }

  /**
   * Real-time Listener für Shops
   */
  static subscribeToShops(callback: (shops: Shop[]) => void): () => void {
    const shopsQuery = query(
      collection(db, this.COLLECTION),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    return onSnapshot(shopsQuery, (snapshot) => {
      const shops = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shop));
      callback(shops);
    });
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
}
