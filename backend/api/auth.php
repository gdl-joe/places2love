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
  if (!$email || strlen($pass) < 8)
    jsonOut(['error' => 'E-Mail und mind. 8 Zeichen Passwort erforderlich'], 400);
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

function issueToken(PDO $db, int $uid): string {
  $token   = bin2hex(random_bytes(32));
  $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
  $db->prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)")
     ->execute([$token, $uid, $expires]);
  return $token;
}
