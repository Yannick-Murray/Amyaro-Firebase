/**
 * Utility für das Kombinieren von CSS-Klassen
 * Einfache Implementation ohne externe Dependencies
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}