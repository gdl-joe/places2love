# places2love — Design-Spezifikation
Erstellt: 2026-05-03

## Projektbeschreibung

**places2love** ist eine persönliche Lieblingsorte-App als Progressive Web App (PWA) für das Smartphone. Nutzer können Natur- und Kulturorte erfassen, bewerten, fotografieren und auf einer Karte betrachten. Technisch und strukturell basiert sie auf dem Camperstop-Projekt (gleicher Tech-Stack, gleiche Architektur).

---

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 18 (Babel CDN, kein Build-Step), JSX |
| Karte | mapy.cz API + Leaflet/OpenStreetMap (umschaltbar per Button) |
| Backend | PHP 8, MySQL/MariaDB |
| Auth | Bearer Token (sessions-Tabelle, JWT-Muster wie Camperstop) |
| PWA | Service Worker + manifest.webmanifest |
| Offline | localStorage-Queue, automatische Sync bei Reconnect |
| Hosting | Herd (lokal) + all-inkl.com Shared Hosting |

---

## Dateistruktur

```
places2love/
  index.html                  ← Einstiegspunkt, React-Bootstrap, Konfiguration
  manifest.webmanifest
  sw.js
  icon.svg
  .htaccess
  backend/
    config.php                ← nicht im Repository
    config.example.php
    db.php
    helpers.php
    api/
      auth.php                ← Login, Logout, Register
      places.php              ← CRUD für Orte + Tags + Links + Fotos
      upload.php              ← Foto-Upload mit Resize
      import.php              ← CSV-Import
  project/
    p2l-data.jsx              ← Konstanten, Kategorien, Icons, Theme-Tokens
    p2l-screens.jsx           ← alle Screens (Liste, Detail, Formular, Statistik, Profil)
    p2l-extras.jsx            ← Karte, Filter-Panel, Modals, Offline-Logik
  uploads/                    ← Fotos (chmod 755, nicht im Repository)
  docs/
    superpowers/specs/
      2026-05-03-places2love-design.md
```

---

## Navigation

Vier Tabs in einer fixen Bottom-Navigation:

| Tab | Icon | Inhalt |
|---|---|---|
| Liste | 📋 | Alle Orte als Cards, Suche, Filter |
| Karte | 🗺️ | Alle Orte als Pins auf der Karte |
| Statistik | 📊 | Kennzahlen und Auswertungen |
| Profil | 👤 | Einstellungen, Import/Export, Logout |

---

## Screens

### 1. Liste (Startseite)
- Alle Orte des eingeloggten Nutzers als Cards, sortiert nach Besuchsdatum (neueste zuerst)
- Jede Card: Hero-Foto (oder Farbgradient nach Kategorie), Kategorie-Badge, Name, Bewertung ★, Land/Region, Datum
- Suchfeld oben
- Filter-Chip-Zeile: nach Kategorie, Bewertung, Land, Wiederbesuchen
- FAB (Floating Action Button) „+" öffnet Formular für neuen Ort
- Tap auf Card → Detail-Screen

### 2. Detail-Screen
- Hero-Foto (Vollbreite, mit Gradient-Overlay)
- Kategorie-Label, Name, Sterne-Bewertung
- Chips: Land/Region, Dauer, Eintritt (€), Schwierigkeit (●–Punkte), Wiederbesuchen
- Beschreibung (Text)
- Tags als Chips
- Foto-Galerie (horizontal scrollbar)
- Links (anklickbar, mehrere möglich)
- GPS-Koordinaten mit Button „Auf Karte zeigen"
- Bearbeiten- und Löschen-Button

### 3. Karte
- Vollbild-Karte mit allen Orten als Pins
- Kartenwechsel-Button: mapy.cz ↔ OpenStreetMap/Leaflet
- Tap auf Pin: Mini-Popup mit Name, Kategorie, Bewertung → Tap öffnet Detail
- GPS-Button: Karte zentriert auf aktuellen Standort
- Zuletzt besuchter Ort als Card unterhalb der Karte (auf kleineren Phones)

### 4. Neuer Ort / Bearbeiten
Alle Felder als Formular (scrollbar):

