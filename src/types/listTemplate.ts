import type { Timestamp } from 'firebase/firestore';

/**
 * Grenzwerte für Vorlagen. Kategorien und Artikel liegen als Arrays im selben
 * Dokument, daher halten diese Limits das Dokument sicher unter dem 1-MB-Limit
 * von Firestore. Die Werte werden zusätzlich in den Security Rules erzwungen.
 */
export const TEMPLATE_LIMITS = {
  MAX_TEMPLATES_PER_USER: 20,
  MAX_CATEGORIES: 50,
  MAX_ITEMS: 300,
  MAX_NAME_LENGTH: 100
} as const;

export interface ListTemplateCategory {
  name: string;
  color: string;
  order: number;
}

export interface ListTemplateItem {
  name: string;
  quantity: number;
  /**
   * Verweist über den Namen statt über eine ID auf die Kategorie, da beim
   * Anwenden einer Vorlage immer neue Kategorie-Dokumente entstehen.
   */
  categoryName?: string;
  order: number;
}

export interface ListTemplate {
  id: string;
  userId: string;
  name: string;
  type: 'shopping';
  categories: ListTemplateCategory[];
  items: ListTemplateItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
