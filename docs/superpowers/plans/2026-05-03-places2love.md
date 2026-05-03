# places2love Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollständige PWA zum Erfassen, Bewerten und Kartografieren persönlicher Lieblingsorte (Natur & Kultur), Multi-User, offline-fähig, installierbar auf iPhone/Android.

**Architecture:** React 18 (Babel CDN, kein Build-Step) im Frontend, PHP 8 + MySQL im Backend — identisches Muster wie das Camperstop-Referenzprojekt unter `/Users/Jochen/Sites/localhost/Camperstop/camperstop`. Alle Screens als JSX-Komponenten in drei project/-Dateien, State-Management und API-Calls im `<script type="text/babel">` in index.html.

**Tech Stack:** React 18 (Babel CDN) · PHP 8 · MySQL/MariaDB · mapy.cz API + Leaflet/OSM · Service Worker · Bearer Token Auth · Laravel Herd / all-inkl.com

---

## Dateiübersicht

| Datei | Verantwortung |
|---|---|
| `index.html` | App-Shell, React-Bootstrap, Haupt-App-Komponente mit State + API-Calls |
| `manifest.webmanifest` | PWA-Metadaten |
| `sw.js` | Service Worker, Cache-First |
| `icon.svg` | App-Icon (Herz + Pin) |
| `.htaccess` | URL-Sicherheit, HTTPS-Redirect |
| `backend/config.example.php` | Konfigurationsvorlage |
| `backend/db.php` | PDO-Verbindung (Singleton) |
| `backend/helpers.php` | CORS, jsonOut(), getAuthUser(), bodyJson() |
| `backend/api/auth.php` | POST ?action=register/login/logout |
| `backend/api/places.php` | GET/POST/PUT/DELETE Orte + Tags + Links + Fotos-Liste |
| `backend/api/upload.php` | POST Foto-Upload mit GD-Resize |
| `backend/api/import.php` | POST CSV-Import, GET CSV-Export, GET Vorlage |
| `project/p2l-data.jsx` | CATEGORIES, COUNTRIES, ICONS, THEMES (dark+light) |
| `project/p2l-screens.jsx` | ScreenLogin, ScreenList, ScreenDetail, ScreenForm, ScreenStats, ScreenProfile |
| `project/p2l-extras.jsx` | MapView, FilterPanel, PhotoUploader, StarPicker, DotPicker |
| `project/backend/schema.sql` | Vollständiges MySQL-Schema |

---

## Phase 1 — Backend

### Task 1: Projektstruktur & statische Dateien

**Dateien:**
- Anlegen: `uploads/.gitkeep`
- Anlegen: `uploads/.htaccess`
- Anlegen: `backend/.htaccess`
- Anlegen: `.gitignore`
- Anlegen: `icon.svg`
- Anlegen: `manifest.webmanifest`

- [ ] **Schritt 1: Verzeichnisse anlegen**

```bash
cd /Users/Jochen/Sites/localhost/places2love
mkdir -p backend/api project/backend uploads
touch uploads/.gitkeep
```

- [ ] **Schritt 2: uploads/.htaccess anlegen** (verhindert PHP-Ausführung in uploads)

Inhalt `uploads/.htaccess`:
```apache
php_flag engine off
Options -ExecCGI
AddHandler cgi-script .php .pl .py .jsp .asp .sh .cgi
```

- [ ] **Schritt 3: backend/.htaccess anlegen**

Inhalt `backend/.htaccess`:
```apache
Options -Indexes
<Files "config.php">
  Order allow,deny
  Deny from all
</Files>
```

- [ ] **Schritt 4: .gitignore anlegen**

```
backend/config.php
uploads/*
!uploads/.gitkeep
!uploads/.htaccess
.DS_Store
.superpowers/
```

- [ ] **Schritt 5: icon.svg anlegen** (Herz mit Pin-Stil, Grün-Töne)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1c2420"/>
  <path d="M50 75 C50 75 20 52 20 35 C20 24 28 17 38 17 C43 17 48 20 50 24 C52 20 57 17 62 17 C72 17 80 24 80 35 C80 52 50 75 50 75Z" fill="#4a7c59"/>
  <circle cx="50" cy="35" r="8" fill="#c8a840"/>
