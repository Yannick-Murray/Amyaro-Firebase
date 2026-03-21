# 🔒 Sicherheitsdokumentation - Amyaro Firebase App

## Übersicht der implementierten Sicherheitsmaßnahmen

### 1. Input Sanitization & Validation

#### XSS-Schutz (Cross-Site Scripting)
- **Alle Benutzereingaben** werden durch `sanitizeString()` gefiltert
- **HTML-Tags werden entfernt** - keine HTML-Inhalte in der Datenbank
- **JavaScript-Protokolle blockiert** (`javascript:`, `vbscript:`)
- **Event-Handler entfernt** (`onclick=`, `onload=`, etc.)
- **Dangerous Functions blockiert** (`eval()`, `Function()`, `setTimeout()`, etc.)

#### URL-Sicherheit
- **Nur HTTP/HTTPS erlaubt** - andere Protokolle werden blockiert
- **Lokale IPs blockiert** - verhindert SSRF-Angriffe
- **Data-URLs blockiert** - verhindert eingebetteten Code
- **Maximale URL-Länge** begrenzt auf 2000 Zeichen

#### Eingabe-Validierung
```typescript
// Beispiel: Sichere Textvalidierung
const nameValidation = validateTextInput(formData.name, 200);
if (!nameValidation.isValid) {
  setError(nameValidation.error);
  return;
}
```

### 2. Datentyp-Validierung

#### Preise
- **Numerische Validierung** - nur gültige Zahlen
- **Bereichsprüfung** - 0 bis 99.999 Euro
- **Dezimalstellenbegrenzung** - maximal 2 Nachkommastellen
- **Negative Werte blockiert**

#### Mengen
- **Ganzzahl-Validierung** - nur ganze Zahlen
- **Bereichsprüfung** - 1 bis 999 Stück
- **Float-Werte blockiert**

#### Texte
- **Längenbegrenzung**:
  - Name: 200 Zeichen
  - Beschreibung: 500 Zeichen  
  - Notizen: 1000 Zeichen
- **Control-Character entfernt**
- **Unicode-Escape-Sequenzen blockiert**

### 3. Firebase Firestore Sicherheit

#### Feldvalidierung
- **Undefined-Felder werden entfernt** vor Speicherung
- **Datentyp-Konsistenz** wird enforced
- **Leere Strings werden verhindert**

#### Firestore Rules (empfohlen)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Listen nur für authentifizierte Benutzer
    match /lists/{listId} {
      allow read, write: if request.auth != null 
        && (resource.data.userId == request.auth.uid 
            || resource.data.sharedWith.hasAny([request.auth.uid]));
      
      // Eingabe-Validierung auf Firestore-Ebene
      allow create: if validateListData(request.resource.data);
      allow update: if validateListData(request.resource.data);
    }
  }
}
```

### 4. Authentifizierung & Authorization

#### Benutzer-Validierung
- **Firebase Auth Integration** - nur authentifizierte Benutzer
- **User-ID Verification** - Überprüfung der Berechtigung
- **Session Management** - automatische Token-Verwaltung

#### Zugriffskontrolle
- **Ersteller-Rechte** - nur Listenersteller kann löschen
- **Geteilte Listen** - definierte Bearbeitungsrechte
- **User-ID Mapping** - sichere Zuordnung zu echten Namen

### 5. Client-Side Sicherheit

#### Input Components
Alle Form-Komponenten implementieren:
- **Automatische Sanitization** bei onChange
- **Real-time Validation** mit Fehlermeldungen
- **Length Limiting** mit visueller Anzeige
- **Disabled States** während Loading

#### Error Handling
- **Sichere Fehlermeldungen** - keine sensitiven Daten
- **User-friendly Messages** - verständlich für Benutzer
- **Logging** - Details nur in Console, nicht in UI

### 6. Potentielle Angriffsvektoren & Schutz

#### XSS (Cross-Site Scripting)
✅ **Geschützt durch**:
- HTML-Tag Entfernung
- JavaScript-Protokoll Blocking
- Event-Handler Filtering

#### SQL Injection
✅ **Nicht relevant** - NoSQL Firestore verwendet

#### CSRF (Cross-Site Request Forgery)
✅ **Geschützt durch**:
- Firebase Auth Token
- Origin Checking

#### SSRF (Server-Side Request Forgery)  
✅ **Geschützt durch**:
- URL-Protokoll Validation
- Local IP Blocking

#### Code Injection
✅ **Geschützt durch**:
- Function Call Blocking
- Eval Blocking
- Script Tag Removal

### 7. Monitoring & Logging

#### Security Events
```typescript
// Beispiel: Sicherheitsereignis loggen
if (suspiciousInput) {
  console.warn('Security: Suspicious input detected', {
    userId: user.uid,
    input: sanitizedInput,
    timestamp: new Date().toISOString()
  });
}
```

#### Empfohlene Metriken
- **Fehlgeschlagene Validierungen** pro Benutzer
- **Blockierte URLs** mit suspicious patterns
- **Überlange Eingaben** (potentielle DoS)

### 8. Best Practices für Entwickler

#### Input Handling
```typescript
// ✅ DO: Immer validieren und sanitizen
const safeInput = sanitizeString(userInput);
const validation = validateTextInput(safeInput, 200);

// ❌ DON'T: Direkte Verwendung von User Input
database.save({ name: userInput }); // Gefährlich!
```

#### URL Handling
```typescript
// ✅ DO: URL-Sicherheit prüfen
if (isValidUrl(userUrl)) {
  const safeUrl = sanitizeUrl(userUrl);
}

// ❌ DON'T: Ungeprüfte URLs verwenden
window.open(userUrl); // Gefährlich!
```

### 9. Security Testing

#### Testfälle
- **XSS Payloads** - `<script>alert('xss')</script>`
- **SQL Injection** - `'; DROP TABLE lists; --`
- **JavaScript URLs** - `javascript:alert('test')`
- **Long Inputs** - 10.000+ Zeichen Strings
- **Special Characters** - Unicode, Emojis, Control chars

#### Automatisierte Tests
```typescript
describe('Security Validation', () => {
  test('should block XSS attempts', () => {
    const malicious = '<script>alert("xss")</script>';
    const safe = sanitizeString(malicious);
    expect(safe).not.toContain('<script>');
  });
});
```

### 10. Notfallplan

#### Bei verdächtiger Aktivität
1. **Benutzer temporär blockieren**
2. **Eingaben in Quarantäne**
3. **Logs analysieren**
4. **Team benachrichtigen**

#### Security Updates
- **Regelmäßige Dependencies Updates**
- **Security Patches zeitnah einspielen**
- **Penetration Testing** vierteljährlich

---

## 🚨 Wichtige Erinnerungen

- **Niemals** User Input direkt in die Datenbank
- **Immer** Client UND Server-side validieren
- **Regelmäßig** Security Reviews durchführen
- **Monitoring** für ungewöhnliche Patterns

---

*Letzte Aktualisierung: 24. November 2025*
*Erstellt von: GitHub Copilot (Claude Sonnet 4)*