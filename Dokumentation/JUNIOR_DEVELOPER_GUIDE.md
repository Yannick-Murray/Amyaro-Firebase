# 🎓 Junior Developer Guide - Amyaro Firebase

> **Eine komplette Einführung in das Amyaro Firebase Projekt für Junior-Entwickler**
> 
> **Version:** 2.1 | **Stand:** März 2026 | **Zielgruppe:** Junior Developer & Praktikanten

## 📋 Inhaltsverzeichnis

1. [Was ist Amyaro?](#was-ist-amyaro)
2. [Technologie-Stack verstehen](#technologie-stack-verstehen)
3. [Projekt-Struktur](#projekt-struktur)
4. [Neue Features & Konzepte](#neue-features--konzepte)
5. [Wichtige Konzepte](#wichtige-konzepte)
6. [Code-Aufbau verstehen](#code-aufbau-verstehen)
7. [Firebase Integration](#firebase-integration)
8. [React Patterns in diesem Projekt](#react-patterns-in-diesem-projekt)
9. [Listen-Sharing & Collaboration](#listen-sharing--collaboration)
10. [Price Tracking System](#price-tracking-system)
11. [Häufige Entwickler-Aufgaben](#häufige-entwickler-aufgaben)
12. [Best Practices & Code Style](#best-practices--code-style)
13. [Testing & Debugging](#testing--debugging)

---

## 🎯 Was ist Amyaro?

**Amyaro** ist eine moderne, kollaborative Web-Anwendung für **Einkaufslisten und Geschenkelisten** mit erweiterten Features für Haushaltsverwaltung und Preisanalyse.

### Hauptfunktionen:

#### 📝 Listen-Management
- **Einkaufslisten** mit intelligenter Kategorisierung
- **Geschenkelisten** für Geburtstage, Weihnachten, etc.
- **Drag & Drop** für intuitive Organisation
- **Kategorien** für bessere Strukturierung
- **Geschlossene Listen** zur Archivierung

#### 👥 Collaboration Features
- **Listen teilen** mit Familie und Freunden
- **Einladungssystem** via E-Mail
- **Echtzeit-Synchronisation** zwischen Nutzern
- **Permissions-System** (Lese-/Schreibrechte)
- **Multi-User Assignments** für Items

#### 💰 Price Tracking (NEU!)
- **Preiserfassung** beim Abschließen von Listen
- **Shop-Verwaltung** (Aldi, REWE, EDEKA, etc.)
- **Preisvergleiche** zwischen Läden
- **Budget-Tracking** für geschlossene Listen
- **"Ungefähr"-Indikator** bei nachträglichen Änderungen

#### 📱 Mobile-First Design
- **Responsive Design** für alle Bildschirmgrößen
- **Touch-optimiert** für Smartphones
- **Swipe-Gesten** für schnelle Aktionen
- **Progressive Web App** (PWA-Ready)

### Warum ist es besonders?
- ✅ **Offline-fähig** - funktioniert auch ohne Internet
- ✅ **Kollaborativ** - mehrere Personen gleichzeitig
- ✅ **Intuitive Bedienung** - auch für Nicht-Techies
- ✅ **Kostenlos** - keine Subscriptions oder In-App-Käufe
- ✅ **Datenschutz** - eigene Firebase-Instanz, keine Drittanbieter

---

## 🛠️ Technologie-Stack verstehen

### Frontend (Das was der User sieht):
```
React 18 + TypeScript
├── Vite (Build-Tool, schneller als Webpack)
├── Bootstrap 5 (CSS Framework)
├── React Router v6 (Navigation zwischen Seiten)
├── @dnd-kit (Drag & Drop für Kategorien/Items)
└── Logger Utility (Custom Debug-System)
```

### Backend & Datenbank:
```
Firebase (Google's Backend-as-a-Service)
├── Authentication (Email/Password + Email-Verification)
├── Firestore (NoSQL Real-time Database)
├── Hosting (CDN + Web-Server)
├── Security Rules (Zugriffssteuerung)
└── Composite Indexes (Performance-Optimierung)
```

### Development Tools:
```
Development Environment
├── ESLint (Code-Qualität)
├── TypeScript (Type Safety)
├── Vite Dev Server (Hot Module Replacement)
└── Git (Version Control)
```

### Warum diese Technologien?

**React + TypeScript**: 
- React = Moderne UI-Bibliothek mit komponentenbasiertem Ansatz
- TypeScript = JavaScript mit Typen → weniger Bugs, bessere IDE-Unterstützung
- Große Community, viele Libraries verfügbar

**Firebase**:
- ✅ Kein eigener Server nötig
- ✅ Real-time Database (Änderungen sofort bei allen Nutzern)
- ✅ Automatische Skalierung
- ✅ Integrierte Benutzer-Verwaltung
- ✅ Kostenloser Plan für kleine Projekte

**Bootstrap 5**:
- ✅ Mobile-First Design System
- ✅ Vorgefertigte Komponenten (Buttons, Cards, Modals)
- ✅ Responsive Grid-System
- ✅ Keine jQuery-Abhängigkeit mehr (im Gegensatz zu Bootstrap 4)

**Vite**:
- ✅ Extrem schneller Dev-Server (<1s Start)
- ✅ Hot Module Replacement (Code-Änderungen sofort sichtbar)
- ✅ Optimierte Production-Builds

---

## 📁 Projekt-Struktur

```
Amyaro-Firebase/
│
├── public/                    # Statische Dateien (direkt ausgeliefert)
│   ├── favicon.svg           # Browser-Icon
│   └── vite.svg              # Vite-Logo
│
├── src/                      # Haupt-Quellcode (TypeScript/React)
│   │
│   ├── components/           # Wiederverwendbare UI-Komponenten
│   │   ├── ui/              # Basis-Komponenten (Atoms)
│   │   │   ├── Button.tsx           # Wiederverwendbarer Button
│   │   │   ├── Card.tsx             # Card-Layout
│   │   │   ├── Modal.tsx            # Modal-Dialog Wrapper
│   │   │   ├── Toast.tsx            # Benachrichtigungen
│   │   │   ├── Badge.tsx            # Status-Badges
│   │   │   ├── ContextMenu.tsx      # Rechtsklick-Menü
│   │   │   ├── SwipeableItem.tsx    # Mobile Swipe-Gesten
│   │   │   └── UserDisplay.tsx      # User-Avatar-Anzeige
│   │   │
│   │   ├── business/        # Business-Logik Komponenten (Molecules/Organisms)
│   │   │   ├── ListCard.tsx              # Listen-Karte (Dashboard)
│   │   │   ├── ListGrid.tsx              # Grid-Layout für Listen
│   │   │   ├── CategorySection.tsx       # Kategorie mit Items
│   │   │   ├── DraggableItem.tsx         # Desktop Drag & Drop Item
│   │   │   ├── MobileItem.tsx            # Mobile-optimiertes Item
│   │   │   ├── QuickAddInput.tsx         # Schnell-Eingabe für Items
│   │   │   ├── QuantityEditor.tsx        # Mengen-Auswahl
│   │   │   ├── CreateListModal.tsx       # Neue Liste erstellen
│   │   │   ├── CreateCategoryModal.tsx   # Neue Kategorie
│   │   │   ├── EditListModal.tsx         # Liste bearbeiten
│   │   │   ├── ShareListModal.tsx        # Listen teilen (NEU!)
│   │   │   ├── InvitationsBanner.tsx     # Einladungen anzeigen (NEU!)
│   │   │   ├── InvitationsModal.tsx      # Einladungen verwalten (NEU!)
│   │   │   ├── SharedInfoModal.tsx       # Sharing-Info anzeigen (NEU!)
│   │   │   ├── ListPriceModal.tsx        # Preis erfassen (NEU!)
│   │   │   ├── CloseListConfirmModal.tsx # Liste schließen bestätigen
│   │   │   ├── ClosedListsModal.tsx      # Archivierte Listen
│   │   │   ├── ProfileEditModal.tsx      # Profil bearbeiten
│   │   │   ├── DeleteAccountModal.tsx    # Account löschen
│   │   │   └── DuplicateItemModal.tsx    # Item duplizieren
│   │   │
│   │   ├── Auth/            # Authentication-Komponenten
│   │   │   ├── Login.tsx                      # Login-Formular
│   │   │   ├── Register.tsx                   # Registrierung
│   │   │   ├── PasswordReset.tsx              # Passwort vergessen
│   │   │   ├── ProtectedRoute.tsx             # Route-Guard
│   │   │   ├── AuthWrapper.tsx                # Auth-State-Wrapper
│   │   │   ├── EmailVerificationBanner.tsx    # Email bestätigen (NEU!)
│   │   │   ├── EmailVerificationRequired.tsx  # Email-Pflicht (NEU!)
│   │   │   └── DisplayNameRequiredModal.tsx   # Name-Pflicht (NEU!)
│   │   │
│   │   ├── Layout/          # Layout-Komponenten
│   │   │   ├── Layout.tsx   # Haupt-Layout (Header + Content)
│   │   │   └── Loading.tsx  # Loading-Spinner
│   │   │
│   │   └── forms/           # Formular-Komponenten (NEU!)
│   │       ├── Input.tsx    # Text-Input mit Validation
│   │       ├── Textarea.tsx # Mehrzeilige Textfelder
│   │       ├── Select.tsx   # Dropdown-Auswahl
│   │       ├── Checkbox.tsx # Checkbox-Input
│   │       └── FormField.tsx# Wrapper für Labels/Errors
│   │
│   ├── pages/               # Ganze Seiten/Views (Pages/Templates)
│   │   ├── Dashboard.tsx    # Hauptseite (Listen-Übersicht)
│   │   ├── ListDetail.tsx   # Einzelne Liste bearbeiten
│   │   ├── Profile.tsx      # Benutzer-Profil
│   │   ├── Statistics.tsx   # Statistiken & Auswertungen
│   │   ├── AuthAction.tsx   # Email-Verification Handler (NEU!)
│   │   ├── Impressum.tsx    # Impressum/Datenschutz
│   │   └── TermsOfService.tsx # AGB (NEU!)
│   │
│   ├── context/             # React Context (Globaler State)
│   │   ├── AuthContext.tsx  # Benutzer-Zustand (Login/Logout)
│   │   └── ListsContext.tsx # Listen-Zustand (CRUD + Real-time)
│   │
│   ├── services/            # API-Calls und Business-Logic
│   │   ├── listService.ts   # Listen-Operationen (CRUD + Close/Reopen)
│   │   ├── (ItemService ist in listService.ts enthalten)
│   │   ├── userService.ts   # User-Profil-Verwaltung (NEU!)
│   │   ├── shopService.ts   # Shop-Verwaltung (NEU!)
│   │   ├── statisticsService.ts # Auswertungen/Statistikdaten
│   │   └── invitationService.ts # Einladungs-System (NEU!)
│   │
│   ├── hooks/               # Custom React Hooks (NEU!)
│   │   ├── useInvitations.ts # Einladungen verwalten
│   │   └── useLongPress.ts   # Long-Press-Gesten (Mobile)
│   │
│   ├── types/               # TypeScript Typ-Definitionen
│   │   ├── index.ts         # Allgemeine Typen (User, Share, Invitation)
│   │   └── todoList.ts      # Listen-spezifische Typen (List, Item, Category, Shop)
│   │
│   ├── utils/               # Hilfsfunktionen
│   │   ├── helpers.ts       # Allgemeine Helfer
│   │   ├── cn.ts            # ClassNames-Utility (TailwindCSS-like)
│   │   ├── logger.ts        # Debug-Logger (NEU!)
│   │   └── touchUtils.ts    # Touch/Swipe-Gesten (NEU!)
│   │
│   ├── config/              # Konfiguration
│   │   └── firebase.ts      # Firebase Setup & Initialisierung
│   │
│   ├── App.tsx              # Haupt-App Komponente (Router-Config)
│   ├── App.css              # App-spezifische Styles
│   ├── main.tsx             # React App Einsprungspunkt (ReactDOM.render)
│   └── index.css            # Globale Styles & Bootstrap-Overrides
│
├── firestore.rules          # Firebase Security Rules (Server-seitig!)
├── firestore.indexes.json   # Composite Indexes (Performance)
├── firebase.json            # Firebase Project Config
├── package.json             # NPM Dependencies & Scripts
├── tsconfig.json            # TypeScript Konfiguration
├── tsconfig.app.json        # TypeScript App-Config
├── tsconfig.node.json       # TypeScript Node-Config
├── vite.config.ts           # Vite Build-Tool Konfiguration
├── eslint.config.js         # ESLint Code-Quality-Regeln
├── index.html               # HTML Entry Point
├── README.md                # Projekt-Übersicht
├── Dokumentation/           # Zentraler Ort für Projekt-Dokumentationen
│   ├── SECURITY.md          # Security-Policy & Vulnerability-Reporting
│   ├── STATISTICS_MODULE.md # Statistik-Modul Doku
│   └── JUNIOR_DEVELOPER_GUIDE.md # Diese Datei!
└── scripts/                 # Hilfs-Skripte für Projektpflege
  ├── clean-logs.sh        # Logs bereinigen
  └── initializeShops.ts   # Shops in Firestore anlegen
```

### 🔍 Wie finde ich was?

Wenn du neu bist: Starte immer mit dieser Tabelle. Sie zeigt dir den **besten ersten Ort** für typische Aufgaben.

| Was möchtest du tun? | Wo findest du es? | Anfänger-Tipp |
|----------------------|-------------------|---------------|
| **Neue Seite hinzufügen** | `src/pages/` + Route in `App.tsx` | Kopiere als Vorlage zuerst eine kleine bestehende Page (z. B. `Profile.tsx`). |
| **UI-Komponente ändern** | `src/components/ui/` (Basis) oder `src/components/business/` (komplex) | `ui` = kleine Bausteine, `business` = fachliche Komponenten mit mehr Logik. |
| **Datenbank-Logik** | `src/services/` | Erst lesen, dann ändern: Services kapseln die Firestore-Logik. |
| **Items einer Liste bearbeiten** | `ItemService` in `src/services/listService.ts` | Nicht nach `itemService.ts` suchen: Die Item-Methoden liegen im `listService.ts`. |
| **Globale Zustände** | `src/context/` | Für app-weite Daten (`User`, `Listen`) immer hier starten. |
| **Styling ändern** | `src/index.css`, `src/App.css` oder Bootstrap-Klassen in Komponenten | Kleine Änderungen zuerst lokal in der Komponente testen. |
| **Firebase Rules** | `firestore.rules` | Wichtig: Rules laufen serverseitig und schützen Datenzugriffe. |
| **TypeScript-Typen** | `src/types/` | Bei neuen Feldern zuerst den Typ anpassen, dann die UI. |
| **Statistiken anpassen** | `src/pages/Statistics.tsx` + `src/services/statisticsService.ts` | UI und Datenlogik getrennt ändern. |
| **Neue Dependency** | `package.json` (über `npm install <paket>`) | Danach immer kurz `npm run build` prüfen. |

---

## 🆕 Neue Features & Konzepte

### 1. **Listen-Sharing & Collaboration**

**Was ist neu?**
- Listen können mit anderen Nutzern geteilt werden
- E-Mail-basiertes Einladungssystem
- Read/Write Permissions
- Multi-User Item-Assignments
- Real-time Sync zwischen Nutzern

**Technische Umsetzung:**
```typescript
// InvitationService - src/services/invitationService.ts
class InvitationService {
  // Einladung senden
  static async sendInvitation(listId, listName, fromUserId, fromUserName, toEmail, permission)
  
  // Einladung annehmen
  static async acceptInvitation(invitationId, userId)
  
  // Einladung ablehnen
  static async declineInvitation(invitationId)
  
  // Limit: Max 4 geteilte User pro Liste
}
```

**Komponenten:**
- `ShareListModal.tsx` - Liste teilen
- `InvitationsBanner.tsx` - Benachrichtigung über neue Einladungen
- `InvitationsModal.tsx` - Einladungen verwalten
- `SharedInfoModal.tsx` - Info über geteilte Liste

### 2. **Price Tracking System**

**Was ist neu?**
- Preiserfassung beim Abschließen von Listen
- Shop-Auswahl (Aldi, REWE, EDEKA, etc.)
- "Ungefähr"-Indikator bei nachträglichen Änderungen
- Geschlossene Listen = Archiv mit Preis-Historie

**Datenmodell:**
```typescript
interface List {
  // ... bestehende Felder
  isClosed?: boolean;      // Liste abgeschlossen?
  closedAt?: Timestamp;    // Wann geschlossen?
  destination?: string;    // Shop (z.B. "Aldi Nord")
  price?: number;          // Gesamtpreis in €
}

interface Shop {
  id: string;
  name: string;            // Technischer Name (z.B. "aldi-nord")
  displayName: string;     // Anzeige-Name (z.B. "Aldi Nord")
  category?: string;       // z.B. "Discounter"
  order: number;           // Sortierung
  isActive: boolean;
}
```

**Services:**
- `ShopService.getShops()` - Alle aktiven Shops
- `ListService.closeList(listId, destination?, price?)` - Liste mit Preis schließen
- `ListService.reopenList(listId)` - Liste wiedereröffnen

**Komponenten:**
- `ListPriceModal.tsx` - Preis & Shop erfassen
- `CloseListConfirmModal.tsx` - Bestätigung vor Schließen
- `ClosedListsModal.tsx` - Archiv ansehen

**Flow:**
```
1. User klickt "Liste abschließen"
2. CloseListConfirmModal: "Wirklich schließen? (Unchecked Items werden gelöscht)"
3. ListPriceModal: "Wo eingekauft? Wie viel bezahlt?"
4. Liste wird geschlossen:
   - isClosed = true
   - closedAt = now
   - destination = "Aldi Nord"
   - price = 47.52
   - Unchecked Items gelöscht
5. Liste erscheint ausgegraut im Dashboard
6. Filter "Geschlossene Listen" zeigt Archiv
```

### 3. **Geschlossene Listen (Closed Lists)**

**Konzept:**
- Shopping-Listen können "abgeschlossen" werden
- Alle nicht-abgehakten Items werden beim Schließen gelöscht
- Geschlossene Listen = Archiv mit Preisinfo
- Listen können wiedereröffnet werden

**Filter im Dashboard:**
```typescript
// Dashboard.tsx - Filter
const filters = {
  'all': 'Alle offenen Listen',
  'shopping': 'Nur Einkaufslisten (offen)',
  'gift': 'Nur Geschenkelisten',
  'closed': 'Archiv (geschlossene Listen)'
}
```

### 4. **Email-Verification & User-Management**

**Was ist neu?**
- Email muss bestätigt werden (EmailVerificationBanner)
- DisplayName ist Pflicht für Sharing (DisplayNameRequiredModal)
- Profil-Edit-Funktion (ProfileEditModal)
- Account-Löschen mit Warnung (DeleteAccountModal)

**Flow:**
```
1. User registriert sich
2. Email-Bestätigungsmail wird gesendet
3. Banner: "Bitte Email bestätigen"
4. User klickt Link in Email
5. AuthAction.tsx handlet Verification
6. Banner verschwindet
```

### 5. **Mobile-First Improvements**

**Neue Features:**
- SwipeableItem.tsx - Swipe-to-Delete/Complete
- Touch-optimierte Buttons (größere Touch-Targets)
- Responsive Filter (horizontal Desktop, vertikal Mobile)
- Mobile-optimierte Modals

---

## 💡 Wichtige Konzepte

### 1. **React Komponenten**

```tsx
// Eine einfache Komponente (Function Component)
const MeineKomponente = () => {
  return (
    <div>
      <h1>Hallo Welt!</h1>
    </div>
  );
};

// Komponente mit Props (TypeScript!)
interface MeineKomponenteProps {
  title: string;
  count: number;
  onButtonClick: () => void;
}

const MeineKomponente: React.FC<MeineKomponenteProps> = ({ 
  title, 
  count, 
  onButtonClick 
}) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={onButtonClick}>Klick mich!</button>
    </div>
  );
};
```

**Komponenten sind wie LEGO-Bausteine:**
- Jede Komponente hat **eine** klare Aufgabe
- Komponenten können andere Komponenten verwenden
- Props = Parameter für Komponenten (read-only!)
- State = Interner Zustand einer Komponente (veränderbar)

### 2. **TypeScript Typen**

```tsx
// Typ-Definition
interface User {
  id: string;
  name: string;
  email: string;
}

// Komponente mit getypten Props
interface UserCardProps {
  user: User;
  onClick: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  return (
    <div onClick={onClick}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
};
```

**Warum TypeScript?**
- Fängt Fehler beim Schreiben ab
- Bessere IDE-Unterstützung
- Selbst-dokumentierender Code

### 3. **React Context (Globaler Zustand)**

```tsx
// Context erstellen
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider (wrapper um die App)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook zum Verwenden
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// In Komponente verwenden
const MyComponent = () => {
  const { user } = useAuth();
  return <div>Hallo {user?.name}!</div>;
};
```

**Context = Globaler Speicher:**
- Daten die viele Komponenten brauchen
- Vermeidet "Prop Drilling"
- Beispiel: Eingeloggter User, Listen-Daten

---

## 🏗️ Code-Aufbau verstehen

### Beispiel: Wie eine Liste angezeigt wird

#### 1. **Datenfluss verstehen:**

```
Firebase Database → ListService → ListsContext → Dashboard → ListGrid → ListCard
```

#### 2. **Schritt für Schritt:**

**🔥 Firebase (Datenbank):**
```javascript
// In Firestore gespeichert
{
  id: "abc123",
  name: "Einkauf Samstag",
  type: "shopping",
  userId: "user456",
  createdAt: "2024-11-10T10:00:00Z"
}
```

**⚙️ ListService (API-Layer):**
```typescript
// src/services/listService.ts
export class ListService {
  static async getAllLists(): Promise<List[]> {
    // Firebase Firestore abfragen
    const querySnapshot = await getDocs(
      query(collection(db, 'lists'), orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as List));
  }
}
```

**🌐 ListsContext (Globaler Zustand):**
```typescript
// src/context/ListsContext.tsx
export const ListsProvider = ({ children }) => {
  const [lists, setLists] = useState<List[]>([]);
  
  const refreshLists = async () => {
    const allLists = await ListService.getAllLists();
    setLists(allLists);
  };
  
  return (
    <ListsContext.Provider value={{ lists, refreshLists }}>
      {children}
    </ListsContext.Provider>
  );
};
```

**📄 Dashboard (Page-Komponente):**
```tsx
// src/pages/Dashboard.tsx
const Dashboard = () => {
  const { lists } = useListsContext();
  
  return (
    <div>
      <h1>Meine Listen</h1>
      <ListGrid lists={lists} />
    </div>
  );
};
```

**🗂️ ListGrid (Container-Komponente):**
```tsx
// src/components/business/ListGrid.tsx
export const ListGrid = ({ lists }) => {
  return (
    <div className="row">
      {lists.map(list => (
        <ListCard key={list.id} list={list} />
      ))}
    </div>
  );
};
```

**🎴 ListCard (UI-Komponente):**
```tsx
// src/components/business/ListCard.tsx
export const ListCard = ({ list }) => {
  return (
    <div className="card">
      <h3>{list.name}</h3>
      <p>{list.type === 'shopping' ? '🛒' : '🎁'}</p>
    </div>
  );
};
```

### 🎯 Das Muster verstehen:

1. **Services** = Kommunikation mit Firebase
2. **Context** = Globaler Zustand für die ganze App
3. **Pages** = Ganze Bildschirme/Routen
4. **Components** = Wiederverwendbare UI-Teile

---

## 🔥 Firebase Integration

### 1. **Firebase Setup**

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Konfiguration...
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);

// Services exportieren
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 2. **Firestore Operationen**

```typescript
// Daten lesen
const getLists = async () => {
  const snapshot = await getDocs(collection(db, 'lists'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Daten schreiben
const createList = async (listData) => {
  const docRef = await addDoc(collection(db, 'lists'), {
    ...listData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Daten aktualisieren
const updateList = async (listId, updates) => {
  await updateDoc(doc(db, 'lists', listId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Daten löschen
const deleteList = async (listId) => {
  await deleteDoc(doc(db, 'lists', listId));
};
```

### 3. **Authentication**

```typescript
// Registrierung
const register = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  return userCredential.user;
};

// Anmeldung
const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Abmeldung
const logout = async () => {
  await signOut(auth);
};
```

---

## ⚛️ React Patterns in diesem Projekt

### 1. **Custom Hooks Pattern**

```typescript
// src/context/AuthContext.tsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Verwendung in Komponenten
const MyComponent = () => {
  const { user, login, logout } = useAuth();
  // ...
};
```

### 2. **Compound Components Pattern**

```tsx
// Modal-Komponente mit verschiedenen Teilen
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>
    <h2>Titel</h2>
  </Modal.Header>
  <Modal.Body>
    <p>Inhalt</p>
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={onClose}>Schließen</Button>
  </Modal.Footer>
</Modal>
```

### 3. **Render Props / Children Pattern**

```tsx
// Layout-Komponente
const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

// Verwendung
<Layout>
  <Dashboard />
</Layout>
```

### 4. **Error Boundaries**

```tsx
// Fehler abfangen
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <div>Etwas ist schief gelaufen!</div>;
  }
  
  return children;
};
```

---

## 🛠️ Häufige Entwickler-Aufgaben

### 1. **Neue Komponente erstellen**

```bash
# 1. Datei erstellen
touch src/components/business/MyNewComponent.tsx
```

```tsx
// 2. Komponente schreiben
import React from 'react';

interface MyNewComponentProps {
  title: string;
  onClick: () => void;
}

export const MyNewComponent: React.FC<MyNewComponentProps> = ({ title, onClick }) => {
  return (
    <div className="card" onClick={onClick}>
      <h3>{title}</h3>
    </div>
  );
};
```

```typescript
// 3. In index.ts exportieren
// src/components/business/index.ts
export { MyNewComponent } from './MyNewComponent';
```

### 2. **Neue Seite hinzufügen**

```tsx
// 1. Page-Komponente erstellen
// src/pages/MyNewPage.tsx
const MyNewPage = () => {
  return (
    <div>
      <h1>Meine neue Seite</h1>
    </div>
  );
};

export default MyNewPage;
```

```tsx
// 2. Route in App.tsx hinzufügen
import MyNewPage from './pages/MyNewPage';

// In Routes:
<Route path="/my-new-page" element={
  <ProtectedRoute>
    <Layout>
      <MyNewPage />
    </Layout>
  </ProtectedRoute>
} />
```

### 3. **Neuen Service erstellen**

```typescript
// src/services/myNewService.ts
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export class MyNewService {
  private static collection = 'myNewCollection';
  
  static async getAll() {
    const snapshot = await getDocs(collection(db, this.collection));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  static async create(data: any) {
    const docRef = await addDoc(collection(db, this.collection), data);
    return docRef.id;
  }
}
```

### 4. **TypeScript Typen hinzufügen**

```typescript
// src/types/myTypes.ts
export interface MyNewType {
  id: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
  tags?: string[]; // Optional
}

// In andere Dateien importieren
import type { MyNewType } from '../types/myTypes';
```

---

## 🚀 Nächste Schritte & Onboarding-Checklist (Praktisch)

Kurze Schritt-für-Schritt-Anleitung damit du schnell loslegen kannst.

1. Fork / Clone das Repository
2. Node.js (>=18) installieren
3. Installiere Dependencies

```bash
npm install
```

4. Lokalen Dev-Server starten (Vite)

```bash
npm run dev
```

5. Öffne die App im Browser: `http://localhost:5173`
6. In Firebase Console einloggen (Projektzugriff notwendig)
7. Lies die Datei `src/config/firebase.ts` für Environment-Setup

---

## 🧰 Umgebungsvariablen & Firebase Setup

Die Firebase-Konfiguration wird in `src/config/firebase.ts` verwendet. Wir halten sensible Werte außerhalb des Repos (z.B. in CI Secrets oder lokal in `.env`).

Wichtige Variablen (lokal in `.env`):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Hinweis: Vite liest `VITE_`-Präfixe automatisch in `import.meta.env`.

---

## 🧭 Development Workflow (Git & Branching)

Konventionen, damit das Team sauber zusammenarbeitet:

- Haupt-Branch: `main` (stabile Produktion)
- Feature-Branches: `feature/<short-desc>`
- Bugfix-Branches: `bugfix/<ticket-id>-short-desc`
- Release-Branches (selten): `release/<version>`

Beispiel: `feature/add-price-tracking`

### PR-Anforderungen
- Erstelle einen Pull Request in GitHub gegen `main`
- PR-Template ausfüllen (Beschreibung, Screenshots, Test-Schritte)
- Mindestens 1 Reviewer
- Keine Merges ohne grünen CI-Status

### Commit Message Style
Wir empfehlen Conventional Commits:

```
feat(list): add close list price modal
fix(list): prevent focus mode on closed lists
chore(deps): update eslint
```

---

## ✅ Quality Gates (Was jeder PR durchlaufen muss)

1. Lint/Typecheck (ESLint + TypeScript)
2. Lokaler Build: `npm run build` (keine TypeScript-Fehler)
3. Manuelle Smoke-Test: wichtige UI-Flows
4. Tests (falls vorhanden)

CI sollte die Schritte automatisieren. Wenn etwas in CI fehlschlägt, bitte lokal reproduzieren und fixen.

---

## 🔁 Build & Deploy (Kurzreferenz)

1. Production Build erstellen:

```bash
npm run build
```

2. Preview (optional):

```bash
npm run preview
```

3. Deploy zu Firebase Hosting (falls du Zugriff hast):

```bash
firebase deploy --only hosting
```

Für Firestore Indexes/Rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## 🧪 Tests, Linting & Formatierung

- Lint (ESLint):

```bash
npm run lint
```

- Formatierung (Prettier) (falls konfiguriert):

```bash
npm run format
```

- TypeScript-Check (wird in `npm run build` ausgeführt):

```bash
npm run build
```

Aktuell sind keine Unit-Tests integriert (Jest/Testing Library). Wenn du Tests hinzufügst, erstelle einen `tests/`-Ordner und ergänze CI.

---

## 🐞 Debugging-Checkliste (häufige Probleme)

1. Fehler beim Build (TS Fehler):
   - Typfehler lesen und `import` Pfade prüfen
   - Unused Imports entfernen
2. Firestore Permission Denied:
   - `firestore.rules` prüfen
   - Prüfe Authentication State
3. Camera / PWA Probleme auf Mobile:
   - HTTPS erforderlich
   - Browser Permissions prüfen
4. UI-Fehler:
   - React DevTools verwenden
   - Console/Network Tabs prüfen

---

## 📦 Wichtige Dateien & Orte (Schnellnavigation)

- `src/config/firebase.ts` — Firebase Setup
- `src/services/` — Business-Logik & Firestore-Interface
- `src/context/` — Global State (Auth, Lists)
- `src/components/business/` — Geschäfts-UI
- `src/components/ui/` — Basis-UI-Komponenten
- `firestore.rules` — Security Regeln
- `firestore.indexes.json` — Index-Definitionen

---

## 👥 Rollen & Verantwortlichkeiten

- Owner/Maintainer: Release, Production-Deploys, Secret Management
- Developer: Feature-Branches, PRs, Unit-Tests
- Reviewer: Code-Review, Acceptance Testing

---

## 📚 Weiterführende Hinweise & Good-to-Know

- Wenn du Shops initialisieren musst (nur Admin): `scripts/initializeShops.ts` nutzen
- Feature Flags werden noch nicht genutzt — neue große Features sollten mit Feature-Flag geplant werden
- Schreibe kleine, gut testbare Commits (Atomic Commits)

---

**🎉 Fertig — viel Erfolg beim Einstieg!**

*Letzte Aktualisierung: 18. Januar 2026*
*Erstellt für: Junior-Entwickler Onboarding*