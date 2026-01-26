# 📊 Statistik-Modul - Dokumentation

## Übersicht

Das Statistik-Modul bietet Nutzern eine detaillierte Übersicht über ihre Einkäufe basierend auf geschlossenen Listen.

## Features (Phase 1)

### 1. **Filter-System**

#### Listen-Typ Filter
- **Alle Listen:** Zeigt alle geschlossenen Listen (eigene + geteilte)
- **Eigene Listen:** Nur Listen, die der User erstellt hat
- **Geteilte Listen:** Nur Listen, die mit dem User geteilt wurden

#### Shop Filter
- Dropdown mit allen Shops, bei denen eingekauft wurde
- Filtert die Timeline nach ausgewähltem Shop
- "Alle Shops" zeigt ungefilterte Timeline

### 2. **Übersichts-Karten (Top Row)**

Vier Key-Metrics:
- **Gesamt ausgegeben:** Summe aller Einkäufe
- **Anzahl Einkäufe:** Anzahl geschlossener Listen
- **Ø pro Einkauf:** Durchschnittspreis
- **Verschiedene Shops:** Anzahl unterschiedlicher Läden

### 3. **Shop-Statistik-Tabelle**

Zeigt für jeden Shop:
- **Gesamt:** Summe aller Einkäufe bei diesem Shop
- **Anzahl:** Wie oft wurde dort eingekauft
- **Durchschnitt:** Durchschnittlicher Einkaufswert
- **Letzter Einkauf:** Datum des letzten Einkaufs

Sortierung: Absteigend nach Gesamtausgaben

### 4. **Einkaufs-Timeline**

Chronologische Liste aller Einkäufe:
- Listenname
- Shop (als Badge)
- Datum
- Anzahl Items
- Preis

Features:
- Klickbar → öffnet die Liste im Detail
- Neueste zuerst sortiert
- Max. 20 Einträge angezeigt
- Filterbar nach Shop

### 5. **Extremwerte**

Zwei Karten am Ende:
- **Teuerster Einkauf:** Listenname, Shop, Preis (rot)
- **Günstigster Einkauf:** Listenname, Shop, Preis (grün)

## Technische Umsetzung

### Neue Dateien

#### `src/services/statisticsService.ts`
Service-Klasse mit statischen Methoden:

```typescript
class StatisticsService {
  // Filter-Logik
  static filterListsByOwnership(lists, userId, ownership)
  
  // Berechnungen
  static calculateShopStatistics(lists)
  static createTimeline(lists)
  static calculateOverallStatistics(lists)
  
  // Helper
  static filterTimelineByDateRange(timeline, start?, end?)
  static filterTimelineByShop(timeline, shop)
  static formatPrice(price)
  static formatDate(date)
  static formatShopName(shopName)
}
```

#### `src/pages/Statistics.tsx`
React-Komponente für die Statistik-Page:
- Nutzt `useListsContext()` für Daten
- Nutzt `useAuth()` für User-ID
- State für Filter (ownership, shop)
- Responsive Layout mit Bootstrap

### Routing

**Route:** `/statistics`

**Navigation:** User-Dropdown → "📊 Statistiken"

### Datenquellen

**Verwendet nur bestehende Daten:**
- `lists` aus `ListsContext`
- Filtert nach `isClosed === true`
- Benötigt `price`, `destination`, `closedAt`

**KEINE neuen Firestore Collections!**

## Verwendung

### Als User

1. Navigiere zum User-Dropdown (Account Icon oben rechts)
2. Klicke auf "📊 Statistiken"
3. Wähle Filter:
   - Listen-Typ (Alle/Eigene/Geteilte)
   - Shop (optional)
4. Erkunde Statistiken
5. Klicke auf Timeline-Eintrag um Liste zu öffnen

### Als Developer

```typescript
// StatisticsService nutzen
import { StatisticsService } from '../services/statisticsService';

// Alle Listen eines Users filtern
const ownLists = StatisticsService.filterListsByOwnership(
  lists, 
  userId, 
  'own'
);

// Shop-Statistiken berechnen
const shopStats = StatisticsService.calculateShopStatistics(lists);

// Timeline erstellen
const timeline = StatisticsService.createTimeline(lists);
```

## Zukünftige Erweiterungen (Phase 2 & 3)

### Phase 2: Historie & Snapshots
- `listSnapshots` Collection
- Preisentwicklung einer Liste über Zeit
- Charts (Line/Bar Charts)

### Phase 3: Advanced Analytics
- Item-basierte Analysen
- Produktvergleiche zwischen Shops
- Budget-Predictions
- Export-Funktion (CSV, PDF)

## Abhängigkeiten

- React Router (`useNavigate`)
- Bootstrap 5 (Styling)
- Bestehende Contexts (`AuthContext`, `ListsContext`)
- UI-Komponenten (`Card`)

## Performance

**Optimierungen:**
- Berechnungen erfolgen client-seitig (kein Backend-Call)
- Nutzt bestehende Daten aus Context (bereits geladen)
- Timeline limitiert auf 20 Einträge
- Stateless Service (keine Caching-Logik nötig)

**Skalierung:**
Bei sehr vielen Listen (>100):
- Timeline-Limit erhöhen oder Pagination
- Lazy Loading erwägen
- Memoization für teure Berechnungen

## Testing

**Manuelle Test-Checkliste:**
- [ ] Statistiken mit 0 Listen (Empty State)
- [ ] Statistiken mit 1-5 Listen
- [ ] Filter "Alle" / "Eigene" / "Geteilte"
- [ ] Shop-Filter funktioniert
- [ ] Timeline klickbar
- [ ] Extremwerte korrekt
- [ ] Mobile Responsiveness
- [ ] Preis-Formatierung (Komma statt Punkt)
- [ ] Datum-Formatierung (DE)

**Edge Cases:**
- Listen ohne Preis (werden ignoriert)
- Listen ohne Shop (werden ignoriert)
- Listen ohne closedAt (werden ignoriert)
- User ohne geschlossene Listen (Empty State)

## Bekannte Limitierungen

1. **Keine Historie:** Wenn Liste wiedereröffnet und erneut geschlossen wird, geht alte Version verloren
2. **Keine Item-Preise:** Nur Gesamtpreis pro Liste
3. **Keine Charts:** Aktuell nur Tabellen und Listen
4. **Kein Export:** Daten können nicht exportiert werden
5. **Keine Datum-Range-Filter:** Aktuell nur Shop-Filter

Diese werden in Phase 2 & 3 adressiert.

---

**Erstellt:** 26. Januar 2026  
**Version:** 1.0 (Phase 1)  
**Branch:** `statistics`
