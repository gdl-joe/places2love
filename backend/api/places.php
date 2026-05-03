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
