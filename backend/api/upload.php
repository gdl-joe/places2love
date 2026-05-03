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
  'image/heic', 'image/heif' => 'jpg',
  default       => null,
};
if (!$ext) jsonOut(['error' => 'Nur JPEG, PNG, WebP erlaubt'], 415);

$filename  = date('Ymd_His_') . bin2hex(random_bytes(4)) . '.' . $ext;
$uploadDir = rtrim($cfg['upload_dir'], '/');
$destPath  = $uploadDir . '/' . $filename;

// Resize mit GD
$maxPx = $cfg['image_max_px'];
[$origW, $origH] = getimagesize($file['tmp_name']);
$scale  = min(1.0, $maxPx / max($origW, $origH));
$newW   = (int)round($origW * $scale);
$newH   = (int)round($origH * $scale);

$src = match ($mime) {
  'image/png'  => imagecreatefrompng($file['tmp_name']),
  'image/webp' => imagecreatefromwebp($file['tmp_name']),
  default       => imagecreatefromjpeg($file['tmp_name']),
};
if (!$src) jsonOut(['error' => 'Bild konnte nicht verarbeitet werden'], 422);

$dst = imagecreatetruecolor($newW, $newH);
// Preserve transparency for PNG/WebP
imagealphablending($dst, false);
imagesavealpha($dst, true);
imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);

if ($ext === 'png') {
  imagepng($dst, $destPath, 9);
} elseif ($ext === 'webp') {
  imagewebp($dst, $destPath, 85);
} else {
  imagejpeg($dst, $destPath, 85);
}
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
