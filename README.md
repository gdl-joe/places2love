# places2love — Persönliche Lieblingsorte

Eine mobile-first Progressive Web App (PWA) zum Erfassen, Verwalten und Wiederfinden persönlicher Lieblingsplätze — Natur, Kultur, Wanderungen und mehr.

---

## Features

- **Orte erfassen** — Name, Kategorie, Land/Region, Koordinaten, Besuchsdatum
- **Kategorien** — Berg, Schlucht, Wasserfall, Felsformation, Naturdenkmal, See, Strand, Höhle, Wanderung, Klettersteig, Kirche/Kloster, Burg/Schloss, Freie Kategorie
- **Bewertung & Schwierigkeit** — Sterne (1–5), Schwierigkeitsgrad (1–5)
- **Fotos** — Upload mit automatischer Komprimierung und Größenreduzierung (max 1800 px)
- **Links** — Beliebig viele externe Links pro Ort (mit Bezeichnung)
- **Tags** — Freitext-Tags zur eigenen Verschlagwortung
- **Notizen** — Freitextfeld für persönliche Anmerkungen
- **Interaktive Karte** — Leaflet + Mapy.cz, alle Orte als Pins, Einzelort-Ansicht
- **Koordinaten-Picker** — Klick in die Karte setzt Lat/Lng direkt im Formular
- **CSV-Import** — Massen-Import aus Excel/Calc-kompatiblem CSV-Format
- **CSV-Export** — Vollständiger Export aller Orte (UTF-8 mit BOM für Excel)
- **CSV-Vorlage** — Downloadbare Vorlage mit Beispielzeile
- **Suche & Filter** — Freitextsuche, Filterung nach Kategorie, Land, Bewertung, Wiederbesuchen
- **Sortierung** — Nach Datum, Bewertung, Name
- **Dark/Light Mode** — Umschaltbar, wird in localStorage gespeichert
- **PWA** — Installierbar auf iPhone und Android (Home Screen), Offline-ready via Service Worker
- **Multi-User** — JWT-basierte Authentifizierung, jeder User sieht nur seine eigenen Orte
- **Eintrittspreise** — Erfassung in Euro (gespeichert in Cent)
- **Besuch-Wiederholung** — Feld "Wiederbesuchen" (ja / nein / vielleicht)

---

## Tech Stack

| Bereich    | Technologie                                      |
|------------|--------------------------------------------------|
| Frontend   | React 18 (via Babel Standalone, kein Build-Tool) |
| Backend    | PHP 8+, PDO/MySQL                                |
| Karte      | Leaflet 1.9 + Mapy.cz Tile API                   |
| Auth       | Bearer Token (sessions-Tabelle in MySQL)         |
| Fonts      | Google Fonts: Fraunces + Inter                   |
| PWA        | Web App Manifest + Service Worker                |
| Hosting    | Shared Hosting (all-inkl.com) oder lokal (Herd/MAMP) |

---

## Voraussetzungen

- PHP 8.0 oder neuer (mit GD-Extension für Bild-Resize)
- MySQL 5.7+ oder MariaDB 10.3+
- Lokale Entwicklung: Laravel Herd oder MAMP
- Produktiv: Shared Hosting (z. B. all-inkl.com) mit PHP und MySQL

---

## Installation

### 1. Dateien hochladen

Alle Dateien in ein Webverzeichnis hochladen (z. B. `/places2love/` oder Domain-Root).

### 2. Datenbank anlegen & Schema importieren

```sql
CREATE DATABASE places2love CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Schema-Datei importieren (sofern vorhanden) oder manuell die Tabellen anlegen:
`users`, `sessions`, `places`, `place_tags`, `place_links`, `place_photos`

### 3. Konfiguration anlegen

```bash
cp backend/config.example.php backend/config.php
```

`backend/config.php` anpassen:

```php
return [
  'db_host'      => 'localhost',
  'db_name'      => 'places2love',
  'db_user'      => 'datenbankbenutzer',
  'db_pass'      => 'passwort',
  'unix_socket'  => '',           // Leer lassen für TCP; bei Herd z. B. /tmp/mysql-XXXX.sock
  'upload_dir'   => '/absoluter/pfad/zu/places2love/uploads',
  'upload_url'   => '/uploads',   // Relativer URL-Pfad zum uploads-Ordner
  'upload_max'   => 10485760,     // 10 MB
  'image_max_px' => 1800,         // Maximale Bildbreite/-höhe in Pixel
  'mapycz_key'   => 'DEIN_KEY',   // Siehe Schritt 4
];
```

### 4. Mapy.cz API-Key eintragen

In `index.html` die Zeile:

```js
window.MAPKEY = 'DEIN_MAPYCZ_KEY';
```

mit dem eigenen Schlüssel von [https://developer.mapy.cz/](https://developer.mapy.cz/) ersetzen.

### 5. Uploads-Ordner anlegen

```bash
mkdir uploads
chmod 755 uploads
```

---

## Lokale Entwicklung

```bash
php -S localhost:8001
```

App dann unter `http://localhost:8001` erreichbar.

Bei Herd mit Unix-Socket den Pfad in `config.php` unter `unix_socket` eintragen (z. B. `/tmp/mysql-XXXX.sock`).

---

## PWA installieren

### iPhone (Safari)
1. Seite in Safari öffnen
2. Teilen-Symbol tippen
3. "Zum Home-Bildschirm" wählen

### Android (Chrome)
1. Seite in Chrome öffnen
2. Dreipunkt-Menü → "App installieren" oder Banner antippen

---

## CSV-Import Format

Semikolon-separiert (`;`), erste Zeile = Header, Datumsformat `DD.MM.YYYY`.

| Feld              | Beispiel              | Pflicht |
|-------------------|-----------------------|---------|
| Name              | Kuhfluchtwasserfälle  | ja      |
| Kategorie         | Wasserfall            | ja      |
| Freie Kategorie   |                       | nein    |
| Land              | Deutschland           | nein    |
| Region            | Bayern                | nein    |
| Besuchsdatum      | 01.05.2025            | nein    |
| Bewertung         | 5                     | nein    |
| Schwierigkeit     | 2                     | nein    |
| Eintritt EUR      | 3.00                  | nein    |
| Dauer             | 2,5 Std.              | nein    |
| Wiederbesuchen    | ja / nein / vielleicht| nein    |
| Tags              | Familie,Herbst        | nein    |
| Notizen           | Toller Ausflug        | nein    |
| Lat               | 47.593900             | nein    |
| Lng               | 11.089500             | nein    |

Vorlage herunterladen: `GET /backend/api/import.php?action=template`

---

## Sicherheits-Checkliste vor Produktivbetrieb

- [ ] HTTPS aktivieren und HTTP-Redirect in `.htaccess` einkommentieren
- [ ] `backend/config.php` ist nicht öffentlich erreichbar (liegt außerhalb des Web-Roots oder per `.htaccess` geschützt)
- [ ] Starkes Datenbankpasswort gesetzt
- [ ] `uploads/`-Ordner darf keine PHP-Dateien ausführen (ggf. eigene `.htaccess` mit `php_flag engine off`)
- [ ] Fehlerausgabe in PHP deaktivieren: `display_errors = Off` in `php.ini` oder per `.htaccess`
- [ ] Testnutzer (`test@example.com`) vor Produktivbetrieb löschen oder Passwort ändern
- [ ] Regelmäßige Datenbank-Backups einrichten
