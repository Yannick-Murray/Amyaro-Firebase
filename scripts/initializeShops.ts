/**
 * Script zum Initialisieren der Standard-Shops in Firestore
 * 
 * Führe dieses Script einmalig aus um die Shops-Collection anzulegen:
 * npx tsx scripts/initializeShops.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase Config - aus deiner firebase.ts
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const defaultShops = [
  {
    name: 'aldi-nord',
    displayName: 'Aldi Nord',
    category: 'discount',
    order: 1,
    isActive: true
  },
  {
    name: 'aldi-sued',
    displayName: 'Aldi Süd',
    category: 'discount',
    order: 2,
    isActive: true
  },
  {
    name: 'lidl',
    displayName: 'Lidl',
    category: 'discount',
    order: 3,
    isActive: true
  },
  {
    name: 'rewe',
    displayName: 'REWE',
    category: 'supermarket',
    order: 4,
    isActive: true
  },
  {
    name: 'edeka',
    displayName: 'EDEKA',
    category: 'supermarket',
    order: 5,
    isActive: true
  }
];

async function initializeShops() {
  console.log('🔄 Initialisiere Shops...');
  
  try {
    for (const shop of defaultShops) {
      const shopRef = doc(collection(db, 'shops'));
      await setDoc(shopRef, {
        ...shop,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Shop "${shop.displayName}" erstellt`);
    }
    
    console.log('🎉 Alle Shops erfolgreich erstellt!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Shops:', error);
    process.exit(1);
  }
}

initializeShops();