</svg>
```

- [ ] **Schritt 6: manifest.webmanifest anlegen**

```json
{
  "name": "places2love",
  "short_name": "places2love",
  "description": "Persönliche Lieblingsorte",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#1c2420",
  "theme_color": "#1c2420",
  "orientation": "portrait",
  "icons": [
    { "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }
  ]
}
```

- [ ] **Schritt 7: Commit**

```bash
git init
git add .gitignore icon.svg manifest.webmanifest uploads/.gitkeep uploads/.htaccess backend/.htaccess
git commit -m "chore: project skeleton"
```

---

### Task 2: Datenbankschema

**Dateien:**
- Anlegen: `project/backend/schema.sql`

- [ ] **Schritt 1: schema.sql anlegen**

```sql
-- places2love — MySQL 5.7+ schema
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(190) NOT NULL,
  name          VARCHAR(120) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  locale        VARCHAR(10)  NOT NULL DEFAULT 'de',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token      CHAR(64) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (token),
  KEY idx_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS places (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  title           VARCHAR(200) NOT NULL,
  category        VARCHAR(60)  NOT NULL DEFAULT 'Berg',
  custom_category VARCHAR(100) NOT NULL DEFAULT '',
  country         VARCHAR(80)  NOT NULL DEFAULT '',
  country_flag    VARCHAR(8)   NOT NULL DEFAULT '',
  region          VARCHAR(120) NOT NULL DEFAULT '',
  lat             DECIMAL(9,6) DEFAULT NULL,
  lng             DECIMAL(9,6) DEFAULT NULL,
  visited_on      DATE NOT NULL,
  rating          TINYINT UNSIGNED NOT NULL DEFAULT 0,
  difficulty      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  revisit         ENUM('ja','vielleicht','nein') NOT NULL DEFAULT 'vielleicht',
  entry_cents     INT UNSIGNED NOT NULL DEFAULT 0,
  duration        VARCHAR(60)  NOT NULL DEFAULT '',
  note            TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_visited (user_id, visited_on),
  CONSTRAINT fk_places_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS place_tags (
  place_id INT UNSIGNED NOT NULL,
  tag      VARCHAR(60)  NOT NULL,
  PRIMARY KEY (place_id, tag),
  CONSTRAINT fk_tag_place FOREIGN KEY (place_id)
    REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS place_links (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  place_id   INT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  label      VARCHAR(120) NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_place_link (place_id, sort_order),
  CONSTRAINT fk_link_place FOREIGN KEY (place_id)
    REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS place_photos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  place_id   INT UNSIGNED NOT NULL,
  path       VARCHAR(400) NOT NULL,
  width      INT UNSIGNED DEFAULT NULL,
  height     INT UNSIGNED DEFAULT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_place_photo (place_id, sort_order),
  CONSTRAINT fk_photo_place FOREIGN KEY (place_id)
    REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Schritt 2: Schema in lokale Datenbank importieren**

```bash
# Datenbank anlegen (einmalig)
mysql -u root -e "CREATE DATABASE IF NOT EXISTS places2love CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root places2love < project/backend/schema.sql
# Prüfen:
mysql -u root places2love -e "SHOW TABLES;"
```

Erwartete Ausgabe: `places · place_links · place_photos · place_tags · sessions · users`

- [ ] **Schritt 3: Commit**

```bash
git add project/backend/schema.sql
git commit -m "feat: database schema"
```

---

### Task 3: Backend-Fundament (config, db, helpers)

**Dateien:**
- Anlegen: `backend/config.example.php`
- Anlegen: `backend/config.php` (lokal, nicht committen)
- Anlegen: `backend/db.php`
- Anlegen: `backend/helpers.php`

- [ ] **Schritt 1: config.example.php anlegen**

```php
<?php
return [
  'db_host'      => 'localhost',
  'db_name'      => 'places2love',
  'db_user'      => 'root',
  'db_pass'      => '',
  'upload_dir'   => '/absoluter/pfad/zu/places2love/uploads',
  'upload_url'   => '/places2love/uploads',
  'upload_max'   => 10485760,
  'image_max_px' => 1800,
  'mapycz_key'   => 'DEIN_MAPYCZ_KEY',
];
```

- [ ] **Schritt 2: config.php lokal anlegen** (Werte für Herd anpassen)

```php
<?php
return [
  'db_host'      => 'localhost',
  'db_name'      => 'places2love',
  'db_user'      => 'root',
  'db_pass'      => '',
  'upload_dir'   => '/Users/Jochen/Sites/localhost/places2love/uploads',
  'upload_url'   => '/uploads',
  'upload_max'   => 10485760,
  'image_max_px' => 1800,
  'mapycz_key'   => 'DEIN_KEY',
];
```

- [ ] **Schritt 3: backend/db.php anlegen**

```php
<?php
function getDB(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $cfg = require __DIR__ . '/config.php';
  $dsn = "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4";
  $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
  ]);
  return $pdo;
}
```

- [ ] **Schritt 4: backend/helpers.php anlegen**

```php
<?php
require_once __DIR__ . '/db.php';

function setCors(): void {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
  header("Access-Control-Allow-Origin: $origin");
  header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
  header("Access-Control-Allow-Headers: Content-Type, Authorization");
  header("Access-Control-Allow-Credentials: true");
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

function jsonOut(mixed $data, int $code = 200): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function bodyJson(): array {
  return json_decode(file_get_contents('php://input'), true) ?? [];
}

function getAuthUser(): array {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/^Bearer\s+(\S+)$/', $header, $m)) {
    jsonOut(['error' => 'Unauthorized'], 401);
  }
  $db   = getDB();
  $stmt = $db->prepare(
    "SELECT u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > NOW()"
  );
  $stmt->execute([$m[1]]);
  $user = $stmt->fetch();
  if (!$user) jsonOut(['error' => 'Unauthorized'], 401);
  return $user;
}
```

- [ ] **Schritt 5: Verbindung testen**

```bash
php -r "require 'backend/db.php'; $db = getDB(); echo 'OK' . PHP_EOL;"
```

Erwartete Ausgabe: `OK`

- [ ] **Schritt 6: Commit**

```bash
git add backend/config.example.php backend/db.php backend/helpers.php
git commit -m "feat: backend foundation — db + helpers"
```

---

### Task 4: Auth API

**Dateien:**
- Anlegen: `backend/api/auth.php`

- [ ] **Schritt 1: backend/api/auth.php anlegen**

```php
<?php
require_once __DIR__ . '/../../backend/helpers.php';
setCors();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = getDB();

// ── Register ──────────────────────────────────────────────────
if ($method === 'POST' && $action === 'register') {
  $b     = bodyJson();
  $email = trim($b['email'] ?? '');
  $name  = trim($b['name']  ?? '');
  $pass  = $b['password'] ?? '';
  if (!$email || !$pass)
    jsonOut(['error' => 'E-Mail und Passwort erforderlich'], 400);
  if (!filter_var($email, FILTER_VALIDATE_EMAIL))
    jsonOut(['error' => 'Ungültige E-Mail-Adresse'], 400);
  $chk = $db->prepare("SELECT id FROM users WHERE email = ?");
  $chk->execute([$email]);
  if ($chk->fetch()) jsonOut(['error' => 'E-Mail bereits vergeben'], 409);
  $hash = password_hash($pass, PASSWORD_DEFAULT);
  $db->prepare("INSERT INTO users (email, name, password_hash) VALUES (?,?,?)")
     ->execute([$email, $name, $hash]);
  $uid   = (int)$db->lastInsertId();
  $token = issueToken($db, $uid);
  jsonOut(['token' => $token, 'user' => ['id' => $uid, 'email' => $email, 'name' => $name]]);
}

// ── Login ─────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
  $b    = bodyJson();
  $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
  $stmt->execute([trim($b['email'] ?? '')]);
  $user = $stmt->fetch();
  if (!$user || !password_verify($b['password'] ?? '', $user['password_hash']))
    jsonOut(['error' => 'E-Mail oder Passwort falsch'], 401);
  $token = issueToken($db, $user['id']);
  unset($user['password_hash']);
  jsonOut(['token' => $token, 'user' => $user]);
}

// ── Logout ────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'logout') {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/^Bearer\s+(\S+)$/', $header, $m)) {
    $db->prepare("DELETE FROM sessions WHERE token = ?")->execute([$m[1]]);
  }
  jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Not found'], 404);

// ── Helper ────────────────────────────────────────────────────
function issueToken(PDO $db, int $uid): string {
  $token   = bin2hex(random_bytes(32));
  $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
  $db->prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)")
     ->execute([$token, $uid, $expires]);
  return $token;
}
```

- [ ] **Schritt 2: PHP-Server starten und Register testen**

```bash
cd /Users/Jochen/Sites/localhost/places2love
php -S localhost:8001 &

curl -s -X POST "http://localhost:8001/backend/api/auth.php?action=register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Jochen","password":"test123"}'
```

Erwartete Ausgabe: `{"token":"...64-Zeichen...","user":{"id":1,"email":"test@example.com","name":"Jochen"}}`

- [ ] **Schritt 3: Login testen**

```bash
curl -s -X POST "http://localhost:8001/backend/api/auth.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Erwartete Ausgabe: JSON mit `token` und `user`-Objekt

- [ ] **Schritt 4: Falsches Passwort testen**

```bash
curl -s -X POST "http://localhost:8001/backend/api/auth.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"FALSCH"}'
```

Erwartete Ausgabe: `{"error":"E-Mail oder Passwort falsch"}` mit HTTP 401

- [ ] **Schritt 5: Commit**

```bash
git add backend/api/auth.php
git commit -m "feat: auth API — register, login, logout"
```

---

### Task 5: Places API (CRUD)

**Dateien:**
- Anlegen: `backend/api/places.php`

- [ ] **Schritt 1: places.php anlegen**

```php
<?php
require_once __DIR__ . '/../../backend/helpers.php';
setCors();

$method = $_SERVER['REQUEST_METHOD'];
$user   = getAuthUser();
$uid    = (int)$user['id'];
$db     = getDB();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// ── GET alle Orte ─────────────────────────────────────────────
if ($method === 'GET' && !$id) {
  $rows = $db->prepare(
    "SELECT p.*,
       (SELECT GROUP_CONCAT(tag ORDER BY tag SEPARATOR ',')
        FROM place_tags WHERE place_id = p.id) AS tags_raw,
       (SELECT GROUP_CONCAT(CONCAT(id,':',url,':',label) ORDER BY sort_order SEPARATOR '|')
        FROM place_links WHERE place_id = p.id) AS links_raw,
       (SELECT path FROM place_photos WHERE place_id = p.id ORDER BY sort_order LIMIT 1) AS cover
     FROM places p
     WHERE p.user_id = ?
     ORDER BY p.visited_on DESC"
  );
  $rows->execute([$uid]);
  $places = array_map('hydrate', $rows->fetchAll());
  jsonOut($places);
}

// ── GET einzelner Ort ─────────────────────────────────────────
if ($method === 'GET' && $id) {
  $stmt = $db->prepare("SELECT * FROM places WHERE id = ? AND user_id = ?");
  $stmt->execute([$id, $uid]);
  $place = $stmt->fetch();
  if (!$place) jsonOut(['error' => 'Not found'], 404);

  $tags = $db->prepare("SELECT tag FROM place_tags WHERE place_id = ? ORDER BY tag");
  $tags->execute([$id]);
  $place['tags'] = array_column($tags->fetchAll(), 'tag');

  $links = $db->prepare("SELECT id, url, label, sort_order FROM place_links WHERE place_id = ? ORDER BY sort_order");
  $links->execute([$id]);
  $place['links'] = $links->fetchAll();

  $photos = $db->prepare("SELECT id, path, width, height, sort_order FROM place_photos WHERE place_id = ? ORDER BY sort_order");
  $photos->execute([$id]);
  $place['photos'] = $photos->fetchAll();

  jsonOut($place);
}

// ── POST neuer Ort ────────────────────────────────────────────
if ($method === 'POST') {
  $b = bodyJson();
  $stmt = $db->prepare(
    "INSERT INTO places
       (user_id, title, category, custom_category, country, country_flag, region,
        lat, lng, visited_on, rating, difficulty, revisit, entry_cents, duration, note)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  );
  $stmt->execute([
    $uid,
    $b['title']           ?? '',
    $b['category']        ?? 'Berg',
    $b['custom_category'] ?? '',
    $b['country']         ?? '',
    $b['country_flag']    ?? '',
    $b['region']          ?? '',
    isset($b['lat']) && $b['lat'] !== '' ? (float)$b['lat'] : null,
    isset($b['lng']) && $b['lng'] !== '' ? (float)$b['lng'] : null,
    $b['visited_on']      ?? date('Y-m-d'),
    (int)($b['rating']    ?? 0),
    (int)($b['difficulty']?? 0),
    $b['revisit']         ?? 'vielleicht',
    (int)round(((float)($b['entry_euros'] ?? 0)) * 100),
    $b['duration']        ?? '',
    $b['note']            ?? null,
  ]);
  $newId = (int)$db->lastInsertId();
  saveTags($db, $newId, $b['tags'] ?? []);
  saveLinks($db, $newId, $b['links'] ?? []);
  jsonOut(['id' => $newId]);
}

// ── PUT Ort aktualisieren ─────────────────────────────────────
if ($method === 'PUT' && $id) {
  $chk = $db->prepare("SELECT id FROM places WHERE id = ? AND user_id = ?");
  $chk->execute([$id, $uid]);
  if (!$chk->fetch()) jsonOut(['error' => 'Not found'], 404);

  $b = bodyJson();
  $db->prepare(
    "UPDATE places SET
       title=?, category=?, custom_category=?, country=?, country_flag=?, region=?,
       lat=?, lng=?, visited_on=?, rating=?, difficulty=?, revisit=?,
       entry_cents=?, duration=?, note=?
     WHERE id = ?"
  )->execute([
    $b['title']           ?? '',
    $b['category']        ?? 'Berg',
    $b['custom_category'] ?? '',
    $b['country']         ?? '',
    $b['country_flag']    ?? '',
    $b['region']          ?? '',
    isset($b['lat']) && $b['lat'] !== '' ? (float)$b['lat'] : null,
    isset($b['lng']) && $b['lng'] !== '' ? (float)$b['lng'] : null,
    $b['visited_on']      ?? date('Y-m-d'),
    (int)($b['rating']    ?? 0),
    (int)($b['difficulty']?? 0),
    $b['revisit']         ?? 'vielleicht',
    (int)round(((float)($b['entry_euros'] ?? 0)) * 100),
    $b['duration']        ?? '',
    $b['note']            ?? null,
    $id,
  ]);
  $db->prepare("DELETE FROM place_tags  WHERE place_id = ?")->execute([$id]);
  $db->prepare("DELETE FROM place_links WHERE place_id = ?")->execute([$id]);
  saveTags($db, $id, $b['tags'] ?? []);
  saveLinks($db, $id, $b['links'] ?? []);
  jsonOut(['ok' => true]);
}

// ── DELETE Ort löschen ────────────────────────────────────────
if ($method === 'DELETE' && $id) {
  $cfg    = require __DIR__ . '/../../backend/config.php';
  $photos = $db->prepare("SELECT path FROM place_photos WHERE place_id = ?");
  $photos->execute([$id]);
  foreach ($photos->fetchAll() as $p) {
    $file = rtrim($cfg['upload_dir'], '/') . '/' . ltrim($p['path'], '/');
    if (file_exists($file)) unlink($file);
  }
  $db->prepare("DELETE FROM places WHERE id = ? AND user_id = ?")->execute([$id, $uid]);
  jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Not found'], 404);

// ── Hilfsfunktionen ───────────────────────────────────────────
function saveTags(PDO $db, int $placeId, array $tags): void {
  $stmt = $db->prepare("INSERT IGNORE INTO place_tags (place_id, tag) VALUES (?,?)");
  foreach (array_filter(array_unique(array_map('trim', $tags))) as $tag) {
    $stmt->execute([$placeId, $tag]);
  }
}

function saveLinks(PDO $db, int $placeId, array $links): void {
  $stmt = $db->prepare(
    "INSERT INTO place_links (place_id, url, label, sort_order) VALUES (?,?,?,?)"
  );
  foreach (array_values($links) as $i => $lnk) {
    $url = trim($lnk['url'] ?? '');
    if (!$url) continue;
    $stmt->execute([$placeId, $url, trim($lnk['label'] ?? ''), $i]);
  }
}

function hydrate(array $row): array {
  $row['tags']  = $row['tags_raw']  ? explode(',', $row['tags_raw'])  : [];
  $row['links'] = [];
  if ($row['links_raw']) {
    foreach (explode('|', $row['links_raw']) as $l) {
      [$lid, $url, $label] = explode(':', $l, 3);
      $row['links'][] = ['id' => (int)$lid, 'url' => $url, 'label' => $label];
    }
  }
  unset($row['tags_raw'], $row['links_raw']);
  return $row;
}
```

- [ ] **Schritt 2: Token aus Login-Test speichern und Ort anlegen**

```bash
TOKEN=$(curl -s -X POST "http://localhost:8001/backend/api/auth.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST "http://localhost:8001/backend/api/places.php" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title":"Kuhfluchtwasserfälle","category":"Wasserfall",
    "country":"Deutschland","country_flag":"🇩🇪","region":"Bayern",
    "visited_on":"2025-05-01","rating":5,"difficulty":2,
    "revisit":"ja","entry_euros":3.00,"duration":"2,5 Std.",
    "note":"Wunderschön!","tags":["Familie","Herbst"],"links":[]
  }'
```

Erwartete Ausgabe: `{"id":1}`

- [ ] **Schritt 3: Alle Orte abrufen**

```bash
curl -s "http://localhost:8001/backend/api/places.php" \
  -H "Authorization: Bearer $TOKEN"
```

Erwartete Ausgabe: JSON-Array mit einem Ort, Felder stimmen, `tags: ["Familie","Herbst"]`

- [ ] **Schritt 4: Einzelnen Ort abrufen**

```bash
curl -s "http://localhost:8001/backend/api/places.php?id=1" \
  -H "Authorization: Bearer $TOKEN"
```

Erwartete Ausgabe: Vollständiger Ort inkl. `photos: []`, `links: []`, `tags`

- [ ] **Schritt 5: Commit**

```bash
git add backend/api/places.php
git commit -m "feat: places CRUD API"
```

---

### Task 6: Upload API

**Dateien:**
- Anlegen: `backend/api/upload.php`

- [ ] **Schritt 1: upload.php anlegen**

```php
<?php
require_once __DIR__ . '/../../backend/helpers.php';
setCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'POST required'], 405);
$user    = getAuthUser();
$db      = getDB();
$cfg     = require __DIR__ . '/../../backend/config.php';
$placeId = (int)($_POST['place_id'] ?? 0);

// Prüfen ob der Ort dem User gehört
if ($placeId) {
  $chk = $db->prepare("SELECT id FROM places WHERE id = ? AND user_id = ?");
  $chk->execute([$placeId, $user['id']]);
  if (!$chk->fetch()) jsonOut(['error' => 'Forbidden'], 403);
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
  jsonOut(['error' => 'Kein Foto übertragen'], 400);
}

$file     = $_FILES['photo'];
$maxBytes = $cfg['upload_max'];
if ($file['size'] > $maxBytes) jsonOut(['error' => 'Datei zu groß (max 10 MB)'], 413);

$mime = mime_content_type($file['tmp_name']);
$ext  = match ($mime) {
  'image/jpeg' => 'jpg',
  'image/png'  => 'png',
  'image/webp' => 'webp',
  'image/heic' => 'jpg',
  default       => jsonOut(['error' => 'Nur JPEG, PNG, WebP erlaubt'], 415),
};

$filename  = date('Ymd_His_') . bin2hex(random_bytes(4)) . '.' . $ext;
$uploadDir = rtrim($cfg['upload_dir'], '/');
$destPath  = $uploadDir . '/' . $filename;

// Resize mit GD
$maxPx = $cfg['image_max_px'];
[$origW, $origH] = getimagesize($file['tmp_name']);
$scale  = $maxPx / max($origW, $origH, $maxPx);
$newW   = (int)round($origW * $scale);
$newH   = (int)round($origH * $scale);

$src = match ($mime) {
  'image/png'  => imagecreatefrompng($file['tmp_name']),
  default       => imagecreatefromjpeg($file['tmp_name']),
};
$dst = imagecreatetruecolor($newW, $newH);
imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
imagejpeg($dst, $destPath, 85);
imagedestroy($src);
imagedestroy($dst);

$relPath = $filename;

// Foto-Eintrag in DB (nur wenn place_id übergeben)
if ($placeId) {
  $maxSort = $db->prepare("SELECT COALESCE(MAX(sort_order),0)+1 FROM place_photos WHERE place_id = ?");
  $maxSort->execute([$placeId]);
  $sort = (int)$maxSort->fetchColumn();
  $db->prepare(
    "INSERT INTO place_photos (place_id, path, width, height, sort_order) VALUES (?,?,?,?,?)"
  )->execute([$placeId, $relPath, $newW, $newH, $sort]);
  $photoId = (int)$db->lastInsertId();
  jsonOut(['id' => $photoId, 'path' => $relPath, 'url' => $cfg['upload_url'] . '/' . $relPath]);
}

jsonOut(['path' => $relPath, 'url' => $cfg['upload_url'] . '/' . $relPath]);
```

- [ ] **Schritt 2: Upload testen** (mit einem beliebigen JPEG)

```bash
curl -s -X POST "http://localhost:8001/backend/api/upload.php" \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/path/to/test.jpg" \
  -F "place_id=1"
```

Erwartete Ausgabe: `{"id":1,"path":"20250503_120000_abcd1234.jpg","url":"/uploads/20250503_120000_abcd1234.jpg"}`

- [ ] **Schritt 3: Foto in uploads/ prüfen**

```bash
ls /Users/Jochen/Sites/localhost/places2love/uploads/
```

Erwartete Ausgabe: Die hochgeladene Datei ist vorhanden

- [ ] **Schritt 4: Commit**

```bash
git add backend/api/upload.php
git commit -m "feat: photo upload API with GD resize"
```

---

### Task 7: Import/Export API

**Dateien:**
- Anlegen: `backend/api/import.php`

- [ ] **Schritt 1: import.php anlegen**

```php
<?php
require_once __DIR__ . '/../../backend/helpers.php';
setCors();

$method = $_SERVER['REQUEST_METHOD'];
$user   = getAuthUser();
$uid    = (int)$user['id'];
$db     = getDB();
$action = $_GET['action'] ?? '';

// ── CSV-Export ────────────────────────────────────────────────
if ($method === 'GET' && $action === 'export') {
  $stmt = $db->prepare(
    "SELECT p.*,
       (SELECT GROUP_CONCAT(tag SEPARATOR ',') FROM place_tags WHERE place_id = p.id) AS tags_raw
     FROM places p WHERE p.user_id = ? ORDER BY p.visited_on DESC"
  );
  $stmt->execute([$uid]);
  $rows = $stmt->fetchAll();

  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="places2love_export_' . date('Ymd') . '.csv"');
  echo "\xEF\xBB\xBF"; // UTF-8 BOM für Excel

  $out = fopen('php://output', 'w');
  fputcsv($out, ['Name','Kategorie','Freie Kategorie','Land','Region','Besuchsdatum',
    'Bewertung','Schwierigkeit','Eintritt EUR','Dauer','Wiederbesuchen','Tags','Notizen','Lat','Lng'], ';');
  foreach ($rows as $r) {
    fputcsv($out, [
      $r['title'], $r['category'], $r['custom_category'],
      $r['country'], $r['region'],
      $r['visited_on'] ? date('d.m.Y', strtotime($r['visited_on'])) : '',
      $r['rating'], $r['difficulty'],
      $r['entry_cents'] ? number_format($r['entry_cents'] / 100, 2, '.', '') : '',
      $r['duration'], $r['revisit'],
      $r['tags_raw'] ?? '', $r['note'] ?? '',
      $r['lat'] ?? '', $r['lng'] ?? '',
    ], ';');
  }
  fclose($out);
  exit;
}

// ── CSV-Vorlage ───────────────────────────────────────────────
if ($method === 'GET' && $action === 'template') {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="places2love_vorlage.csv"');
  echo "\xEF\xBB\xBF";
  $out = fopen('php://output', 'w');
  fputcsv($out, ['Name','Kategorie','Freie Kategorie','Land','Region','Besuchsdatum',
    'Bewertung','Schwierigkeit','Eintritt EUR','Dauer','Wiederbesuchen','Tags','Notizen','Lat','Lng'], ';');
  fputcsv($out, ['Kuhfluchtwasserfälle','Wasserfall','','Deutschland','Bayern',
    '01.05.2025','5','2','3.00','2,5 Std.','ja','Familie,Herbst','Toller Ausflug','47.593900','11.089500'], ';');
  fclose($out);
  exit;
}

// ── CSV-Import ────────────────────────────────────────────────
if ($method === 'POST' && $action === 'import') {
  if (!isset($_FILES['csv']) || $_FILES['csv']['error'] !== UPLOAD_ERR_OK)
    jsonOut(['error' => 'Keine CSV-Datei'], 400);

  $content = file_get_contents($_FILES['csv']['tmp_name']);
  // BOM entfernen
  $content = ltrim($content, "\xEF\xBB\xBF");
  $lines   = preg_split('/\r\n|\r|\n/', trim($content));
  array_shift($lines); // Header-Zeile überspringen

  $COUNTRIES = require __DIR__ . '/../countries.php';
  $inserted  = 0;
  $errors    = [];

  foreach ($lines as $i => $line) {
    if (!trim($line)) continue;
    $col = str_getcsv($line, ';');
    if (count($col) < 14) { $errors[] = "Zeile " . ($i+2) . ": zu wenig Felder"; continue; }

    [$title, $cat, $customCat, $country, $region, $dateStr,
     $rating, $difficulty, $entry, $duration, $revisit, $tags, $note, $lat, $lng] = array_pad($col, 15, '');

    $date = parseDate(trim($dateStr));
    if (!$date) { $errors[] = "Zeile " . ($i+2) . ": ungültiges Datum '$dateStr'"; continue; }

    $flag = $COUNTRIES[trim($country)] ?? '';
    $revisitVal = in_array(trim($revisit), ['ja','vielleicht','nein']) ? trim($revisit) : 'vielleicht';

    $db->prepare(
      "INSERT INTO places
         (user_id,title,category,custom_category,country,country_flag,region,
          lat,lng,visited_on,rating,difficulty,revisit,entry_cents,duration,note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    )->execute([
      $uid, trim($title),
      trim($cat) ?: 'Berg', trim($customCat), trim($country), $flag, trim($region),
      trim($lat) !== '' ? (float)$lat : null,
      trim($lng) !== '' ? (float)$lng : null,
      $date,
      min(5, max(0, (int)$rating)),
      min(5, max(0, (int)$difficulty)),
      $revisitVal,
      (int)round((float)str_replace(',', '.', $entry) * 100),
      trim($duration), trim($note) ?: null,
    ]);
    $newId = (int)$db->lastInsertId();

    if (trim($tags)) {
      $tagList = array_filter(array_map('trim', explode(',', $tags)));
      $tStmt   = $db->prepare("INSERT IGNORE INTO place_tags (place_id, tag) VALUES (?,?)");
      foreach ($tagList as $t) $tStmt->execute([$newId, $t]);
    }
    $inserted++;
  }

  jsonOut(['inserted' => $inserted, 'errors' => $errors]);
}

jsonOut(['error' => 'Not found'], 404);

function parseDate(string $s): ?string {
  foreach (['d.m.Y', 'd.m.y', 'Y-m-d'] as $fmt) {
    $d = DateTime::createFromFormat($fmt, $s);
    if ($d) return $d->format('Y-m-d');
  }
  return null;
}
```

- [ ] **Schritt 2: countries.php anlegen** (wird vom Import gebraucht)

Datei `project/countries.php` mit Mapping `'Deutschland' => '🇩🇪'` usw. — vollständige Liste aus den Camperstop EU_COUNTRIES übernehmen:

```php
<?php
return [
  'Albanien' => '🇦🇱', 'Andorra' => '🇦🇩', 'Belgien' => '🇧🇪',
  'Bosnien-Herzegowina' => '🇧🇦', 'Bulgarien' => '🇧🇬', 'Dänemark' => '🇩🇰',
  'Deutschland' => '🇩🇪', 'Estland' => '🇪🇪', 'Finnland' => '🇫🇮',
  'Frankreich' => '🇫🇷', 'Griechenland' => '🇬🇷', 'Großbritannien' => '🇬🇧',
  'Irland' => '🇮🇪', 'Island' => '🇮🇸', 'Italien' => '🇮🇹',
  'Kosovo' => '🇽🇰', 'Kroatien' => '🇭🇷', 'Lettland' => '🇱🇻',
  'Liechtenstein' => '🇱🇮', 'Litauen' => '🇱🇹', 'Luxemburg' => '🇱🇺',
  'Malta' => '🇲🇹', 'Marokko' => '🇲🇦', 'Montenegro' => '🇲🇪',
  'Niederlande' => '🇳🇱', 'Nordmazedonien' => '🇲🇰', 'Norwegen' => '🇳🇴',
  'Österreich' => '🇦🇹', 'Polen' => '🇵🇱', 'Portugal' => '🇵🇹',
  'Rumänien' => '🇷🇴', 'Schweden' => '🇸🇪', 'Schweiz' => '🇨🇭',
  'Serbien' => '🇷🇸', 'Slowakei' => '🇸🇰', 'Slowenien' => '🇸🇮',
  'Spanien' => '🇪🇸', 'Tschechien' => '🇨🇿', 'Tunesien' => '🇹🇳',
  'Türkei' => '🇹🇷', 'Ukraine' => '🇺🇦', 'Ungarn' => '🇭🇺',
  'Weißrussland' => '🇧🇾', 'Zypern' => '🇨🇾',
];
```

- [ ] **Schritt 3: Export testen**

```bash
curl -s "http://localhost:8001/backend/api/import.php?action=export" \
  -H "Authorization: Bearer $TOKEN" -o export.csv
cat export.csv
```

Erwartete Ausgabe: CSV mit Header-Zeile und einem Datensatz (der in Task 5 angelegte Ort)

- [ ] **Schritt 4: Commit**

```bash
git add backend/api/import.php project/countries.php
git commit -m "feat: CSV import and export API"
```

---

## Phase 2 — Frontend-Fundament

### Task 8: p2l-data.jsx (Konstanten, Theme, Icons)

**Dateien:**
- Anlegen: `project/p2l-data.jsx`

- [ ] **Schritt 1: p2l-data.jsx anlegen**

```jsx
// ─── Kategorien ──────────────────────────────────────────────
const CATEGORIES = [
  // Natur/Landschaft
  { id: 'Berg',          label: 'Berg',          emoji: '⛰️',  group: 'Natur' },
  { id: 'Schlucht',      label: 'Schlucht',       emoji: '🏔️', group: 'Natur' },
  { id: 'Wasserfall',    label: 'Wasserfall',     emoji: '💧',  group: 'Natur' },
  { id: 'Felsformation', label: 'Felsformation',  emoji: '🪨',  group: 'Natur' },
  { id: 'Naturdenkmal',  label: 'Naturdenkmal',   emoji: '🌳',  group: 'Natur' },
  { id: 'See',           label: 'See',            emoji: '🏞️', group: 'Natur' },
  { id: 'Strand',        label: 'Strand',         emoji: '🏖️', group: 'Natur' },
  { id: 'Höhle',         label: 'Höhle',          emoji: '🕳️', group: 'Natur' },
  // Wandern/Sport
  { id: 'Wanderung',     label: 'Wanderung',      emoji: '🥾',  group: 'Sport' },
  { id: 'Klettersteig',  label: 'Klettersteig',   emoji: '🧗',  group: 'Sport' },
  // Kultur
  { id: 'Kirche',        label: 'Kirche/Kloster', emoji: '⛪',  group: 'Kultur' },
  { id: 'Burg',          label: 'Burg/Schloss',   emoji: '🏰',  group: 'Kultur' },
  // Sonstiges
  { id: 'Sonstiges',     label: 'Freie Kategorie',emoji: '📍',  group: 'Sonstige' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ─── Länder ───────────────────────────────────────────────────
const COUNTRIES = [
  { name: 'Deutschland',         flag: '🇩🇪' },
  { name: 'Österreich',          flag: '🇦🇹' },
  { name: 'Schweiz',             flag: '🇨🇭' },
  { name: 'Italien',             flag: '🇮🇹' },
  { name: 'Frankreich',          flag: '🇫🇷' },
  { name: 'Spanien',             flag: '🇪🇸' },
  { name: 'Portugal',            flag: '🇵🇹' },
  { name: 'Griechenland',        flag: '🇬🇷' },
  { name: 'Kroatien',            flag: '🇭🇷' },
  { name: 'Slowenien',           flag: '🇸🇮' },
  { name: 'Tschechien',          flag: '🇨🇿' },
  { name: 'Polen',               flag: '🇵🇱' },
  { name: 'Norwegen',            flag: '🇳🇴' },
  { name: 'Schweden',            flag: '🇸🇪' },
  { name: 'Niederlande',         flag: '🇳🇱' },
  { name: 'Belgien',             flag: '🇧🇪' },
  { name: 'Dänemark',            flag: '🇩🇰' },
  { name: 'Ungarn',              flag: '🇭🇺' },
  { name: 'Rumänien',            flag: '🇷🇴' },
  { name: 'Bulgarien',           flag: '🇧🇬' },
  { name: 'Türkei',              flag: '🇹🇷' },
  { name: 'Marokko',             flag: '🇲🇦' },
  { name: 'Albanien',            flag: '🇦🇱' },
  { name: 'Bosnien-Herzegowina', flag: '🇧🇦' },
  { name: 'Montenegro',          flag: '🇲🇪' },
  { name: 'Serbien',             flag: '🇷🇸' },
  { name: 'Slowakei',            flag: '🇸🇰' },
  { name: 'Finnland',            flag: '🇫🇮' },
  { name: 'Island',              flag: '🇮🇸' },
  { name: 'Irland',              flag: '🇮🇪' },
  { name: 'Großbritannien',      flag: '🇬🇧' },
  { name: 'Luxemburg',           flag: '🇱🇺' },
  { name: 'Malta',               flag: '🇲🇹' },
  { name: 'Andorra',             flag: '🇦🇩' },
  { name: 'Liechtenstein',       flag: '🇱🇮' },
  { name: 'Zypern',              flag: '🇨🇾' },
  { name: 'Estland',             flag: '🇪🇪' },
  { name: 'Lettland',            flag: '🇱🇻' },
  { name: 'Litauen',             flag: '🇱🇹' },
  { name: 'Ukraine',             flag: '🇺🇦' },
  { name: 'Nordmazedonien',      flag: '🇲🇰' },
  { name: 'Kosovo',              flag: '🇽🇰' },
  { name: 'Tunesien',            flag: '🇹🇳' },
  { name: 'Weißrussland',        flag: '🇧🇾' },
];

// ─── Kategorie-Farbgradienten (Fallback wenn kein Foto) ───────
const CAT_GRADIENTS = {
  Berg:          'linear-gradient(160deg,#2d3a2a 0%,#4a6a3a 60%,#8a9a6a 100%)',
  Schlucht:      'linear-gradient(160deg,#1a2a2a 0%,#2a4a4a 60%,#5a8a7a 100%)',
  Wasserfall:    'linear-gradient(160deg,#1a2a3a 0%,#2a5a7a 60%,#5a9aaa 100%)',
  Felsformation: 'linear-gradient(160deg,#2a2a1a 0%,#4a4a2a 60%,#8a7a5a 100%)',
  Naturdenkmal:  'linear-gradient(160deg,#1a3a1a 0%,#2a6a2a 60%,#5a9a5a 100%)',
  See:           'linear-gradient(160deg,#1a2a4a 0%,#2a4a7a 60%,#4a7aaa 100%)',
  Strand:        'linear-gradient(160deg,#2a3a1a 0%,#5a7a2a 60%,#c8b86a 100%)',
  Höhle:         'linear-gradient(160deg,#1a1a1a 0%,#2a2a2a 60%,#5a5a4a 100%)',
  Wanderung:     'linear-gradient(160deg,#2a3a1a 0%,#4a6a2a 60%,#7a9a5a 100%)',
  Klettersteig:  'linear-gradient(160deg,#3a2a1a 0%,#6a4a2a 60%,#9a7a5a 100%)',
  Kirche:        'linear-gradient(160deg,#2a2a3a 0%,#4a4a6a 60%,#8a8aaa 100%)',
  Burg:          'linear-gradient(160deg,#3a2a1a 0%,#6a5a2a 60%,#9a8a5a 100%)',
  Sonstiges:     'linear-gradient(160deg,#2a2a2a 0%,#4a4a4a 60%,#7a7a6a 100%)',
};

// ─── Theme-Tokens ─────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:          '#1c2420',
    bg2:         '#242e22',
    bg3:         '#2a3828',
    border:      '#3a4a38',
    text:        '#e8dfc9',
    muted:       '#6a8060',
    accent:      '#4a7c59',
    accentSoft:  '#3a5a38',
    gold:        '#c8a840',
    font:        "Fraunces, 'Georgia', serif",
    fontUI:      "Inter, system-ui, sans-serif",
    chipBg:      '#2a3828',
    shadow:      '0 4px 20px rgba(0,0,0,0.4)',
  },
  light: {
    bg:          '#f5f2ec',
    bg2:         '#ffffff',
    bg3:         '#eae6de',
    border:      '#d0c8b8',
    text:        '#2a2a1a',
    muted:       '#7a8070',
    accent:      '#3a6a48',
    accentSoft:  '#d0e8d8',
    gold:        '#9a7a10',
    font:        "Fraunces, 'Georgia', serif",
    fontUI:      "Inter, system-ui, sans-serif",
    chipBg:      '#eae6de',
    shadow:      '0 4px 20px rgba(0,0,0,0.12)',
  },
};

// ─── Icon-Helfer (SVG inline) ─────────────────────────────────
const Icon = {
  star: (color = '#c8a840', size = 14, fill = 'none') => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  ),
  dot: (filled, color = '#4a7c59', size = 14) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill={filled ? color : 'none'} stroke={color} strokeWidth="2"/>
    </svg>
  ),
  back: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="15,18 9,12 15,6"/>
    </svg>
  ),
  edit: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  trash: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/>
      <path d="M10,11v6"/><path d="M14,11v6"/>
      <path d="M9,6V4h6v2"/>
    </svg>
  ),
  map: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  pin: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  ),
  plus: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  search: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  close: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  photo: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>
  ),
  link: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
  gps: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
    </svg>
  ),
  sun: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  moon: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
};

