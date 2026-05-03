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