| Feld | Typ |
|---|---|
| Name | Textfeld |
| Kategorie | Chip-Auswahl (Einfachauswahl + Freie Kategorie) |
| Bewertung | Stern-Picker (1–5) |
| Schwierigkeit | Punkte-Picker (1–5) |
| Besuchsdatum | Datums-Picker |
| Land | Dropdown (Länder mit Flagge) |
| Region | Textfeld |
| Beschreibung | Textarea |
| Eintritt | Zahl (€) |
| Dauer | Textfeld (z.B. „2,5 Std.") |
| Wiederbesuchen | Segmented Control: ja / vielleicht / nein |
| Tags | Freitext-Chips (kommagetrennt eingeben) |
| Links | Mehrere URL-Felder (+ Schaltfläche „Link hinzufügen") |
| GPS | Koordinaten-Anzeige + Button „Auf Karte wählen" + Button „Aktuellen Standort" |
| Fotos | Mehrere Fotos hochladen (Kamera oder Galerie) |

### 5. Statistik
- 4 Kacheln: Orte gesamt · Besuchte Länder · Ø Bewertung · Orte dieses Jahr
- Balkendiagramm: Verteilung nach Kategorie
- Jahresübersicht: neue Orte pro Jahr (Balkenchart)
- Top 5: bestbewertete Orte (Liste)

### 6. Profil
- Nutzername anzeigen
- Dark/Light-Mode-Toggle (gespeichert in localStorage)
- CSV-Export: alle eigenen Orte herunterladen
- CSV-Import: Vorlage herunterladen + Datei hochladen
- Logout

---

## Datenbankschema

```sql
users          -- id, email, name, password_hash, locale, created_at
sessions       -- token, user_id, created_at, expires_at
places         -- id, user_id, title, category, custom_category,
               --   country, country_flag, region,
               --   lat, lng,
               --   visited_on (DATE),
               --   rating TINYINT (0-5),
               --   difficulty TINYINT (0-5),
               --   revisit ENUM('ja','vielleicht','nein'),
               --   entry_cents INT,     -- Eintritt in Cent
               --   duration VARCHAR(60),
               --   note TEXT,
               --   created_at, updated_at
place_tags     -- place_id, tag
place_links    -- id, place_id, url, label, sort_order
place_photos   -- id, place_id, path, width, height, sort_order, created_at
```

---

## Kategorien

**Natur/Landschaft:** Berg · Schlucht · Wasserfall · Felsformation · Naturdenkmal · See · Strand · Höhle
**Wandern/Sport:** Wanderung · Klettersteig
**Kultur:** Kirche/Kloster · Burg/Schloss
**Sonstige:** Freie Kategorie (eigene Eingabe)

---

## Design-System

Basis: Camperstop-Stil (Wald/Sand-Töne)

### Dark Mode (Standard)
| Variable | Wert | Einsatz |
|---|---|---|
| `--bg` | `#1c2420` | Body-Hintergrund |
| `--bg2` | `#242e22` | Cards, Header |
| `--bg3` | `#2a3828` | Inputs, Chips |
| `--border` | `#3a4a38` | Alle Borders |
| `--text` | `#e8dfc9` | Haupttext |
| `--muted` | `#6a8060` | Sekundärtext |
| `--accent` | `#4a7c59` | Buttons, aktive Elemente |
| `--accent-soft` | `#3a5a38` | Hover, aktive Chips |
| `--gold` | `#c8a840` | Sterne, Preise |

### Light Mode (umschaltbar)
| Variable | Wert |
|---|---|
| `--bg` | `#f5f2ec` |
| `--bg2` | `#ffffff` |
| `--bg3` | `#eae6de` |
| `--border` | `#d0c8b8` |
| `--text` | `#2a2a1a` |
| `--muted` | `#7a8070` |
| `--accent` | `#3a6a48` |

Toggle via `.dark`-Klasse auf `<html>`, gespeichert in `localStorage`.

### Typografie
- Sans-Serif: Inter (Google Fonts)
- Serif-Akzente (Titel): Fraunces (wie Camperstop)
- Body: 16px / 1.5

---

## Multi-User

- Jeder Nutzer sieht ausschließlich seine eigenen Orte
- Registrierung per E-Mail + Passwort
- Login liefert Bearer-Token (64 Zeichen, in localStorage)
- Token-Gültigkeit: 30 Tage (verlängerbar bei Aktivität)
- Alle API-Endpoints prüfen Token und filtern nach `user_id`

---

## PWA & Offline

- `manifest.webmanifest`: Name, Icons, Theme-Color, Display Standalone
- Service Worker (`sw.js`): Cache-First für statische Assets
- Offline-Queue: Neue Orte werden in `localStorage` gepuffert und beim nächsten Online-Moment synchronisiert
- Installierbar auf iPhone (Safari → Teilen → Zum Home-Bildschirm) und Android (Chrome → App installieren)

---

## CSV-Import/Export

**Export:** Alle eigenen Orte als CSV herunterladen (UTF-8, Semikolon-getrennt)

**Import-Felder:**
```
Name;Kategorie;Land;Region;Besuchsdatum (TT.MM.JJJJ);Bewertung (1-5);
Schwierigkeit (1-5);Eintritt €;Dauer;Wiederbesuchen;Tags;Notizen;Lat;Lng
```

---

## Voraussetzungen & Deployment

- Webserver: PHP 8.0+, MySQL 5.7+ / MariaDB
- Lokal: Laravel Herd oder MAMP
- Produktiv: all-inkl.com Shared Hosting (PHP 8.2 im KAS-Panel wählen)
- mapy.cz API-Key (kostenlos): developer.mapy.cz
- `uploads/`-Ordner mit chmod 755 anlegen
- `backend/config.php` **nicht** ins Repository
