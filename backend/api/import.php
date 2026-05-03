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
    'Bewertung','Schwierigkeit','Eintritt EUR','Dauer','Wiederbesuchen','Tags','Notizen','Lat','Lng'], ';', '"', '\\');
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
    ], ';', '"', '\\');
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
    'Bewertung','Schwierigkeit','Eintritt EUR','Dauer','Wiederbesuchen','Tags','Notizen','Lat','Lng'], ';', '"', '\\');
  fputcsv($out, ['Kuhfluchtwasserfälle','Wasserfall','','Deutschland','Bayern',
    '01.05.2025','5','2','3.00','2,5 Std.','ja','Familie,Herbst','Toller Ausflug','47.593900','11.089500'], ';', '"', '\\');
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

  $COUNTRIES = require __DIR__ . '/../../project/countries.php';
  $inserted  = 0;
  $errors    = [];

  foreach ($lines as $i => $line) {
    if (!trim($line)) continue;
    $col = str_getcsv($line, ';', '"', '\\');
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
    if ($d && $d->format($fmt) === $s) return $d->format('Y-m-d');
  }
  return null;
}
