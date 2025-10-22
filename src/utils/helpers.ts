import { v4 as uuidv4 } from 'uuid';

// ID-Generierung
export const generateId = (): string => uuidv4();

// Datum Formatierung
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Prioritäts-Mapping
export const getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
  switch (priority) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'secondary';
  }
};

export const getPriorityLabel = (priority: 'low' | 'medium' | 'high'): string => {
  switch (priority) {
    case 'high':
      return 'Hoch';
    case 'medium':
      return 'Mittel';
    case 'low':
      return 'Niedrig';
    default:
      return 'Unbekannt';
  }
};

// Validierungen
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Array Helpers
export const reorderArray = <T>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Listen-Typ Helpers
export const getListTypeLabel = (type: 'shopping' | 'gifts'): string => {
  switch (type) {
    case 'shopping':
      return 'Einkaufsliste';
    case 'gifts':
      return 'Geschenkeliste';
    default:
      return 'Unbekannt';
  }
};

export const getListTypeIcon = (type: 'shopping' | 'gifts'): string => {
  switch (type) {
    case 'shopping':
      return 'bi-cart';
    case 'gifts':
      return 'bi-gift';
    default:
      return 'bi-list';
  }
};

// Währungs-Formatierung
export const formatPrice = (price: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency
  }).format(price);
};

// URL-Validierung
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Quantity + Unit Formatierung
export const formatQuantity = (quantity?: number, unit?: string): string => {
  if (!quantity) return '';
  if (!unit) return quantity.toString();
  return `${quantity} ${unit}`;
};

// Kategorie-Farben
export const getCategoryColors = (): string[] => {
  return [
    '#3b82f6', // Blau
    '#10b981', // Grün
    '#f59e0b', // Orange
    '#ef4444', // Rot
    '#8b5cf6', // Lila
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#ec4899', // Pink
    '#6b7280'  // Grau
  ];
};

// Local Storage Helpers
export const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};