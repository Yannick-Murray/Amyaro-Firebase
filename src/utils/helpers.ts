import { v4 as uuidv4 } from 'uuid';

// ID-Generierung
export const generateId = (): string => uuidv4();

// 🔒 SECURITY: Enhanced Input Sanitization with XSS Protection
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove ALL HTML tags for maximum security
    .replace(/<[^>]*>/gi, '') // Remove all HTML tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags with content
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object tags  
    .replace(/<embed[^>]*>/gi, '') // Remove embed tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data: html protocol
    .replace(/data:application\/javascript/gi, '') // Remove data: js protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/eval\s*\(/gi, '') // Remove eval( calls
    .replace(/expression\s*\(/gi, '') // Remove CSS expression
    .replace(/Function\s*\(/gi, '') // Remove Function( calls
    .replace(/setTimeout\s*\(/gi, '') // Remove setTimeout calls
    .replace(/setInterval\s*\(/gi, '') // Remove setInterval calls
    .replace(/\\u[0-9a-fA-F]{4}/gi, '') // Remove unicode escape sequences
    .replace(/\\x[0-9a-fA-F]{2}/gi, '') // Remove hex escape sequences
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .substring(0, 1000); // Max length protection
};

// 🔒 SECURITY: Specific validation for URLs with enhanced security
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  const sanitized = url.trim();
  
  // Only allow http and https protocols
  if (!/^https?:\/\//i.test(sanitized)) {
    return '';
  }
  
  // Remove dangerous patterns
  return sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/file:/gi, '')
    .replace(/ftp:/gi, '')
    .substring(0, 2000); // URLs can be longer
};

// 🔒 SECURITY: Validate text input with content filtering
export const validateTextInput = (input: string, maxLength: number = 1000): { isValid: boolean; error?: string } => {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Eingabe muss ein Text sein' };
  }
  
  const trimmed = input.trim();
  
  // Check length
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Text darf maximal ${maxLength} Zeichen haben` };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, error: 'Eingabe enthält nicht erlaubte Zeichen oder Code' };
    }
  }
  
  return { isValid: true };
};

// 🔒 SECURITY: Validate price input
export const validatePrice = (priceStr: string): { isValid: boolean; value?: number; error?: string } => {
  if (!priceStr || priceStr.trim() === '') {
    return { isValid: true, value: undefined };
  }
  
  const price = parseFloat(priceStr);
  
  if (isNaN(price)) {
    return { isValid: false, error: 'Preis muss eine gültige Zahl sein' };
  }
  
  if (price < 0) {
    return { isValid: false, error: 'Preis darf nicht negativ sein' };
  }
  
  if (price > 99999) {
    return { isValid: false, error: 'Preis darf nicht größer als 99.999 € sein' };
  }
  
  // Check for reasonable decimal places
  const decimalPlaces = (priceStr.split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Preis darf maximal 2 Nachkommastellen haben' };
  }
  
  return { isValid: true, value: price };
};

// 🔒 SECURITY: Validate quantity input  
export const validateQuantity = (quantityStr: string | number): { isValid: boolean; value?: number; error?: string } => {
  const quantity = typeof quantityStr === 'string' ? parseInt(quantityStr) : quantityStr;
  
  if (isNaN(quantity)) {
    return { isValid: false, error: 'Menge muss eine ganze Zahl sein' };
  }
  
  if (quantity < 1) {
    return { isValid: false, error: 'Menge muss mindestens 1 sein' };
  }
  
  if (quantity > 999) {
    return { isValid: false, error: 'Menge darf nicht größer als 999 sein' };
  }
  
  if (!Number.isInteger(quantity)) {
    return { isValid: false, error: 'Menge muss eine ganze Zahl sein' };
  }
  
  return { isValid: true, value: quantity };
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
export const getListTypeLabel = (type: 'shopping' | 'gift'): string => {
  switch (type) {
    case 'shopping':
      return 'Einkaufsliste';
    case 'gift':
      return 'Geschenkeliste';
    default:
      return 'Unbekannt';
  }
};

export const getListTypeIcon = (type: 'shopping' | 'gift'): string => {
  switch (type) {
    case 'shopping':
      return '🛒';
    case 'gift':
      return '🎁';
    default:
      return '📝';
  }
};

// Währungs-Formatierung
export const formatPrice = (price: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency
  }).format(price);
};

// 🔒 SECURITY: Enhanced URL Validation with Security Checks
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Block localhost and internal IPs for security
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
      return false;
    }
    
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