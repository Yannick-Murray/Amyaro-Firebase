/**
 * Statistics Service
 * Aggregiert und analysiert Daten aus geschlossenen Listen
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ListHistory } from '../types/todoList';

export interface ShopStatistics {
  shopName: string;
  totalSpent: number;
  purchaseCount: number;
  averagePrice: number;
  lastPurchase?: Date;
}

export interface TimelineEntry {
  listId: string;
  listName: string;
  shop: string;
  price: number;
  closedAt: Date;
  itemCount: number;
}

export interface OverallStatistics {
  totalSpent: number;
  totalPurchases: number;
  averagePerPurchase: number;
  mostExpensivePurchase: {
    listName: string;
    price: number;
    shop: string;
  } | null;
  cheapestPurchase: {
    listName: string;
    price: number;
    shop: string;
  } | null;
}

export type ListOwnership = 'all' | 'own' | 'shared';

export class StatisticsService {
  private static readonly HISTORY_COLLECTION = 'listHistory';

  /**
   * Lädt die History-Einträge für einen User aus Firestore
   */
  static async fetchHistory(
    currentUserId: string,
    ownership: ListOwnership = 'all'
  ): Promise<ListHistory[]> {
    try {
      let historyQuery;

      if (ownership === 'own') {
        // Nur eigene Listen
        historyQuery = query(
          collection(db, this.HISTORY_COLLECTION),
          where('userId', '==', currentUserId),
          orderBy('closedAt', 'desc')
        );
      } else if (ownership === 'shared') {
        // Nur geteilte Listen (wo User in sharedWith ist, aber nicht owner)
        historyQuery = query(
          collection(db, this.HISTORY_COLLECTION),
          where('sharedWith', 'array-contains', currentUserId),
          orderBy('closedAt', 'desc')
        );
      } else {
        // Alle Listen - eigene + geteilte
        // Da wir keine OR-Query machen können, müssen wir zwei Queries machen
        const ownQuery = query(
          collection(db, this.HISTORY_COLLECTION),
          where('userId', '==', currentUserId),
          orderBy('closedAt', 'desc')
        );
        
        const sharedQuery = query(
          collection(db, this.HISTORY_COLLECTION),
          where('sharedWith', 'array-contains', currentUserId),
          orderBy('closedAt', 'desc')
        );

        const [ownSnapshot, sharedSnapshot] = await Promise.all([
          getDocs(ownQuery),
          getDocs(sharedQuery)
        ]);

        const allDocs = [...ownSnapshot.docs, ...sharedSnapshot.docs];
        
        // Duplikate entfernen (falls ein User sowohl owner als auch in sharedWith ist)
        const uniqueDocs = Array.from(
          new Map(allDocs.map(doc => [doc.id, doc])).values()
        );

        return uniqueDocs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          closedAt: doc.data().closedAt
        } as ListHistory));
      }

      const snapshot = await getDocs(historyQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        closedAt: doc.data().closedAt
      } as ListHistory));
    } catch (error) {
      console.error('Fehler beim Laden der History:', error);
      return [];
    }
  }

  /**
   * Berechnet Statistiken pro Shop aus History
   */
  static calculateShopStatistics(history: ListHistory[]): ShopStatistics[] {
    const shopMap = new Map<string, {
      totalSpent: number;
      count: number;
      lastPurchase?: Date;
    }>();

    // Nur Einträge mit Preis und Shop
    const validHistory = history.filter(
      entry => entry.price !== undefined && 
               entry.price !== null &&
               entry.shop
    );

    validHistory.forEach(entry => {
      const shop = entry.shop!;
      const price = entry.price!;
      const closedAt = entry.closedAt 
        ? (typeof entry.closedAt === 'string' ? new Date(entry.closedAt) : entry.closedAt.toDate())
        : undefined;

      const existing = shopMap.get(shop);
      
      if (existing) {
        shopMap.set(shop, {
          totalSpent: existing.totalSpent + price,
          count: existing.count + 1,
          lastPurchase: closedAt && (!existing.lastPurchase || closedAt > existing.lastPurchase)
            ? closedAt
            : existing.lastPurchase
        });
      } else {
        shopMap.set(shop, {
          totalSpent: price,
          count: 1,
          lastPurchase: closedAt
        });
      }
    });

    // Zu Array konvertieren und sortieren nach totalSpent
    const result: ShopStatistics[] = Array.from(shopMap.entries()).map(([shop, data]) => ({
      shopName: shop,
      totalSpent: data.totalSpent,
      purchaseCount: data.count,
      averagePrice: data.totalSpent / data.count,
      lastPurchase: data.lastPurchase
    }));

    return result.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  /**
   * Erstellt eine Timeline aller Einkäufe aus History
   */
  static createTimeline(history: ListHistory[]): TimelineEntry[] {
    const validHistory = history.filter(
      entry => entry.price !== undefined && 
               entry.price !== null &&
               entry.shop &&
               entry.closedAt
    );

    const timeline: TimelineEntry[] = validHistory.map(entry => ({
      listId: entry.listId,
      listName: entry.listName,
      shop: entry.shop!,
      price: entry.price!,
      closedAt: typeof entry.closedAt === 'string' 
        ? new Date(entry.closedAt) 
        : entry.closedAt!.toDate(),
      itemCount: entry.itemCount
    }));

    // Sortieren nach Datum (neueste zuerst)
    return timeline.sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
  }

  /**
   * Berechnet Gesamt-Statistiken aus History
   */
  static calculateOverallStatistics(history: ListHistory[]): OverallStatistics {
    const validHistory = history.filter(
      entry => entry.price !== undefined && 
               entry.price !== null
    );

    if (validHistory.length === 0) {
      return {
        totalSpent: 0,
        totalPurchases: 0,
        averagePerPurchase: 0,
        mostExpensivePurchase: null,
        cheapestPurchase: null
      };
    }

    const totalSpent = validHistory.reduce((sum, entry) => sum + entry.price!, 0);
    const totalPurchases = validHistory.length;
    const averagePerPurchase = totalSpent / totalPurchases;

    // Teuerstes & günstigstes finden
    const sortedByPrice = [...validHistory].sort((a, b) => b.price! - a.price!);
    const mostExpensive = sortedByPrice[0];
    const cheapest = sortedByPrice[sortedByPrice.length - 1];

    return {
      totalSpent,
      totalPurchases,
      averagePerPurchase,
      mostExpensivePurchase: mostExpensive ? {
        listName: mostExpensive.listName,
        price: mostExpensive.price!,
        shop: mostExpensive.shop || 'Unbekannt'
      } : null,
      cheapestPurchase: cheapest ? {
        listName: cheapest.listName,
        price: cheapest.price!,
        shop: cheapest.shop || 'Unbekannt'
      } : null
    };
  }

  /**
   * Filtert Timeline nach Datum-Range
   */
  static filterTimelineByDateRange(
    timeline: TimelineEntry[],
    startDate?: Date,
    endDate?: Date
  ): TimelineEntry[] {
    let filtered = [...timeline];

    if (startDate) {
      filtered = filtered.filter(entry => entry.closedAt >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(entry => entry.closedAt <= endDate);
    }

    return filtered;
  }

  /**
   * Filtert Timeline nach Shop
   */
  static filterTimelineByShop(
    timeline: TimelineEntry[],
    shop: string
  ): TimelineEntry[] {
    return timeline.filter(entry => entry.shop === shop);
  }

  /**
   * Formatiert Preis für Anzeige
   */
  static formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',');
  }

  /**
   * Formatiert Datum für Anzeige
   */
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Formatiert Shop-Namen für Anzeige
   */
  static formatShopName(shopName: string): string {
    const shopMapping: { [key: string]: string } = {
      'aldi-nord': 'Aldi Nord',
      'aldi-sued': 'Aldi Süd',
      'lidl': 'Lidl',
      'rewe': 'REWE',
      'edeka': 'EDEKA',
      'kaufland': 'Kaufland',
      'penny': 'Penny',
      'netto': 'Netto'
    };
    
    return shopMapping[shopName.toLowerCase()] || shopName;
  }
}
