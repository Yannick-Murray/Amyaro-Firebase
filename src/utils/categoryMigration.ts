import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Migration Script: Fügt userId zu bestehenden Categories hinzu
 * Einmalig ausführen um alte Categories zu reparieren
 */
export class CategoryMigration {
  
  static async migrateCategoriesToIncludeUserId(currentUserId: string): Promise<void> {
    try {
      console.log('🔄 Starting category migration...');
      
      // 1. Finde alle Categories ohne userId
      const categoriesQuery = query(collection(db, 'categories'));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      
      let migratedCount = 0;
      let skippedCount = 0;
      
      for (const categoryDoc of categoriesSnapshot.docs) {
        const categoryData = categoryDoc.data();
        
        // Skip wenn bereits userId vorhanden
        if (categoryData.userId) {
          skippedCount++;
          continue;
        }
        
        // Finde die zugehörige Liste um den Owner zu ermitteln
        const listQuery = query(
          collection(db, 'lists'),
          where('__name__', '==', categoryData.listId)
        );
        const listSnapshot = await getDocs(listQuery);
        
        if (listSnapshot.empty) {
          console.warn(`⚠️ Category ${categoryDoc.id} has invalid listId: ${categoryData.listId}`);
          continue;
        }
        
        const listData = listSnapshot.docs[0].data();
        const listOwner = listData.userId;
        
        // Update Category mit userId
        await updateDoc(doc(db, 'categories', categoryDoc.id), {
          userId: listOwner,
          updatedAt: new Date()
        });
        
        console.log(`✅ Migrated category: ${categoryDoc.id} → userId: ${listOwner}`);
        migratedCount++;
      }
      
      console.log(`🎉 Migration completed!`);
      console.log(`   - Migrated: ${migratedCount} categories`);
      console.log(`   - Skipped: ${skippedCount} categories (already had userId)`);
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Einfachere Alternative: Setze alle Categories des aktuellen Users
   */
  static async setUserIdForMyCategories(currentUserId: string): Promise<void> {
    try {
      console.log('🔄 Setting userId for current user categories...');
      
      // Finde alle Listen des aktuellen Users
      const myListsQuery = query(
        collection(db, 'lists'),
        where('userId', '==', currentUserId)
      );
      const myListsSnapshot = await getDocs(myListsQuery);
      const myListIds = myListsSnapshot.docs.map(doc => doc.id);
      
      console.log(`📋 Found ${myListIds.length} lists owned by current user`);
      
      // Finde alle Categories zu diesen Listen
      const categoriesQuery = query(collection(db, 'categories'));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      
      let updatedCount = 0;
      
      for (const categoryDoc of categoriesSnapshot.docs) {
        const categoryData = categoryDoc.data();
        
        // Skip wenn nicht zu meinen Listen gehört
        if (!myListIds.includes(categoryData.listId)) {
          continue;
        }
        
        // Skip wenn bereits userId vorhanden
        if (categoryData.userId) {
          continue;
        }
        
        // Update mit meiner userId
        await updateDoc(doc(db, 'categories', categoryDoc.id), {
          userId: currentUserId,
          updatedAt: new Date()
        });
        
        console.log(`✅ Updated category: ${categoryData.name} → userId: ${currentUserId}`);
        updatedCount++;
      }
      
      console.log(`🎉 Updated ${updatedCount} categories with userId`);
      
    } catch (error) {
      console.error('❌ Failed to update categories:', error);
      throw error;
    }
  }
}