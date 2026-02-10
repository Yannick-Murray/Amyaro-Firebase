import type { Timestamp } from 'firebase/firestore';

// Type aliases
export type ListType = 'shopping' | 'gift';

// Re-export for backward compatibility
export type TodoList = List;
export type TodoItem = Item;

export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  listId?: string; // List-spezifische Kategorien
  type?: 'shopping' | 'gift'; // Optional für legacy support
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ListShare {
  id: string;
  listId: string;
  ownerId: string;
  sharedWithId: string;
  permission: 'read' | 'write';
  sharedAt: Timestamp;
  sharedBy: string;
}

export interface Shop {
  id: string;
  name: string;
  displayName: string; // z.B. "Aldi Süd", "Lidl"
  category?: string; // z.B. "Supermarkt", "Discounter"
  order: number; // Sortierung
  isActive: boolean; // Für zukünftige Deaktivierung
  userId?: string; // undefined/null = global shop, populated = user-specific shop
  type?: 'global' | 'user'; // Type for easier filtering
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface List {
  id: string;
  name: string;
  description?: string;
  type: 'shopping' | 'gift';
  userId: string;
  category?: Category;
  categoryId?: string;
  isPrivate: boolean;
  isClosed?: boolean; // Liste ist abgeschlossen (nur für shopping lists)
  closedAt?: Timestamp; // Zeitpunkt des Abschließens
  destination?: string; // Einkaufsort/Shop (z.B. "Aldi Süd")
  price?: number; // Gesamtpreis der Liste
  sharedWith?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  itemCount?: {
    total: number;
    completed: number;
  };
}

export interface Item {
  id: string;
  listId: string;
  name: string;
  description?: string;
  quantity?: number;
  price?: number; // Einzelpreis des Items (wird später verwendet)
  link?: string;
  categoryId?: string;
  category?: string;
  destination?: string; // Einkaufsort/Shop wo das Item gekauft wurde
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Timestamp;
  assignedTo?: string; // Für Geschenkelisten - wem ist das Geschenk zugewiesen
  notes?: string; // Zusätzliche Notizen
  createdAt: Timestamp;
  updatedAt: Timestamp;
  order: number;
}

export interface ListHistory {
  id: string;
  listId: string; // Referenz zur ursprünglichen Liste
  listName: string; // Name der Liste zum Zeitpunkt des Schließens
  userId: string; // Der User, der die Liste geschlossen hat
  shop?: string; // Einkaufsort/Shop
  price?: number; // Gesamtpreis
  itemCount: number; // Anzahl der abgehakten Items
  closedAt: Timestamp; // Zeitpunkt des Schließens
  sharedWith?: string[]; // Wer hatte Zugriff auf die Liste
}