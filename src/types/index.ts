// User-bezogene Typen
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
  createdAt: Date;
}

// Re-export core types from todoList.ts (single source of truth)
export type { 
  ListType, 
  List, 
  Item, 
  Category,
  ListShare 
} from './todoList';

// Aliases for backward compatibility
export type TodoList = import('./todoList').List;
export type TodoItem = import('./todoList').Item;

// Listen-Einladungen (zusätzlich zu ListShare)
export interface ListInvitation {
  id: string;
  listId: string;
  listName: string;
  fromUserId: string; // Wer hat eingeladen
  fromUserName: string; // Name des Einladenden
  toEmail: string; // Email des Eingeladenen
  toUserId?: string; // User-ID falls der User existiert
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  permission: 'read' | 'write';
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
}

// Auth Context Typen
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  refreshUserData: () => Promise<void>;
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
  type: import('./todoList').ListType;
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
  list: import('./todoList').List;
  totalItems: number;
  completedItems: number;
  categories: import('./todoList').Category[];
  isShared: boolean;
  isOwner: boolean;
  permission?: 'read' | 'write';
}

export interface CategoryWithItems {
  category: import('./todoList').Category;
  items: import('./todoList').Item[];
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