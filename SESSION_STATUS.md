# Projektstand — places2love
Zuletzt aktualisiert: 2026-05-03

## Was wurde gemacht
- Task 3: Backend-Fundament erstellt (`config.example.php`, `config.php`, `db.php`, `helpers.php`)
  - Unix-Socket-Unterstützung für Herd MySQL eingebaut
  - `config.php` liegt lokal nur und ist per .gitignore ausgeschlossen
- Task 4: Auth-API (`backend/api/auth.php`) mit Register, Login, Logout
  - Token-basierte Sessions (30 Tage), sichere Passwortverschlüsselung
- Task 5: Places-CRUD-API (`backend/api/places.php`)
  - Vollständiges CRUD: GET (Liste + Einzeln), POST, PUT, DELETE
  - Tags, Links, Fotos integriert, user-scoped
- Task 6: Upload-API (`backend/api/upload.php`)
  - GD-basiertes Resize auf max. 1800px (konfiguierbar)
  - Unterstützt JPEG, PNG, WebP, HEIC/HEIF
  - Speichert Foto-Metadaten in `place_photos` wenn `place_id` übergeben
- Task 7: CSV Import/Export (`backend/api/import.php`, `project/countries.php`)
  - Export: alle Places des Users als UTF-8-CSV mit BOM (Excel-kompatibel)
  - Template: Download einer Vorlage mit Beispielzeile
  - Import: POST mit CSV-Datei, Datumserkennung (TT.MM.JJJJ, JJJJ-MM-TT), Tags, Länder-Flags
  - Alle PHP 8.x Deprecation-Warnings behoben (fputcsv/str_getcsv escape-Parameter)
- Task 8: Frontend-Datenschicht (`project/p2l-data.jsx`)
  - 13 Kategorien (Natur, Sport, Kultur, Sonstiges) mit Emoji + Gruppe
  - 44 Länder mit Flaggen-Emoji
  - Kategorie-Farbgradienten als Foto-Fallback
  - Theme-Tokens (dark/light) — Fraunces + Inter
  - SVG-Icon-Helfer
  - Hilfsfunktionen: formatDate, formatEuros, todayISO
- Task 9: App-Shell + PWA (`index.html`, `sw.js`, Placeholder-Screens)
  - React 18 + Babel Standalone + Leaflet per CDN (kein Build-Step)
  - Service Worker mit Cache-First-Strategie (p2l-v1)
  - Haupt-App-Komponente: Auth-State, Places-Lade/Speicher/Löschen, Offline-Queue
  - Navigation (Liste/Karte/Statistik/Profil) mit Safe-Area-Unterstützung
  - Theme-Toggle (dark/light) per localStorage
- Tasks 10–15: Alle Screen-Komponenten implementiert
  - ScreenLogin, ScreenList, ScreenDetail, ScreenForm, ScreenMap, ScreenStats, ScreenProfile
- Task 16: Foto-Löschen-Endpoint in `backend/api/places.php`
  - `DELETE /places.php?photo=ID` löscht einzelnes Foto (Datei + DB-Eintrag)
  - Bugfix: `require_once` → `require` für config.php in DELETE-Blöcken (verhindert Warning)
- Task 17: .htaccess, README, Smoke-Test
  - `.htaccess` mit Cache-Control-Headern, MIME-Types, HTTPS-Redirect (auskommentiert)
  - `README.md` mit vollständiger Doku (Features, Tech Stack, Installation, CSV-Format, Sicherheits-Checkliste)
  - Smoke-Test bestanden: Login ✅, Places-Liste ✅, CSV-Export ✅

## Aktueller Stand
- **ALLE 17 TASKS ABGESCHLOSSEN** — places2love v1.0
- Letzte Commits:
  - `f083c04` feat: individual photo delete endpoint
  - `f168089` feat: root htaccess, README, smoke test complete — places2love v1.0

## Nächste Schritte
- Mapy.cz API-Key in `index.html` eintragen (`window.MAPKEY = '...'`)
- Datenbank auf Produktivserver anlegen und Konfiguration anpassen
- HTTPS-Redirect in `.htaccess` einkommentieren
- Testnutzer `test@example.com` auf Produktivserver entfernen oder Passwort ändern

## Offene Probleme / Blockaden
- `window.MAPKEY` in index.html enthält noch Platzhalter `DEIN_MAPYCZ_KEY`
- Karte funktioniert ohne gültigen Mapy.cz-Key nicht
