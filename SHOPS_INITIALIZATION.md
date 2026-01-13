# Shops in Firestore initialisieren

## Option 1: Über Firebase Console (Empfohlen)

1. Gehe zu https://console.firebase.google.com
2. Wähle dein Projekt aus
3. Navigiere zu "Firestore Database"
4. Klicke auf "Start collection" (oder wähle die bestehende Collection aus)
5. Collection ID: `shops`

Lege folgende Dokumente an:

### Dokument 1: Aldi Nord
```
Felder:
- name: "aldi-nord" (string)
- displayName: "Aldi Nord" (string)
- category: "discount" (string)
- order: 1 (number)
- isActive: true (boolean)
- createdAt: [Klick auf "Set timestamp"]
- updatedAt: [Klick auf "Set timestamp"]
```

### Dokument 2: Aldi Süd
```
Felder:
- name: "aldi-sued" (string)
- displayName: "Aldi Süd" (string)
- category: "discount" (string)
- order: 2 (number)
- isActive: true (boolean)
- createdAt: [Klick auf "Set timestamp"]
- updatedAt: [Klick auf "Set timestamp"]
```

### Dokument 3: Lidl
```
Felder:
- name: "lidl" (string)
- displayName: "Lidl" (string)
- category: "discount" (string)
- order: 3 (number)
- isActive: true (boolean)
- createdAt: [Klick auf "Set timestamp"]
- updatedAt: [Klick auf "Set timestamp"]
```

### Dokument 4: REWE
```
Felder:
- name: "rewe" (string)
- displayName: "REWE" (string)
- category: "supermarket" (string)
- order: 4 (number)
- isActive: true (boolean)
- createdAt: [Klick auf "Set timestamp"]
- updatedAt: [Klick auf "Set timestamp"]
```

### Dokument 5: EDEKA
```
Felder:
- name: "edeka" (string)
- displayName: "EDEKA" (string)
- category: "supermarket" (string)
- order: 5 (number)
- isActive: true (boolean)
- createdAt: [Klick auf "Set timestamp"]
- updatedAt: [Klick auf "Set timestamp"]
```

## Option 2: Temporär die Firestore Rules anpassen

Falls du die Shops programmatisch anlegen möchtest, ändere temporär die Firestore Rules:

```javascript
// In firestore.rules - NUR TEMPORÄR!
match /shops/{shopId} {
  allow read: if isValidUser();
  allow write: if isValidUser(); // TEMPORÄR FÜR INITIALISIERUNG
}
```

Dann kannst du im Browser Console folgendes ausführen:

```javascript
import { ShopService } from './services/shopService';
await ShopService.initializeDefaultShops();
```

**WICHTIG: Danach SOFORT die Rules wieder auf `allow write: if false;` setzen!**

## Hinweis
Die Firestore Security Rules erlauben aktuell nur Lese-Zugriff auf die shops Collection von Client-Seite. Shops müssen über die Firebase Console oder über Firebase Admin SDK (Backend) angelegt werden.
