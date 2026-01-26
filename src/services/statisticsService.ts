/**
 * Statistics Service
 * Aggregiert und analysiert Daten aus geschlossenen Listen
 */

import type { List } from '../types/todoList';

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
  /**
   * Filtert Listen basierend auf Ownership
   */
  static filterListsByOwnership(
    lists: List[],
    currentUserId: string,
    ownership: ListOwnership
  ): List[] {
    if (ownership === 'all') {
      return lists;
    }
    
    if (ownership === 'own') {
      // Nur eigene Listen (User ist der Ersteller)
      return lists.filter(list => list.userId === currentUserId);
    }
    
    if (ownership === 'shared') {
      // Nur geteilte Listen (User ist NICHT der Ersteller, aber hat Zugriff)
      return lists.filter(
        list => list.userId !== currentUserId && 
                list.sharedWith?.includes(currentUserId)
      );
    }
    
    return lists;
  }

  /**
   * Berechnet Statistiken pro Shop
   */
  static calculateShopStatistics(lists: List[]): ShopStatistics[] {
    const shopMap = new Map<string, {
      totalSpent: number;
      count: number;
      lastPurchase?: Date;
    }>();

    // Nur geschlossene Listen mit Preis und Shop
    const closedLists = lists.filter(
      list => list.isClosed && 
              list.price !== undefined && 
              list.price !== null &&
              list.destination
    );

    closedLists.forEach(list => {
      const shop = list.destination!;
      const price = list.price!;
      const closedAt = list.closedAt 
        ? (typeof list.closedAt === 'string' ? new Date(list.closedAt) : list.closedAt.toDate())
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
   * Erstellt eine Timeline aller Einkäufe
   */
  static createTimeline(lists: List[]): TimelineEntry[] {
    const closedLists = lists.filter(
      list => list.isClosed && 
              list.price !== undefined && 
              list.price !== null &&
              list.destination &&
              list.closedAt
    );

    const timeline: TimelineEntry[] = closedLists.map(list => ({
      listId: list.id,
      listName: list.name,
      shop: list.destination!,
      price: list.price!,
      closedAt: typeof list.closedAt === 'string' 
        ? new Date(list.closedAt) 
        : list.closedAt!.toDate(),
      itemCount: list.itemCount?.completed || 0
    }));

    // Sortieren nach Datum (neueste zuerst)
    return timeline.sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
  }

  /**
   * Berechnet Gesamt-Statistiken
   */
  static calculateOverallStatistics(lists: List[]): OverallStatistics {
    const closedLists = lists.filter(
      list => list.isClosed && 
              list.price !== undefined && 
              list.price !== null
    );

    if (closedLists.length === 0) {
      return {
        totalSpent: 0,
        totalPurchases: 0,
        averagePerPurchase: 0,
        mostExpensivePurchase: null,
        cheapestPurchase: null
      };
    }

    const totalSpent = closedLists.reduce((sum, list) => sum + list.price!, 0);
    const totalPurchases = closedLists.length;
    const averagePerPurchase = totalSpent / totalPurchases;

    // Teuerstes & günstigstes finden
    const sortedByPrice = [...closedLists].sort((a, b) => b.price! - a.price!);
    const mostExpensive = sortedByPrice[0];
    const cheapest = sortedByPrice[sortedByPrice.length - 1];

    return {
      totalSpent,
      totalPurchases,
      averagePerPurchase,
      mostExpensivePurchase: mostExpensive ? {
        listName: mostExpensive.name,
        price: mostExpensive.price!,
        shop: mostExpensive.destination || 'Unbekannt'
      } : null,
      cheapestPurchase: cheapest ? {
        listName: cheapest.name,
        price: cheapest.price!,
        shop: cheapest.destination || 'Unbekannt'
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
