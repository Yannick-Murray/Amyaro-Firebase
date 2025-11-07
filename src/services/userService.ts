import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * User Service - Robust handling of user data including deleted users
 */
export class UserService {
  // Cache für User-Daten um wiederholte Firestore-Calls zu vermeiden
  private static userCache = new Map<string, any>();
  
  /**
   * Gets user display name with robust fallback for deleted users
   */
  static async getUserDisplayName(userId: string): Promise<string> {
    if (!userId) return 'Unbekannter Benutzer';
    
    // Cache check
    if (this.userCache.has(userId)) {
      const cachedUser = this.userCache.get(userId);
      return cachedUser?.displayName || cachedUser?.email || 'Unbekannter Benutzer';
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Cache successful result
        this.userCache.set(userId, userData);
        return userData.displayName || userData.email || 'Unbekannter Benutzer';
      } else {
        // User nicht gefunden - Cache das Ergebnis um wiederholte Calls zu vermeiden
        this.userCache.set(userId, null);
        return 'Unbekannter Benutzer';
      }
    } catch (error) {
      console.warn('Fehler beim Laden der Benutzerdaten:', userId, error);
      // Cache Fehler-Ergebnis
      this.userCache.set(userId, null);
      return 'Unbekannter Benutzer';
    }
  }
  
  /**
   * Gets user data with robust fallback
   */
  static async getUserData(userId: string): Promise<any | null> {
    if (!userId) return null;
    
    // Cache check
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId);
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = { id: userId, ...userDoc.data() };
        this.userCache.set(userId, userData);
        return userData;
      } else {
        this.userCache.set(userId, null);
        return null;
      }
    } catch (error) {
      console.warn('Fehler beim Laden der Benutzerdaten:', userId, error);
      this.userCache.set(userId, null);
      return null;
    }
  }
  
  /**
   * Batch load multiple users efficiently
   */
  static async getUsersDisplayNames(userIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const uncachedIds = userIds.filter(id => !this.userCache.has(id));
    
    // Load uncached users
    const promises = uncachedIds.map(async (userId) => {
      const displayName = await this.getUserDisplayName(userId);
      return { userId, displayName };
    });
    
    const loadedUsers = await Promise.all(promises);
    
    // Add to result map
    userIds.forEach(userId => {
      if (this.userCache.has(userId)) {
        const cachedUser = this.userCache.get(userId);
        result.set(userId, cachedUser?.displayName || cachedUser?.email || 'Unbekannter Benutzer');
      } else {
        const loaded = loadedUsers.find(u => u.userId === userId);
        result.set(userId, loaded?.displayName || 'Unbekannter Benutzer');
      }
    });
    
    return result;
  }
  
  /**
   * Clear cache for a specific user (useful after user updates)
   */
  static clearUserCache(userId: string): void {
    this.userCache.delete(userId);
  }
  
  /**
   * Clear entire user cache
   */
  static clearAllUserCache(): void {
    this.userCache.clear();
  }
  
  /**
   * Check if user exists (cached)
   */
  static async userExists(userId: string): Promise<boolean> {
    const userData = await this.getUserData(userId);
    return userData !== null;
  }
}