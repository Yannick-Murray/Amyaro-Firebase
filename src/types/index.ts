// User-bezogene Typen
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

// Listen-Typen
export type ListType = 'shopping' | 'gifts';

export interface TodoList {
  id: string;
  title: string;
  description?: string;
  type: ListType; // 'shopping' oder 'gifts'
  color: string;
  userId: string; // Ersteller der Liste
  sharedWith: string[]; // Array von User-IDs, mit denen die Liste geteilt wird
  createdAt: Date;
  updatedAt: Date;
  order: number;
  isDefault: boolean;
}

// Kategorie-Typen
export interface Category {
  id: string;
  listId: string;
  name: string;
  color: string;
  order: number;
  isSystem: boolean; // true für "Erledigt" oder Benutzer-Kategorien
  createdBy?: string; // User-ID falls es eine Benutzer-spezifische Kategorie ist (z.B. "Von Max")
  createdAt: Date;
}

// Item-Typen (vereinfacht für bessere UX)
export interface Item {
  id: string;
  listId: string;
  name: string;
  quantity: number; // 1-9, 0 = löschen
  completed: boolean;
  completedBy?: string; // User-ID der Person, die das Item abgehakt hat
  completedAt?: Date;
  createdBy: string; // User-ID
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

// Legacy support - wird schrittweise ersetzt
export interface TodoItem extends Item {
  title: string; // Alias für name
  description?: string;
  categoryId?: string;
  
  // Alte Felder - werden entfernt
  unit?: string;
  price?: number;
  currency?: string;
  productUrl?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Listen-Sharing
export interface ListShare {
  id: string;
  listId: string;
  ownerId: string; // Besitzer der Liste
  sharedWithId: string; // User-ID mit dem geteilt wird
  permission: 'read' | 'write'; // Lese- oder Schreibberechtigung
  sharedAt: Date;
  sharedBy: string; // User-ID der Person, die geteilt hat
}

// Auth Context Typen
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Firestore Collection Typen
export interface FirestoreCollections {
  users: 'users';
  todoLists: 'todoLists';
  todoItems: 'todoItems';
  categories: 'categories';
  listShares: 'listShares';
}

// Form-bezogene Typen
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export interface TodoListFormData {
  title: string;
  description?: string;
  type: ListType;
  color: string;
}

export interface CategoryFormData {
  name: string;
  color: string;
}

// Einkaufslisten-Item Form
export interface ShoppingItemFormData {
  title: string;
  description?: string;
  quantity?: number;
  unit?: string;
}

// Geschenkelisten-Item Form
export interface GiftItemFormData {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  productUrl?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Listen-Sharing Form
export interface ShareListFormData {
  email: string;
  permission: 'read' | 'write';
}

// View-Models für UI
export interface ListWithStats {
  list: TodoList;
  totalItems: number;
  completedItems: number;
  categories: Category[];
  isShared: boolean;
  isOwner: boolean;
  permission?: 'read' | 'write';
}

export interface CategoryWithItems {
  category: Category;
  items: TodoItem[];
}

// Statistik-Typen
export interface ListStatistics {
  totalLists: number;
  shoppingLists: number;
  giftLists: number;
  sharedLists: number;
  totalItems: number;
  completedItems: number;
  completionRate: number;
}