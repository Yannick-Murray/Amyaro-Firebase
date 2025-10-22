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

export interface List {
  id: string;
  name: string;
  description?: string;
  type: 'shopping' | 'gift';
  userId: string;
  category?: Category;
  categoryId?: string;
  isPrivate: boolean;
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
  price?: number;
  link?: string;
  categoryId?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  order: number;
}