// ─── Hilfsfunktionen ─────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function formatEuros(cents) {
  if (!cents) return '';
  return (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
```

- [ ] **Schritt 2: Commit**

```bash
git add project/p2l-data.jsx project/countries.php
git commit -m "feat: frontend data layer — categories, themes, icons"
```

---

### Task 9: index.html — App-Shell

**Dateien:**
- Anlegen: `index.html`
- Anlegen: `sw.js`

- [ ] **Schritt 1: sw.js anlegen**

```js
const CACHE = 'p2l-v1';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
);
self.addEventListener('activate', e =>
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
);
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

- [ ] **Schritt 2: index.html anlegen** (App-Shell + Haupt-App-Komponente)

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <title>places2love</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <link rel="manifest" href="manifest.webmanifest"/>
  <meta name="theme-color" content="#1c2420"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <meta name="apple-mobile-web-app-title" content="places2love"/>
  <link rel="apple-touch-icon" href="icon.svg"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Leaflet für OSM -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    :root { --sat: env(safe-area-inset-top,54px); --sab: env(safe-area-inset-bottom,0px); }
    html,body { margin:0; padding:0; height:100%; font-family: Inter, system-ui, sans-serif; overflow:hidden; }
    #root { width:100%; height:100dvh; overflow:hidden; }
    *::-webkit-scrollbar { display:none; }
    * { scrollbar-width:none; box-sizing:border-box; }
    button { -webkit-tap-highlight-color:transparent; cursor:pointer; border:none; }
    input,textarea,select { -webkit-tap-highlight-color:transparent; }
    input:focus,textarea:focus,select:focus { outline:none; }
    @keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  </style>
  <script>
    window.MAPKEY = 'DEIN_MAPYCZ_KEY'; // ← hier API-Key eintragen
    // Theme-Init (kein FOUC)
    if (localStorage.getItem('p2l-theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  </script>
</head>
<body>
  <div id="root"></div>

  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin></script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin></script>

  <script type="text/babel" src="project/p2l-data.jsx"></script>
  <script type="text/babel" src="project/p2l-screens.jsx"></script>
  <script type="text/babel" src="project/p2l-extras.jsx"></script>

  <script type="text/babel">
  // ═══════════════════════════════════════════════════════
  // KONFIGURATION
  // ═══════════════════════════════════════════════════════
  const API = './backend/api';

  // ═══════════════════════════════════════════════════════
  // OFFLINE-QUEUE
  // ═══════════════════════════════════════════════════════
  const QUEUE_KEY  = 'p2l_pending';
  const getQueue   = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]'); } catch { return []; } };
  const setQueue   = (a) => localStorage.setItem(QUEUE_KEY, JSON.stringify(a));

  // ═══════════════════════════════════════════════════════
  // AUTH HELPERS
  // ═══════════════════════════════════════════════════════
  const getToken  = ()  => localStorage.getItem('p2l-token') || '';
  const saveToken = (t) => t ? localStorage.setItem('p2l-token', t) : localStorage.removeItem('p2l-token');
  const saveUser  = (u) => u ? localStorage.setItem('p2l-user', JSON.stringify(u)) : localStorage.removeItem('p2l-user');
  const loadUser  = ()  => { try { return JSON.parse(localStorage.getItem('p2l-user')); } catch { return null; } };

  // ═══════════════════════════════════════════════════════
  // API FETCH
  // ═══════════════════════════════════════════════════════
  async function apiFetch(path, opts = {}) {
    const tk = getToken();
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (tk) headers['Authorization'] = 'Bearer ' + tk;
    const res = await fetch(API + path, { ...opts, headers });
    if (res.status === 401) { saveToken(null); saveUser(null); window.location.reload(); return; }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res;
  }

  // ═══════════════════════════════════════════════════════
  // UPLOAD HELPER
  // ═══════════════════════════════════════════════════════
  async function uploadPhoto(file, placeId) {
    const fd = new FormData();
    fd.append('photo', file);
    if (placeId) fd.append('place_id', placeId);
    const tk = getToken();
    const res = await fetch(API + '/upload.php', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tk },
      body: fd,
    });
    return res.json();
  }

  // ═══════════════════════════════════════════════════════
  // HAUPT-APP
  // ═══════════════════════════════════════════════════════
  function App() {
    const isDarkInit = localStorage.getItem('p2l-theme') !== 'light';
    const [dark,     setDark]     = React.useState(isDarkInit);
    const [user,     setUser]     = React.useState(loadUser);
    const [places,   setPlaces]   = React.useState([]);
    const [loading,  setLoading]  = React.useState(false);
    const [screen,   setScreen]   = React.useState('list');  // list|map|stats|profile|detail|form
    const [activeId, setActiveId] = React.useState(null);    // für Detail/Form
    const [editData, setEditData] = React.useState(null);    // für Form (bearbeiten)
    const [pendingQ, setPendingQ] = React.useState(getQueue().length);

    const t = dark ? THEMES.dark : THEMES.light;

    // Theme-Toggle
    const toggleTheme = React.useCallback(() => {
      setDark(d => {
        const next = !d;
        localStorage.setItem('p2l-theme', next ? 'dark' : 'light');
        document.documentElement.classList.toggle('light', !next);
        return next;
      });
    }, []);

    // Orte laden
    const loadPlaces = React.useCallback(async () => {
      if (!getToken()) return;
      setLoading(true);
      try {
        const data = await apiFetch('/places.php');
        if (Array.isArray(data)) setPlaces(data);
      } finally { setLoading(false); }
    }, []);

    React.useEffect(() => { if (user) loadPlaces(); }, [user]);

    // Offline-Sync bei Reconnect
    React.useEffect(() => {
      async function syncQueue() {
        const q = getQueue();
        if (!q.length || !navigator.onLine) return;
        for (const item of q) {
          try {
            await apiFetch('/places.php', { method:'POST', body: JSON.stringify(item) });
          } catch {}
        }
        setQueue([]);
        setPendingQ(0);
        loadPlaces();
      }
      window.addEventListener('online', syncQueue);
      return () => window.removeEventListener('online', syncQueue);
    }, [loadPlaces]);

    // Ort speichern (online oder offline-Queue)
    async function savePlace(data, id = null) {
      if (navigator.onLine) {
        if (id) {
          await apiFetch('/places.php?id=' + id, { method:'PUT', body: JSON.stringify(data) });
        } else {
          await apiFetch('/places.php', { method:'POST', body: JSON.stringify(data) });
        }
        await loadPlaces();
      } else {
        const q = getQueue();
        q.push({ ...data, _offline: true, _ts: Date.now() });
        setQueue(q);
        setPendingQ(q.length);
      }
    }

    // Ort löschen
    async function deletePlace(id) {
      await apiFetch('/places.php?id=' + id, { method:'DELETE' });
      setPlaces(ps => ps.filter(p => p.id !== id));
      setScreen('list');
    }

    // Login/Register Handler
    async function handleAuth(action, email, password, name = '') {
      const data = await apiFetch('/auth.php?action=' + action, {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      if (data.token) {
        saveToken(data.token);
        saveUser(data.user);
        setUser(data.user);
      }
      return data;
    }

    // Logout
    async function handleLogout() {
      await apiFetch('/auth.php?action=logout', { method:'POST' });
      saveToken(null);
      saveUser(null);
      setUser(null);
      setPlaces([]);
      setScreen('list');
    }

    // Navigation
    function openDetail(id) { setActiveId(id); setScreen('detail'); }
    function openForm(place = null) { setEditData(place); setScreen('form'); }
    function openMap() { setScreen('map'); }

    // Nicht eingeloggt
    if (!user) {
      return <ScreenLogin t={t} onAuth={handleAuth} />;
    }

    // Bottom-Navigation
    const NAV = [
      { id:'list',    label:'Liste',    icon:'📋' },
      { id:'map',     label:'Karte',    icon:'🗺️' },
      { id:'stats',   label:'Statistik',icon:'📊' },
      { id:'profile', label:'Profil',   icon:'👤' },
    ];
    const mainTabs = ['list','map','stats','profile'];
    const showNav  = mainTabs.includes(screen);

    return (
      <div style={{ width:'100%', height:'100dvh', display:'flex', flexDirection:'column',
                    background:t.bg, color:t.text, fontFamily:t.fontUI, overflow:'hidden' }}>

        {/* Haupt-Screen */}
        <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
          {screen === 'list'    && <ScreenList    t={t} places={places} loading={loading} onOpen={openDetail} onNew={()=>openForm()} onMap={openMap} pendingQ={pendingQ} />}
          {screen === 'map'     && <ScreenMap     t={t} places={places} onOpen={openDetail} />}
          {screen === 'stats'   && <ScreenStats   t={t} places={places} />}
          {screen === 'profile' && <ScreenProfile t={t} user={user} dark={dark} onToggleTheme={toggleTheme} onLogout={handleLogout} apiBase={API} token={getToken()} />}
          {screen === 'detail'  && <ScreenDetail  t={t} placeId={activeId} places={places} onBack={()=>setScreen('list')} onEdit={(p)=>openForm(p)} onDelete={deletePlace} onShowMap={(p)=>{setScreen('map');}} uploadPhoto={uploadPhoto} loadPlaces={loadPlaces} apiFetch={apiFetch} cfg={{uploadUrl:'./uploads'}} />}
          {screen === 'form'    && <ScreenForm    t={t} editData={editData} onSave={savePlace} onBack={()=>setScreen(editData?'detail':'list')} apiFetch={apiFetch} uploadPhoto={uploadPhoto} />}
        </div>

        {/* Bottom-Navigation */}
        {showNav && (
          <div style={{
            display:'flex', justifyContent:'space-around', alignItems:'center',
            height: `calc(52px + var(--sab))`,
            paddingBottom:'var(--sab)',
            background:t.bg2, borderTop:`1px solid ${t.border}`,
            flexShrink:0,
          }}>
            {NAV.map(n => (
              <button key={n.id} onClick={()=>setScreen(n.id)} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                background:'none', padding:'6px 16px',
                color: screen === n.id ? t.accent : t.muted,
                fontSize:9, fontWeight:600, fontFamily:t.fontUI,
                letterSpacing:'0.04em', textTransform:'uppercase',
              }}>
                <span style={{ fontSize:20 }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // PWA Service Worker registrieren
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
```

- [ ] **Schritt 3: App im Browser öffnen und prüfen**

```bash
open http://localhost:8001/index.html
```

Erwartete Ansicht: Login-Screen erscheint (da ScreenLogin noch nicht existiert, erscheint ein Fehler — das ist OK, weiter zu Task 10)

- [ ] **Schritt 4: Commit**

```bash
git add index.html sw.js
git commit -m "feat: app shell, PWA service worker, main App component"
```

---

## Phase 3 — Frontend Screens

### Task 10: Wiederverwendbare UI-Komponenten + ScreenLogin

**Dateien:**
- Anlegen: `project/p2l-screens.jsx` (erste Version mit Login + shared components)

- [ ] **Schritt 1: p2l-screens.jsx anlegen** — Shared Components + ScreenLogin

```jsx
// ─── Shared: Sterne ──────────────────────────────────────────
function Stars({ n, size = 14, t }) {
  return (
    <span style={{ display:'inline-flex', gap:1 }}>
      {[1,2,3,4,5].map(i =>
        <span key={i}>{Icon.star(i<=n ? t.gold : t.border, size, i<=n ? t.gold : 'none')}</span>
      )}
    </span>
  );
}

// ─── Shared: Dots (Schwierigkeit) ────────────────────────────
function Dots({ n, size = 13, t }) {
  return (
    <span style={{ display:'inline-flex', gap:2 }}>
      {[1,2,3,4,5].map(i =>
        <span key={i}>{Icon.dot(i<=n, t.accent, size)}</span>
      )}
    </span>
  );
}

// ─── Shared: Chip ────────────────────────────────────────────
function Chip({ children, t, active, onClick, small }) {
  return (
    <button onClick={onClick} style={{
      background: active ? t.accentSoft : t.chipBg,
      color: active ? t.accent : t.muted,
      border: `1px solid ${active ? t.accent : t.border}`,
      borderRadius:999, padding: small ? '4px 10px' : '6px 13px',
      fontSize: small ? 11 : 12.5, fontWeight:600, fontFamily:t.fontUI,
      whiteSpace:'nowrap',
    }}>{children}</button>
  );
}

// ─── Shared: Section-Label ───────────────────────────────────
function SectionLabel({ children, t }) {
  return (
    <div style={{
      fontSize:10, fontWeight:700, letterSpacing:'0.12em',
      textTransform:'uppercase', color:t.muted, fontFamily:t.fontUI,
      padding:'16px 16px 6px',
    }}>{children}</div>
  );
}

// ─── ScreenLogin ─────────────────────────────────────────────
function ScreenLogin({ t, onAuth }) {
  const [mode,  setMode]  = React.useState('login'); // 'login'|'register'
  const [email, setEmail] = React.useState('');
  const [name,  setName]  = React.useState('');
  const [pass,  setPass]  = React.useState('');
  const [err,   setErr]   = React.useState('');
  const [busy,  setBusy]  = React.useState(false);

  const inputStyle = {
    width:'100%', padding:'12px 14px', borderRadius:10,
    background:t.bg3, border:`1px solid ${t.border}`,
    color:t.text, fontSize:15, fontFamily:t.fontUI,
  };

  async function submit() {
    setBusy(true); setErr('');
    const res = await onAuth(mode, email, pass, name);
    setBusy(false);
    if (res?.error) setErr(res.error);
  }

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  background:t.bg, padding:'32px 24px' }}>
      {/* Logo */}
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <img src="icon.svg" style={{ width:64, height:64, borderRadius:16, marginBottom:12 }}/>
        <div style={{ fontFamily:t.font, fontSize:28, fontWeight:500, color:t.text }}>places2love</div>
        <div style={{ fontSize:13, color:t.muted, marginTop:4 }}>Deine Lieblingsorte</div>
      </div>

      {/* Felder */}
      <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}>
        {mode === 'register' && (
          <input placeholder="Dein Name" value={name} onChange={e=>setName(e.target.value)}
                 style={inputStyle}/>
        )}
        <input type="email" placeholder="E-Mail" value={email}
               onChange={e=>setEmail(e.target.value)} style={inputStyle}/>
        <input type="password" placeholder="Passwort" value={pass}
               onChange={e=>setPass(e.target.value)}
               onKeyDown={e=>e.key==='Enter'&&submit()} style={inputStyle}/>

        {err && <div style={{ color:'#e05050', fontSize:13, textAlign:'center' }}>{err}</div>}

        <button onClick={submit} disabled={busy} style={{
          background:t.accent, color:'#fff', borderRadius:10,
          padding:'14px', fontSize:15, fontWeight:600, fontFamily:t.fontUI,
          opacity:busy?0.7:1,
        }}>
          {busy ? '…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
        </button>

        <button onClick={()=>{setMode(m=>m==='login'?'register':'login');setErr('');}} style={{
          background:'none', color:t.muted, fontSize:13, fontFamily:t.fontUI, padding:8,
        }}>
          {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 2: App testen**

```bash
open http://localhost:8001/index.html
```

Erwartete Ansicht: Login-Screen mit Logo, E-Mail + Passwort + Button. Mit den Test-Zugangsdaten (`test@example.com` / `test123`) anmelden — danach sollte ein Fehler erscheinen (ScreenList existiert noch nicht).

- [ ] **Schritt 3: Commit**

```bash
git add project/p2l-screens.jsx
git commit -m "feat: shared UI components + login/register screen"
```

---

### Task 11: ScreenList

**Dateien:**
- Erweitern: `project/p2l-screens.jsx`

- [ ] **Schritt 1: ScreenList ans Ende von p2l-screens.jsx anhängen**

```jsx
// ─── ScreenList ───────────────────────────────────────────────
function ScreenList({ t, places, loading, onOpen, onNew, onMap, pendingQ }) {
  const [search,     setSearch]     = React.useState('');
  const [filterCat,  setFilterCat]  = React.useState('');
  const [filterStar, setFilterStar] = React.useState(0);
  const [showFilter, setShowFilter] = React.useState(false);

  const filtered = places.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !(p.region||'').toLowerCase().includes(search.toLowerCase()) &&
        !(p.country||'').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat  && p.category !== filterCat)  return false;
    if (filterStar && p.rating < filterStar) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b) => b.visited_on.localeCompare(a.visited_on));

  // Monatliche Gruppierung
  const groups = {};
  sorted.forEach(p => {
    const d = new Date(p.visited_on + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    if (!groups[key]) groups[key] = { label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, items:[] };
    groups[key].items.push(p);
  });

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:`calc(var(--sat) + 12px) 16px 8px`,
                    background:t.bg2, borderBottom:`1px solid ${t.border}`,
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div style={{ fontFamily:t.font, fontSize:22, fontWeight:500, color:t.text,
                      letterSpacing:'-0.02em' }}>places2love</div>
        <div style={{ display:'flex', gap:8 }}>
          {pendingQ > 0 && (
            <div style={{ background:t.gold, color:'#000', borderRadius:999,
                          padding:'2px 8px', fontSize:11, fontWeight:700 }}>
              {pendingQ} offline
            </div>
          )}
          <button onClick={onNew} style={{
            background:t.accent, borderRadius:10, width:34, height:34,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>{Icon.plus('#fff')}</button>
        </div>
      </div>

      {/* Suche + Filter */}
      <div style={{ padding:'10px 16px 8px', background:t.bg2, borderBottom:`1px solid ${t.border}` }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:t.bg3, borderRadius:10, padding:'8px 12px', marginBottom:8,
        }}>
          {Icon.search(t.muted)}
          <input value={search} onChange={e=>setSearch(e.target.value)}
                 placeholder="Suchen…" style={{
            background:'none', border:'none', color:t.text,
            fontSize:14, fontFamily:t.fontUI, flex:1,
          }}/>
          {search && <button onClick={()=>setSearch('')} style={{ background:'none', padding:0 }}>{Icon.close(t.muted)}</button>}
        </div>
        {/* Kategorie-Chips */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
          <Chip t={t} active={!filterCat} onClick={()=>setFilterCat('')} small>Alle</Chip>
          {CATEGORIES.map(c => (
            <Chip key={c.id} t={t} active={filterCat===c.id}
                  onClick={()=>setFilterCat(f=>f===c.id?'':c.id)} small>
              {c.emoji} {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Ortsliste */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 16px 16px' }}>
        {loading && (
          <div style={{ textAlign:'center', padding:40, color:t.muted }}>Lädt…</div>
        )}
        {!loading && sorted.length === 0 && (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📍</div>
            <div style={{ color:t.muted, fontSize:14 }}>
              {search||filterCat ? 'Keine Treffer' : 'Noch keine Orte — tippe auf + um loszulegen'}
            </div>
          </div>
        )}
        {Object.values(groups).map(g => (
          <div key={g.label}>
            <SectionLabel t={t}>{g.label}</SectionLabel>
            {g.items.map(p => <PlaceCard key={p.id} p={p} t={t} onOpen={()=>onOpen(p.id)}/>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PlaceCard ────────────────────────────────────────────────
function PlaceCard({ p, t, onOpen }) {
  const cat       = CATEGORY_MAP[p.category] || CATEGORY_MAP.Sonstiges;
  const gradient  = CAT_GRADIENTS[p.category] || CAT_GRADIENTS.Sonstiges;
  const photoUrl  = p.cover ? `./uploads/${p.cover}` : null;

  return (
    <div onClick={onOpen} style={{
      background:t.bg2, borderRadius:12, marginBottom:10, overflow:'hidden',
      border:`1px solid ${t.border}`, cursor:'pointer',
      boxShadow:t.shadow,
    }}>
      {/* Hero */}
      <div style={{
        height:90, position:'relative',
        background: photoUrl ? `url(${photoUrl}) center/cover no-repeat` : gradient,
      }}>
        <div style={{
          position:'absolute', top:8, left:8,
          background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)',
          borderRadius:6, padding:'3px 8px',
          fontSize:11, fontWeight:700, color:'#fff', letterSpacing:'0.05em',
        }}>
          {cat.emoji} {cat.label}
        </div>
        {p.rating > 0 && (
          <div style={{
            position:'absolute', bottom:8, right:8,
            background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)',
            borderRadius:6, padding:'3px 8px',
          }}>
            <Stars n={p.rating} size={12} t={t}/>
          </div>
        )}
      </div>
      {/* Body */}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontFamily:t.font, fontSize:15, fontWeight:500, color:t.text,
                      letterSpacing:'-0.01em', marginBottom:4 }}>{p.title}</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, color:t.muted }}>
            {p.country_flag} {p.region ? `${p.region}, ` : ''}{p.country}
          </div>
          <div style={{ fontSize:12, color:t.muted }}>{formatDate(p.visited_on)}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 2: App testen** — einloggen, ScreenList erscheint mit Testdaten-Ort

```bash
open http://localhost:8001/index.html
```

Erwartete Ansicht: Liste mit dem Kuhfluchtwasserfälle-Testort als Card mit Wasserfall-Gradient

- [ ] **Schritt 3: Commit**

```bash
git add project/p2l-screens.jsx
git commit -m "feat: ScreenList with search, category filter, place cards"
```

---

### Task 12: ScreenDetail

**Dateien:**
- Erweitern: `project/p2l-screens.jsx`

- [ ] **Schritt 1: ScreenDetail ans Ende von p2l-screens.jsx anhängen**

```jsx
// ─── ScreenDetail ─────────────────────────────────────────────
function ScreenDetail({ t, placeId, places, onBack, onEdit, onDelete, uploadPhoto, loadPlaces, apiFetch, cfg }) {
  const [place,     setPlace]     = React.useState(null);
  const [delConfirm,setDelConfirm]= React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    apiFetch('/places.php?id=' + placeId).then(data => {
      if (data && !data.error) setPlace(data);
    });
  }, [placeId]);

  if (!place) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center',
                  justifyContent:'center', color:t.muted }}>Lädt…</div>
  );

  const cat      = CATEGORY_MAP[place.category] || CATEGORY_MAP.Sonstiges;
  const gradient = CAT_GRADIENTS[place.category] || CAT_GRADIENTS.Sonstiges;
  const heroUrl  = place.photos?.[0] ? `${cfg.uploadUrl}/${place.photos[0].path}` : null;

  const REVISIT_LABEL = { ja:'✅ Ja, unbedingt!', vielleicht:'🤔 Vielleicht', nein:'❌ Nein' };

  async function handleAddPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadPhoto(file, place.id);
    await loadPlaces();
    const fresh = await apiFetch('/places.php?id=' + placeId);
    if (fresh && !fresh.error) setPlace(fresh);
    setUploading(false);
  }

  async function handleDeletePhoto(photoId) {
    await apiFetch('/places.php', { method:'DELETE', body: JSON.stringify({ photo_id: photoId }) });
    const fresh = await apiFetch('/places.php?id=' + placeId);
    if (fresh && !fresh.error) setPlace(fresh);
  }

  return (
    <div style={{ height:'100%', overflowY:'auto' }}>
      {/* Hero */}
      <div style={{
        height:220, position:'relative',
        background: heroUrl ? `url(${heroUrl}) center/cover no-repeat` : gradient,
      }}>
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
        }}/>
        {/* Zurück-Button */}
        <button onClick={onBack} style={{
          position:'absolute', top:`calc(var(--sat) + 8px)`, left:12,
          background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)',
          borderRadius:10, padding:'8px 10px', display:'flex', alignItems:'center', gap:6,
          color:'#fff', fontSize:13, fontWeight:600,
        }}>
          {Icon.back('#fff')} Zurück
        </button>
        {/* Edit + Delete */}
        <div style={{ position:'absolute', top:`calc(var(--sat) + 8px)`, right:12, display:'flex', gap:8 }}>
          <button onClick={()=>onEdit(place)} style={{
            background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)',
            borderRadius:10, padding:'8px 10px',
          }}>{Icon.edit('#fff')}</button>
          <button onClick={()=>setDelConfirm(true)} style={{
            background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)',
            borderRadius:10, padding:'8px 10px',
          }}>{Icon.trash('#ff6060')}</button>
        </div>
        {/* Kategorie + Name */}
        <div style={{ position:'absolute', bottom:16, left:16, right:16 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700,
                        letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>
            {cat.emoji} {cat.label}
          </div>
          <div style={{ fontFamily:t.font, fontSize:24, fontWeight:500, color:'#fff',
                        letterSpacing:'-0.02em', lineHeight:1.2 }}>{place.title}</div>
          {place.rating > 0 && (
            <div style={{ marginTop:4 }}><Stars n={place.rating} size={14} t={t}/></div>
          )}
        </div>
      </div>

      {/* Inhalt */}
      <div style={{ padding:'16px 16px 40px' }}>

        {/* Info-Chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {place.country && <Chip t={t}>{place.country_flag} {place.region ? `${place.region}, ` : ''}{place.country}</Chip>}
          {place.visited_on && <Chip t={t}>📅 {formatDate(place.visited_on)}</Chip>}
          {place.duration && <Chip t={t}>⏱ {place.duration}</Chip>}
          {place.entry_cents > 0 && <Chip t={t}>🎟 {formatEuros(place.entry_cents)}</Chip>}
          {place.difficulty > 0 && <Chip t={t}>Schwierigkeit: {place.difficulty}/5</Chip>}
          {place.revisit && <Chip t={t}>{REVISIT_LABEL[place.revisit]}</Chip>}
        </div>

        {/* Bewertung (Sterne + Punkte) */}
        {place.difficulty > 0 && (
          <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:12, color:t.muted, minWidth:90 }}>Schwierigkeit</div>
            <Dots n={place.difficulty} t={t}/>
          </div>
        )}

        {/* Beschreibung */}
        {place.note && (
          <>
            <SectionLabel t={t}>Beschreibung</SectionLabel>
            <div style={{ fontSize:14, lineHeight:1.6, color:t.text, padding:'0 16px 12px' }}>
              {place.note}
            </div>
          </>
        )}

        {/* Tags */}
        {place.tags?.length > 0 && (
          <>
            <SectionLabel t={t}>Tags</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'0 16px 12px' }}>
              {place.tags.map(tag => <Chip key={tag} t={t} small>{tag}</Chip>)}
            </div>
          </>
        )}

        {/* Fotos */}
        {(place.photos?.length > 0 || true) && (
          <>
            <SectionLabel t={t}>Fotos</SectionLabel>
            <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'0 16px 12px' }}>
              {place.photos?.map(ph => (
                <div key={ph.id} style={{ position:'relative', flexShrink:0 }}>
                  <img src={`${cfg.uploadUrl}/${ph.path}`}
                       style={{ width:100, height:100, objectFit:'cover', borderRadius:8 }}/>
                </div>
              ))}
              <label style={{
                width:100, height:100, flexShrink:0, borderRadius:8,
                border:`2px dashed ${t.border}`, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', cursor:'pointer', gap:4,
                color:t.muted, fontSize:11,
              }}>
                {uploading ? '…' : <>{Icon.photo(t.muted)}<span>Foto</span></>}
                <input type="file" accept="image/*" style={{ display:'none' }}
                       onChange={handleAddPhoto} disabled={uploading}/>
              </label>
            </div>
          </>
        )}

        {/* Links */}
        {place.links?.length > 0 && (
          <>
            <SectionLabel t={t}>Links</SectionLabel>
            <div style={{ padding:'0 16px 12px', display:'flex', flexDirection:'column', gap:8 }}>
              {place.links.map(lnk => (
                <a key={lnk.id} href={lnk.url} target="_blank" rel="noopener"
                   style={{ display:'flex', alignItems:'center', gap:8, color:t.accent,
                            fontSize:14, textDecoration:'none' }}>
                  {Icon.link(t.accent)}
                  <span>{lnk.label || lnk.url}</span>
                </a>
              ))}
            </div>
          </>
        )}

        {/* GPS */}
        {place.lat && (
          <>
            <SectionLabel t={t}>Koordinaten</SectionLabel>
            <div style={{ padding:'0 16px 12px', display:'flex', alignItems:'center',
                          gap:8, color:t.muted, fontSize:13 }}>
              {Icon.gps(t.muted)}
              {Number(place.lat).toFixed(5)}, {Number(place.lng).toFixed(5)}
            </div>
          </>
        )}
      </div>

      {/* Lösch-Bestätigung */}
      {delConfirm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000,
          display:'flex', alignItems:'flex-end',
        }}>
          <div style={{ background:t.bg2, padding:'24px 20px', width:'100%', borderRadius:'16px 16px 0 0',
                        animation:'slideUp 0.25s ease' }}>
            <div style={{ fontSize:16, fontWeight:600, color:t.text, marginBottom:8 }}>
              „{place.title}" löschen?
            </div>
            <div style={{ fontSize:13, color:t.muted, marginBottom:20 }}>
              Alle Daten und Fotos werden dauerhaft gelöscht.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setDelConfirm(false)} style={{
                flex:1, padding:14, background:t.bg3, borderRadius:10,
                color:t.text, fontSize:15, fontWeight:600,
              }}>Abbrechen</button>
              <button onClick={()=>onDelete(place.id)} style={{
                flex:1, padding:14, background:'#c03030', borderRadius:10,
                color:'#fff', fontSize:15, fontWeight:600,
              }}>Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Schritt 2: Testen** — Ort in der Liste antippen, Detail-Screen prüfen

