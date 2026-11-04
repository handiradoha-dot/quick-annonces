<?php

header('Content-Type: application/json; charset=utf-8');

function jsonResponse(array $payload, $status = 200)
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestBody()
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        jsonResponse(['error' => 'Corps de requête invalide.'], 400);
    }
    return $data;
}

function database()
{
    static $pdo;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $configPath = is_file(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/config.php.example';
    $config = require $configPath;
    if (empty($config['ssl_ca']) && is_file(__DIR__ . '/ca.pem')) $config['ssl_ca'] = __DIR__ . '/ca.pem';
    if (empty($config['dsn']) || empty($config['username']) || empty($config['password'])) {
        jsonResponse(['error' => 'Variables DB manquantes : QA_DB_DSN, QA_DB_USER et QA_DB_PASSWORD.'], 503);
    }
    $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
    if (!empty($config['ssl_ca']) && defined('PDO::MYSQL_ATTR_SSL_CA')) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $config['ssl_ca'];
        if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
    }
    try {
        $pdo = new PDO($config['dsn'], $config['username'], $config['password'], $options);
    } catch (PDOException $exception) {
        error_log($exception->getMessage());
        jsonResponse(['error' => 'Connexion à la base de données impossible.'], 503);
    }
    return $pdo;
}

function authenticatedUser()
{
    $userId = sessionUserId();
    if (!$userId) {
        jsonResponse(['error' => 'Authentification requise.'], 401);
    }
    $statement = database()->prepare('SELECT id, full_name, email, role FROM qa_users WHERE id = ?');
    $statement->execute([$userId]);
    $user = $statement->fetch();
    if (!$user) {
        revokeAuthSession();
        jsonResponse(['error' => 'Session invalide.'], 401);
    }
    return $user;
}

function clearAuthCookie()
{
    setcookie('qa_auth', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite' => 'Lax']);
}

function setAuthenticatedUser($id)
{
    $pdo = database();
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 60 * 60 * 24 * 14);
    $statement = $pdo->prepare('INSERT INTO qa_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)');
    $statement->execute([(int)$id, hash('sha256', $token), $expiresAt]);
    setcookie('qa_auth', $token, ['expires' => time() + 60 * 60 * 24 * 14, 'path' => '/', 'httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite' => 'Lax']);
}

function sessionUserId()
{
    $token = $_COOKIE['qa_auth'] ?? '';
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) return 0;
    $statement = database()->prepare('SELECT user_id FROM qa_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1');
    $statement->execute([hash('sha256', $token)]);
    return (int)$statement->fetchColumn();
}

function revokeAuthSession()
{
    $token = $_COOKIE['qa_auth'] ?? '';
    if (preg_match('/^[a-f0-9]{64}$/', $token)) {
        $statement = database()->prepare('DELETE FROM qa_sessions WHERE token_hash = ?');
        $statement->execute([hash('sha256', $token)]);
    }
    clearAuthCookie();
}
