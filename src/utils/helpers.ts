import { v4 as uuidv4 } from 'uuid';

// ID-Generierung
export const generateId = (): string => uuidv4();

// 🔒 SECURITY: Smart Input Sanitization (keeps normal punctuation)
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove ONLY dangerous HTML/script constructs
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags with content
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object tags  
    .replace(/<embed[^>]*>/gi, '') // Remove embed tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data: html protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/eval\s*\(/gi, '') // Remove eval( calls
    .replace(/expression\s*\(/gi, '') // Remove CSS expression
    .substring(0, 1000); // Max length protection
};

export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>\"']/g, '')
    .substring(0, 254); // RFC limit
};

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

// Enhanced Email Validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
};

// Enhanced Password Validation with Security Requirements
export const isValidPassword = (password: string): boolean => {
  // Minimum 8 characters
  if (password.length < 8) return false;
  
  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Must contain at least one number
  if (!/\d/.test(password)) return false;
  
  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  
  return true;
};

// Password strength indicator
export const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  
  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
  if (/123456|654321|qwerty|password|admin/.test(password.toLowerCase())) score--; // Common passwords
  
  if (score <= 2) return { score, label: 'Schwach', color: 'danger' };
  if (score <= 4) return { score, label: 'Mittel', color: 'warning' };
  return { score, label: 'Stark', color: 'success' };
};

// Validate password requirements with detailed feedback
export const validatePasswordRequirements = (password: string): { 
  isValid: boolean; 
  requirements: Array<{ met: boolean; text: string }> 
} => {
  const requirements = [
    { met: password.length >= 8, text: 'Mindestens 8 Zeichen' },
    { met: /[A-Z]/.test(password), text: 'Mindestens 1 Großbuchstabe' },
    { met: /[a-z]/.test(password), text: 'Mindestens 1 Kleinbuchstabe' },
    { met: /\d/.test(password), text: 'Mindestens 1 Zahl' },
    { met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: 'Mindestens 1 Sonderzeichen' }
  ];
  
  const isValid = requirements.every(req => req.met);
  return { isValid, requirements };
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