Prüfen: Hero-Bild/Gradient, alle Felder, Zurück-Button, Edit/Delete-Icons sichtbar

- [ ] **Schritt 3: Commit**

```bash
git add project/p2l-screens.jsx
git commit -m "feat: ScreenDetail with hero, chips, tags, photos, links"
```

---

### Task 13: ScreenForm (Neuer Ort / Bearbeiten)

**Dateien:**
- Erweitern: `project/p2l-screens.jsx`

- [ ] **Schritt 1: ScreenForm ans Ende von p2l-screens.jsx anhängen**

```jsx
// ─── ScreenForm ───────────────────────────────────────────────
function ScreenForm({ t, editData, onSave, onBack, apiFetch, uploadPhoto }) {
  const isEdit = !!editData;
  const [form, setForm] = React.useState({
    title:           editData?.title           || '',
    category:        editData?.category        || 'Berg',
    custom_category: editData?.custom_category || '',
    country:         editData?.country         || '',
    country_flag:    editData?.country_flag     || '',
    region:          editData?.region          || '',
    visited_on:      editData?.visited_on      || todayISO(),
    rating:          editData?.rating          || 0,
    difficulty:      editData?.difficulty      || 0,
    revisit:         editData?.revisit         || 'vielleicht',
    entry_euros:     editData ? (editData.entry_cents/100).toFixed(2) : '',
    duration:        editData?.duration        || '',
    note:            editData?.note            || '',
    tags:            editData?.tags            || [],
    links:           editData?.links           || [],
  });
  const [tagInput,  setTagInput]  = React.useState('');
  const [busy,      setBusy]      = React.useState(false);
  const [err,       setErr]       = React.useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const inputStyle = {
    width:'100%', padding:'11px 13px', borderRadius:9,
    background:t.bg3, border:`1px solid ${t.border}`,
    color:t.text, fontSize:14, fontFamily:t.fontUI,
  };
  const labelStyle = {
    fontSize:10, fontWeight:700, letterSpacing:'0.1em',
    textTransform:'uppercase', color:t.muted, fontFamily:t.fontUI,
    marginBottom:5, display:'block',
  };

  function addTag() {
    const tags = tagInput.split(',').map(s=>s.trim()).filter(Boolean);
    set('tags', [...new Set([...form.tags, ...tags])]);
    setTagInput('');
  }

  function removeTag(tag) { set('tags', form.tags.filter(t=>t!==tag)); }

  function addLink() { set('links', [...form.links, { url:'', label:'' }]); }
  function updateLink(i, key, val) {
    const links = [...form.links];
    links[i] = { ...links[i], [key]: val };
    set('links', links);
  }
  function removeLink(i) { set('links', form.links.filter((_,j)=>j!==i)); }

  function setCountry(name) {
    const c = COUNTRIES.find(c=>c.name===name);
    setForm(f => ({ ...f, country: name, country_flag: c?.flag||'' }));
  }

  async function handleGPS() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
    });
  }

  async function submit() {
    if (!form.title.trim()) { setErr('Name ist erforderlich'); return; }
    setBusy(true); setErr('');
    try {
      await onSave(form, isEdit ? editData.id : null);
      onBack();
    } catch (e) {
      setErr('Fehler beim Speichern');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{
        padding:`calc(var(--sat) + 12px) 16px 12px`,
        background:t.bg2, borderBottom:`1px solid ${t.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <button onClick={onBack} style={{ background:'none', color:t.muted,
                fontSize:14, fontFamily:t.fontUI, display:'flex', alignItems:'center', gap:4 }}>
          {Icon.back(t.muted)} Abbrechen
        </button>
        <div style={{ fontFamily:t.font, fontSize:17, fontWeight:500, color:t.text }}>
          {isEdit ? 'Ort bearbeiten' : 'Neuer Ort'}
        </div>
        <button onClick={submit} disabled={busy} style={{
          background:t.accent, color:'#fff', borderRadius:8,
          padding:'8px 14px', fontSize:13, fontWeight:600, fontFamily:t.fontUI,
          opacity:busy?0.7:1,
        }}>{busy?'…':'Speichern'}</button>
      </div>

      {/* Formular */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 48px' }}>

        {err && <div style={{ color:'#e05050', fontSize:13, marginBottom:12 }}>{err}</div>}

        {/* Name */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Name *</label>
          <input value={form.title} onChange={e=>set('title',e.target.value)}
                 placeholder="Name des Ortes" style={inputStyle}/>
        </div>

        {/* Kategorie */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Kategorie</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {CATEGORIES.map(c => (
              <Chip key={c.id} t={t} active={form.category===c.id} small
                    onClick={()=>set('category',c.id)}>
                {c.emoji} {c.label}
              </Chip>
            ))}
          </div>
          {form.category === 'Sonstiges' && (
            <input value={form.custom_category}
                   onChange={e=>set('custom_category',e.target.value)}
                   placeholder="Eigene Bezeichnung" style={{ ...inputStyle, marginTop:8 }}/>
          )}
        </div>

        {/* Bewertung */}
        <div style={{ marginBottom:14, display:'flex', gap:24 }}>
          <div>
            <label style={labelStyle}>Bewertung</label>
            <div style={{ display:'flex', gap:4 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={()=>set('rating',i===form.rating?0:i)}
                        style={{ background:'none', padding:2 }}>
                  {Icon.star(i<=form.rating?t.gold:t.border, 26, i<=form.rating?t.gold:'none')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Schwierigkeit</label>
            <div style={{ display:'flex', gap:4 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={()=>set('difficulty',i===form.difficulty?0:i)}
                        style={{ background:'none', padding:2 }}>
                  {Icon.dot(i<=form.difficulty, t.accent, 26)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Besuchsdatum */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Besuchsdatum</label>
          <input type="date" value={form.visited_on} onChange={e=>set('visited_on',e.target.value)}
                 style={inputStyle}/>
        </div>

        {/* Land + Region */}
        <div style={{ marginBottom:14, display:'flex', gap:10 }}>
          <div style={{ flex:2 }}>
            <label style={labelStyle}>Land</label>
            <select value={form.country} onChange={e=>setCountry(e.target.value)}
                    style={{ ...inputStyle, appearance:'none' }}>
              <option value="">— bitte wählen —</option>
              {COUNTRIES.map(c => (
                <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Region</label>
            <input value={form.region} onChange={e=>set('region',e.target.value)}
                   placeholder="z.B. Bayern" style={inputStyle}/>
          </div>
        </div>

        {/* Eintritt + Dauer */}
        <div style={{ marginBottom:14, display:'flex', gap:10 }}>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Eintritt (€)</label>
            <input type="number" min="0" step="0.50" value={form.entry_euros}
                   onChange={e=>set('entry_euros',e.target.value)}
                   placeholder="0,00" style={inputStyle}/>
          </div>
          <div style={{ flex:1 }}>
            <label style={labelStyle}>Dauer</label>
            <input value={form.duration} onChange={e=>set('duration',e.target.value)}
                   placeholder="z.B. 2,5 Std." style={inputStyle}/>
          </div>
        </div>

        {/* Wiederbesuchen */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Wiederbesuchen?</label>
          <div style={{ display:'flex', gap:8 }}>
            {[['ja','✅ Ja'],['vielleicht','🤔 Vielleicht'],['nein','❌ Nein']].map(([v,l]) => (
              <Chip key={v} t={t} active={form.revisit===v} onClick={()=>set('revisit',v)}>{l}</Chip>
            ))}
          </div>
        </div>

        {/* Beschreibung */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Beschreibung</label>
          <textarea value={form.note} onChange={e=>set('note',e.target.value)}
                    rows={4} placeholder="Notizen, Eindrücke, Tipps…"
                    style={{ ...inputStyle, resize:'none', lineHeight:1.6 }}/>
        </div>

        {/* Tags */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Tags</label>
          <div style={{ display:'flex', gap:8, marginBottom:6 }}>
            <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                   onKeyDown={e=>e.key==='Enter'&&addTag()}
                   placeholder="Tag eingeben, Enter oder Komma"
                   style={{ ...inputStyle, flex:1 }}/>
            <button onClick={addTag} style={{
              background:t.accent, color:'#fff', borderRadius:9, padding:'0 14px',
              fontSize:14, fontWeight:700,
            }}>+</button>
          </div>
          {form.tags.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {form.tags.map(tag => (
                <button key={tag} onClick={()=>removeTag(tag)} style={{
                  background:t.accentSoft, color:t.accent,
                  border:`1px solid ${t.accent}`, borderRadius:999,
                  padding:'4px 10px', fontSize:12, fontWeight:600, fontFamily:t.fontUI,
                  display:'flex', alignItems:'center', gap:4,
                }}>
                  {tag} ×
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Links */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Links</label>
          {form.links.map((lnk,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                <input value={lnk.url} onChange={e=>updateLink(i,'url',e.target.value)}
                       placeholder="https://…" style={inputStyle}/>
                <input value={lnk.label} onChange={e=>updateLink(i,'label',e.target.value)}
                       placeholder="Bezeichnung (optional)" style={inputStyle}/>
              </div>
              <button onClick={()=>removeLink(i)} style={{
                background:t.bg3, border:`1px solid ${t.border}`,
                borderRadius:9, padding:'0 10px', color:'#e05050',
              }}>×</button>
            </div>
          ))}
          <button onClick={addLink} style={{
            background:t.bg3, border:`1px dashed ${t.border}`, borderRadius:9,
            color:t.muted, padding:'10px 16px', fontSize:13, fontFamily:t.fontUI,
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            {Icon.link(t.muted)} Link hinzufügen
          </button>
        </div>

        {/* GPS */}
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>GPS-Koordinaten</label>
          {form.lat ? (
            <div style={{ fontSize:13, color:t.muted, marginBottom:6 }}>
              {Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)}
            </div>
          ) : (
            <div style={{ fontSize:13, color:t.muted, marginBottom:6 }}>Keine Koordinaten</div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleGPS} style={{
              flex:1, background:t.bg3, border:`1px solid ${t.border}`, borderRadius:9,
              color:t.text, padding:'10px', fontSize:13, fontFamily:t.fontUI,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              {Icon.gps(t.accent)} Aktueller Standort
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Schritt 2: Testen** — „+" antippen, Formular füllen und speichern

Erwartete Funktion: Ort wird gespeichert, erscheint in der Liste, Detail öffnet sich korrekt

- [ ] **Schritt 3: Commit**

```bash
git add project/p2l-screens.jsx
git commit -m "feat: ScreenForm with all fields — category, stars, dots, tags, links, GPS"
```

---

### Task 14: p2l-extras.jsx — MapView (mapy.cz + Leaflet)

**Dateien:**
- Anlegen: `project/p2l-extras.jsx`

- [ ] **Schritt 1: p2l-extras.jsx anlegen**

```jsx
// ─── ScreenMap ────────────────────────────────────────────────
function ScreenMap({ t, places, onOpen }) {
  const mapRef     = React.useRef(null);
  const leafletRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const [provider,  setProvider]  = React.useState('mapy'); // 'mapy'|'osm'
  const [lastPlace, setLastPlace] = React.useState(null);

  // Karte initialisieren
  React.useEffect(() => {
    if (leafletRef.current) return;
    leafletRef.current = L.map(mapRef.current, {
      center: [47.5, 11.0],
      zoom:   8,
      zoomControl: false,
    });
    L.control.zoom({ position: 'topright' }).addTo(leafletRef.current);
    applyTiles(leafletRef.current, provider);
    return () => { leafletRef.current?.remove(); leafletRef.current = null; };
  }, []);

  // Karten-Provider wechseln
  React.useEffect(() => {
    if (!leafletRef.current) return;
    leafletRef.current.eachLayer(l => { if (l instanceof L.TileLayer) leafletRef.current.removeLayer(l); });
    applyTiles(leafletRef.current, provider);
  }, [provider]);

  // Pins setzen / aktualisieren
  React.useEffect(() => {
    if (!leafletRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const withGPS = places.filter(p => p.lat && p.lng);

    withGPS.forEach(p => {
      const cat = CATEGORY_MAP[p.category] || CATEGORY_MAP.Sonstiges;
      const pin = L.divIcon({
        html: `<div style="background:${t.accent};border:2px solid #fff;border-radius:50% 50% 50% 0;
                           width:24px;height:24px;transform:rotate(-45deg);
                           display:flex;align-items:center;justify-content:center;
                           box-shadow:0 2px 6px rgba(0,0,0,0.4)">
                 <span style="transform:rotate(45deg);font-size:11px">${cat.emoji}</span>
               </div>`,
        iconSize: [24, 24], iconAnchor: [12, 24], className:'',
      });
      const m = L.marker([Number(p.lat), Number(p.lng)], { icon: pin })
        .addTo(leafletRef.current)
        .bindPopup(`<b>${p.title}</b><br>${cat.emoji} ${cat.label}`, { maxWidth: 160 });
      m.on('click', () => { setLastPlace(p); });
      markersRef.current.push(m);
    });

    if (withGPS.length > 0) {
      const bounds = L.latLngBounds(withGPS.map(p => [Number(p.lat), Number(p.lng)]));
      leafletRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [places, t]);

  // Aktueller Standort
  function goToMyLocation() {
    navigator.geolocation?.getCurrentPosition(pos => {
      leafletRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 13);
    });
  }

  return (
    <div style={{ height:'100%', position:'relative', overflow:'hidden' }}>
      {/* Karte */}
      <div ref={mapRef} style={{ width:'100%', height:'100%' }}/>

      {/* Karten-Wechsler */}
      <div style={{
        position:'absolute', top:`calc(var(--sat) + 10px)`, left:12, zIndex:1000,
        display:'flex', gap:6,
      }}>
        {[['mapy','mapy.cz'],['osm','OSM']].map(([id,label]) => (
          <button key={id} onClick={()=>setProvider(id)} style={{
            background: provider===id ? t.accent : 'rgba(0,0,0,0.6)',
            backdropFilter:'blur(8px)',
            color:'#fff', borderRadius:8, padding:'7px 12px',
            fontSize:12, fontWeight:600, fontFamily:t.fontUI,
          }}>{label}</button>
        ))}
      </div>

      {/* GPS-Button */}
      <button onClick={goToMyLocation} style={{
        position:'absolute', top:`calc(var(--sat) + 10px)`, right:12, zIndex:1000,
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
        borderRadius:10, padding:10,
      }}>
        {Icon.gps('#fff')}
      </button>

      {/* Zuletzt ausgewählter Ort */}
      {lastPlace && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, zIndex:1000,
          padding:'12px 16px', background:t.bg2,
          borderTop:`1px solid ${t.border}`,
          animation:'slideUp 0.2s ease',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:t.font, fontSize:16, fontWeight:500, color:t.text }}>
                {lastPlace.title}
              </div>
              <div style={{ fontSize:12, color:t.muted, marginTop:2 }}>
                {CATEGORY_MAP[lastPlace.category]?.emoji} {CATEGORY_MAP[lastPlace.category]?.label}
                {lastPlace.rating > 0 && <span style={{ marginLeft:8 }}>{'★'.repeat(lastPlace.rating)}</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setLastPlace(null)} style={{
                background:t.bg3, borderRadius:8, padding:'8px 10px',
                color:t.muted, fontSize:12,
              }}>×</button>
              <button onClick={()=>onOpen(lastPlace.id)} style={{
                background:t.accent, borderRadius:8, padding:'8px 14px',
                color:'#fff', fontSize:12, fontWeight:600, fontFamily:t.fontUI,
              }}>Detail →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tile-Helper ─────────────────────────────────────────────
function applyTiles(map, provider) {
  if (provider === 'mapy') {
    L.tileLayer(
      `https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${window.MAPKEY}`,
      { attribution:'© mapy.cz', maxZoom:18 }
    ).addTo(map);
  } else {
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution:'© OpenStreetMap', maxZoom:19 }
    ).addTo(map);
  }
}
```

- [ ] **Schritt 2: Karten-Tab testen**

Karten-Tab antippen. Prüfen:
- Karte lädt korrekt (OSM funktioniert ohne API-Key, mapy.cz mit Key)
- Pins erscheinen für Orte mit GPS-Koordinaten
- Wechsel zwischen mapy.cz und OSM funktioniert
- Tap auf Pin zeigt Popup, dann lastPlace-Card unten

- [ ] **Schritt 3: Commit**

```bash
git add project/p2l-extras.jsx
git commit -m "feat: MapView with mapy.cz + OSM tile switching, emoji pins"
```

---

### Task 15: ScreenStats + ScreenProfile

**Dateien:**
- Erweitern: `project/p2l-screens.jsx`

- [ ] **Schritt 1: ScreenStats ans Ende von p2l-screens.jsx anhängen**

```jsx
// ─── ScreenStats ──────────────────────────────────────────────
function ScreenStats({ t, places }) {
  if (places.length === 0) {
    return (
      <div style={{ height:'100%', display:'flex', alignItems:'center',
                    justifyContent:'center', flexDirection:'column', gap:12, color:t.muted }}>
        <div style={{ fontSize:40 }}>📊</div>
        <div>Noch keine Daten</div>
      </div>
    );
  }

  const total       = places.length;
  const countries   = new Set(places.map(p=>p.country).filter(Boolean)).size;
  const avgRating   = places.filter(p=>p.rating>0).length
    ? (places.filter(p=>p.rating>0).reduce((s,p)=>s+p.rating,0) /
       places.filter(p=>p.rating>0).length).toFixed(1)
    : '—';
  const thisYear    = places.filter(p=>p.visited_on?.startsWith(new Date().getFullYear()+'')).length;

  // Nach Kategorie
  const catCount = {};
  places.forEach(p => { catCount[p.category] = (catCount[p.category]||0)+1; });
  const catSorted = Object.entries(catCount).sort((a,b)=>b[1]-a[1]);
  const catMax    = catSorted[0]?.[1] || 1;

  // Nach Jahr
  const yearCount = {};
  places.forEach(p => {
    const y = p.visited_on?.slice(0,4);
    if (y) yearCount[y] = (yearCount[y]||0)+1;
  });
  const yearSorted = Object.entries(yearCount).sort((a,b)=>a[0].localeCompare(b[0]));
  const yearMax    = Math.max(...yearSorted.map(y=>y[1]),1);

  // Top 5
  const top5 = [...places].filter(p=>p.rating>0).sort((a,b)=>b.rating-a.rating).slice(0,5);

  const tileStyle = {
    background:t.bg2, border:`1px solid ${t.border}`, borderRadius:10,
    padding:'14px 12px', flex:1, minWidth:0,
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'0 0 32px' }}>
      <div style={{ padding:`calc(var(--sat) + 12px) 16px 12px` }}>
        <div style={{ fontFamily:t.font, fontSize:22, fontWeight:500, color:t.text }}>Statistik</div>
      </div>

      {/* Kacheln */}
      <div style={{ display:'flex', gap:10, padding:'0 16px 16px' }}>
        {[
          { val: total,     label: 'Orte gesamt'   },
          { val: countries, label: 'Länder'        },
          { val: avgRating, label: 'Ø Bewertung'   },
          { val: thisYear,  label: 'dieses Jahr'   },
        ].map(({val,label}) => (
          <div key={label} style={tileStyle}>
            <div style={{ fontFamily:t.font, fontSize:26, fontWeight:500, color:t.accent }}>{val}</div>
            <div style={{ fontSize:10, color:t.muted, marginTop:2, fontFamily:t.fontUI }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Nach Kategorie */}
      <SectionLabel t={t}>Nach Kategorie</SectionLabel>
      <div style={{ padding:'0 16px 16px' }}>
        {catSorted.map(([cat, count]) => {
          const c = CATEGORY_MAP[cat];
          return (
            <div key={cat} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:110, fontSize:12, color:t.muted, fontFamily:t.fontUI,
                            display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                <span>{c?.emoji}</span>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {c?.label||cat}
                </span>
              </div>
              <div style={{ flex:1, height:6, background:t.bg3, borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${(count/catMax)*100}%`, height:'100%',
                              background:t.accent, borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:12, color:t.muted, width:20, textAlign:'right',
                            fontFamily:t.fontUI }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Jahresübersicht */}
      {yearSorted.length > 1 && (
        <>
          <SectionLabel t={t}>Jahresübersicht</SectionLabel>
          <div style={{ padding:'0 16px 16px', display:'flex', gap:8, alignItems:'flex-end', height:80 }}>
            {yearSorted.map(([year, count]) => (
              <div key={year} style={{ flex:1, display:'flex', flexDirection:'column',
                                       alignItems:'center', gap:4, height:'100%',
                                       justifyContent:'flex-end' }}>
                <div style={{ fontSize:10, color:t.muted }}>{count}</div>
                <div style={{
                  width:'100%', background:t.accent, borderRadius:'4px 4px 0 0',
                  height:`${(count/yearMax)*60}px`,
                }}/>
                <div style={{ fontSize:9, color:t.muted, fontFamily:t.fontUI }}>{year}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Top 5 */}
      {top5.length > 0 && (
        <>
          <SectionLabel t={t}>Top 5 — bestbewertet</SectionLabel>
          <div style={{ padding:'0 16px 16px' }}>
            {top5.map((p,i) => (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                borderBottom:`1px solid ${t.border}`,
              }}>
                <div style={{ width:20, fontSize:14, color:t.gold, fontWeight:700 }}>{i+1}.</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:t.text, fontFamily:t.font }}>{p.title}</div>
                  <div style={{ fontSize:11, color:t.muted }}>{CATEGORY_MAP[p.category]?.label}</div>
                </div>
                <Stars n={p.rating} size={12} t={t}/>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ScreenProfile ───────────────────────────────────────────
function ScreenProfile({ t, user, dark, onToggleTheme, onLogout, apiBase, token }) {
  const [importing, setImporting] = React.useState(false);
  const [importMsg, setImportMsg] = React.useState('');

  function downloadExport() {
    const url = `${apiBase}/import.php?action=export`;
    const a   = document.createElement('a');
    a.href    = url;
    a.setAttribute('Authorization', 'Bearer ' + token); // funktioniert nicht für Downloads
    // Workaround: fetch + Blob
    fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.blob())
      .then(blob => {
        const bUrl = URL.createObjectURL(blob);
        const a2   = document.createElement('a');
        a2.href    = bUrl;
        a2.download = `places2love_${new Date().toISOString().slice(0,10)}.csv`;
        a2.click();
        URL.revokeObjectURL(bUrl);
      });
  }

  function downloadTemplate() {
    fetch(`${apiBase}/import.php?action=template`, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = 'places2love_vorlage.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportMsg('');
    const fd = new FormData();
    fd.append('csv', file);
    const res = await fetch(`${apiBase}/import.php?action=import`, {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd,
    });
    const data = await res.json();
    setImporting(false);
    setImportMsg(data.inserted > 0
      ? `✅ ${data.inserted} Orte importiert${data.errors?.length ? ` (${data.errors.length} Fehler)` : ''}`
      : `❌ ${data.error || 'Import fehlgeschlagen'}`
    );
  }

  const rowStyle = {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'14px 0', borderBottom:`1px solid ${t.border}`,
  };
  const btnStyle = {
    background:t.bg3, border:`1px solid ${t.border}`, borderRadius:8,
    color:t.text, padding:'8px 14px', fontSize:13, fontWeight:600, fontFamily:t.fontUI,
  };

  return (
    <div style={{ height:'100%', overflowY:'auto' }}>
      <div style={{ padding:`calc(var(--sat) + 12px) 16px 12px` }}>
        <div style={{ fontFamily:t.font, fontSize:22, fontWeight:500, color:t.text }}>Profil</div>
      </div>

      <div style={{ padding:'0 16px 48px' }}>

        {/* Nutzer-Info */}
        <div style={{ background:t.bg2, borderRadius:12, padding:'16px',
                      border:`1px solid ${t.border}`, marginBottom:20, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>👤</div>
          <div style={{ fontFamily:t.font, fontSize:18, color:t.text }}>{user.name || user.email}</div>
          <div style={{ fontSize:12, color:t.muted, marginTop:2 }}>{user.email}</div>
        </div>

        {/* Dark/Light Toggle */}
        <div style={rowStyle}>
          <div style={{ fontSize:14, color:t.text }}>Dark Mode</div>
          <button onClick={onToggleTheme} style={{
            ...btnStyle, display:'flex', alignItems:'center', gap:6,
          }}>
            {dark ? Icon.moon(t.text) : Icon.sun(t.text)}
            {dark ? 'Dark' : 'Light'}
          </button>
        </div>

        {/* CSV Export */}
        <SectionLabel t={t}>Daten</SectionLabel>
        <div style={rowStyle}>
          <div>
            <div style={{ fontSize:14, color:t.text }}>Exportieren</div>
            <div style={{ fontSize:12, color:t.muted }}>Alle Orte als CSV herunterladen</div>
          </div>
          <button onClick={downloadExport} style={btnStyle}>↓ CSV</button>
        </div>

        <div style={rowStyle}>
          <div>
            <div style={{ fontSize:14, color:t.text }}>Vorlage</div>
            <div style={{ fontSize:12, color:t.muted }}>Import-Vorlage herunterladen</div>
          </div>
          <button onClick={downloadTemplate} style={btnStyle}>↓ Vorlage</button>
        </div>

        <div style={{ ...rowStyle, flexDirection:'column', alignItems:'flex-start', gap:10 }}>
          <div>
            <div style={{ fontSize:14, color:t.text }}>Importieren</div>
            <div style={{ fontSize:12, color:t.muted }}>CSV-Datei hochladen</div>
          </div>
          <label style={{ ...btnStyle, cursor:'pointer' }}>
            {importing ? 'Importiere…' : '↑ CSV importieren'}
            <input type="file" accept=".csv" style={{ display:'none' }}
                   onChange={handleImport} disabled={importing}/>
          </label>
          {importMsg && <div style={{ fontSize:13, color:t.muted }}>{importMsg}</div>}
        </div>

        {/* Logout */}
        <div style={{ marginTop:32 }}>
          <button onClick={onLogout} style={{
            width:'100%', padding:14, background:'none',
            border:`1px solid #c03030`, borderRadius:10,
            color:'#c03030', fontSize:15, fontWeight:600, fontFamily:t.fontUI,
          }}>
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 2: Testen**

Statistik-Tab öffnen: Kacheln, Balkendiagramm, Jahresübersicht erscheinen.
Profil-Tab öffnen: Name, Dark/Light-Toggle, Export/Import, Logout.
Dark/Light-Toggle antippen: Theme wechselt sofort.

- [ ] **Schritt 3: Commit**

```bash
git add project/p2l-screens.jsx
git commit -m "feat: ScreenStats with tiles + charts, ScreenProfile with CSV + theme toggle"
```

---

## Phase 4 — Abschluss

### Task 16: Foto-Löschen im Backend nachrüsten

**Dateien:**
- Erweitern: `backend/api/places.php`

- [ ] **Schritt 1: Photo-DELETE-Endpoint zu places.php hinzufügen**

In `places.php` nach dem `// ── DELETE Ort löschen` Block folgenden Block einfügen (vor `jsonOut(['error' => 'Not found'], 404)`):

```php
// ── DELETE Foto löschen ───────────────────────────────────────
if ($method === 'DELETE' && isset($_GET['photo'])) {
  $photoId = (int)$_GET['photo'];
  $cfg     = require __DIR__ . '/../../backend/config.php';
  $stmt    = $db->prepare(
    "SELECT pp.path FROM place_photos pp
     JOIN places p ON p.id = pp.place_id
     WHERE pp.id = ? AND p.user_id = ?"
  );
  $stmt->execute([$photoId, $uid]);
  $photo = $stmt->fetch();
  if (!$photo) jsonOut(['error' => 'Not found'], 404);

  $file = rtrim($cfg['upload_dir'],'/') . '/' . ltrim($photo['path'],'/');
  if (file_exists($file)) unlink($file);
  $db->prepare("DELETE FROM place_photos WHERE id = ?")->execute([$photoId]);
  jsonOut(['ok' => true]);
}
```

- [ ] **Schritt 2: Frontend-Detail anpassen** — in ScreenDetail die `handleDeletePhoto`-Funktion auf den neuen Endpoint umstellen:

```jsx
async function handleDeletePhoto(photoId) {
  await apiFetch('/places.php?photo=' + photoId, { method:'DELETE' });
  const fresh = await apiFetch('/places.php?id=' + placeId);
  if (fresh && !fresh.error) setPlace(fresh);
}
```

Und den Foto-Thumbnail in ScreenDetail mit Löschen-Button ergänzen:

```jsx
{place.photos?.map(ph => (
  <div key={ph.id} style={{ position:'relative', flexShrink:0 }}>
    <img src={`${cfg.uploadUrl}/${ph.path}`}
         style={{ width:100, height:100, objectFit:'cover', borderRadius:8 }}/>
    <button onClick={()=>handleDeletePhoto(ph.id)} style={{
      position:'absolute', top:3, right:3,
      background:'rgba(0,0,0,0.6)', borderRadius:999,
      width:20, height:20, display:'flex', alignItems:'center',
      justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700,
    }}>×</button>
  </div>
))}
```

- [ ] **Schritt 3: Testen**

Foto hochladen, dann ×-Button antippen → Foto verschwindet aus Galerie und aus uploads/

- [ ] **Schritt 4: Commit**

```bash
git add backend/api/places.php project/p2l-screens.jsx
git commit -m "feat: photo delete endpoint + UI button"
```

---

### Task 17: .htaccess Hauptdatei + README

**Dateien:**
- Anlegen: `.htaccess`
- Anlegen: `README.md`

- [ ] **Schritt 1: .htaccess anlegen**

```apache
Options -Indexes

# HTTPS-Weiterleitung (auf Produktivserver aktivieren):
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Korrekte MIME-Types
AddType application/manifest+json .webmanifest
AddType text/javascript .jsx

# Caching
<FilesMatch "\.(css|js|jsx|svg|png|jpg|webp|woff2)$">
  Header set Cache-Control "max-age=31536000, immutable"
</FilesMatch>
<FilesMatch "\.(html|webmanifest)$">
  Header set Cache-Control "no-cache"
</FilesMatch>
```

- [ ] **Schritt 2: README.md anlegen** (Kurzanleitung für Installation und Deployment — analog Camperstop README, angepasst für places2love)

Inhalt: Projektbeschreibung, Features, Voraussetzungen, Installation (DB-Schema, config.php, mapy.cz Key, uploads/ anlegen), lokale Entwicklung mit Herd, PWA-Installation, CSV-Import-Format, Sicherheitshinweise.

- [ ] **Schritt 3: Vollständigen Smoke-Test durchführen**

```
□ Login/Register — funktioniert
□ Ort anlegen mit allen Feldern — erscheint in Liste
□ Ort bearbeiten — Änderungen gespeichert
□ Foto hochladen — erscheint in Detail-Galerie
□ Foto löschen — verschwindet
□ Karte — Pins korrekt, mapy.cz + OSM-Wechsel
□ Statistik — Kacheln + Diagramme korrekt
□ CSV-Export — lädt korrekt herunter
□ CSV-Import — Vorlage-Daten werden importiert
□ Dark/Light-Toggle — Theme wechselt + bleibt nach Reload
□ Offline — Flugmodus aktivieren, Ort anlegen → Queue-Badge erscheint
□ Online zurück — Queue synchronisiert sich
□ PWA-Install: Safari → Teilen → Zum Home-Bildschirm
```

- [ ] **Schritt 4: Final Commit**

```bash
git add .htaccess README.md
git commit -m "feat: complete places2love PWA — all screens, map, stats, CSV, offline"
```

---

## Spec-Abdeckungsprüfung

| Anforderung aus Spec | Task |
|---|---|
| Kategorien (12 + Freie) | Task 8 |
| Felder: Name, Kategorie, Sterne, Schwierigkeit, Datum, Land, Region, Beschreibung, Eintritt, Dauer, Wiederbesuchen, Tags, Links (mehrere), GPS, Fotos | Task 13 |
| Kartenansicht mit Pins | Task 14 |
| mapy.cz + OSM umschaltbar | Task 14 |
| Multi-User | Task 4 |
| Dark/Light-Toggle | Task 15 |
| Statistik (4 Kacheln, Kategorien, Jahresübersicht, Top 5) | Task 15 |
| CSV Import/Export | Task 7, Task 15 |
| Foto-Upload mit Resize | Task 6 |
| Foto-Löschen | Task 16 |
| PWA / Offline-Queue | Task 9, Task 16 |
| all-inkl.com-kompatibel (PHP 8, kein Build-Step) | Gesamte Architektur |
