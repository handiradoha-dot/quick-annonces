<?php

ini_set('display_errors', '0');
ini_set('log_errors', '1');
header('Content-Type: application/json; charset=utf-8');

function jsonResponse(array $payload, $status = 200)
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

set_exception_handler(static function ($exception) {
    error_log($exception->getMessage());
    $isDatabaseError = $exception instanceof PDOException;
    jsonResponse(['error' => $isDatabaseError ? 'Erreur base de données. Vérifiez le schéma et les droits de DB_USER.' : 'Erreur serveur. Réessayez dans un instant.'], $isDatabaseError ? 503 : 500);
});

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
    $hasEnvironmentConfig = getenv('VERCEL') || getenv('DB_HOST') || getenv('QA_DB_DSN');
    $configPath = $hasEnvironmentConfig || !is_file(__DIR__ . '/config.php')
        ? __DIR__ . '/config.php.example'
        : __DIR__ . '/config.php';
    $config = require $configPath;
    if (empty($config['ssl_ca']) && is_file(__DIR__ . '/ca.pem')) $config['ssl_ca'] = __DIR__ . '/ca.pem';
    if (empty($config['dsn']) || empty($config['username']) || empty($config['password'])) {
        jsonResponse(['error' => 'Variables DB manquantes : DB_HOST, DB_PORT, DB_USER et DB_PASSWORD (ou leurs équivalents QA_DB_*).'], 503);
    }
    $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
    if (!empty($config['ssl_ca'])) {
        if (class_exists('Pdo\\Mysql')) {
            $options[\Pdo\Mysql::ATTR_SSL_CA] = $config['ssl_ca'];
            $options[\Pdo\Mysql::ATTR_SSL_VERIFY_SERVER_CERT] = true;
        } elseif (PHP_VERSION_ID < 80500 && defined('PDO::MYSQL_ATTR_SSL_CA')) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = $config['ssl_ca'];
            if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
        }
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
    ensureSessionTable($pdo);
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
    $pdo = database();
    ensureSessionTable($pdo);
    $statement = $pdo->prepare('SELECT user_id FROM qa_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1');
    $statement->execute([hash('sha256', $token)]);
    return (int)$statement->fetchColumn();
}

function revokeAuthSession()
{
    $token = $_COOKIE['qa_auth'] ?? '';
    if (preg_match('/^[a-f0-9]{64}$/', $token)) {
        $pdo = database();
        ensureSessionTable($pdo);
        $statement = $pdo->prepare('DELETE FROM qa_sessions WHERE token_hash = ?');
        $statement->execute([hash('sha256', $token)]);
    }
    clearAuthCookie();
}

function ensureSessionTable($pdo = null)
{
    $pdo = $pdo ?: database();
    $pdo->exec("CREATE TABLE IF NOT EXISTS qa_sessions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_qa_sessions_token_hash (token_hash),
        KEY idx_qa_sessions_user_id (user_id),
        KEY idx_qa_sessions_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function ensureListingMeta($pdo = null)
{
    $pdo = $pdo ?: database();
    $pdo->exec("CREATE TABLE IF NOT EXISTS qa_listing_meta (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        product_reference VARCHAR(50) NOT NULL,
        user_id BIGINT UNSIGNED NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Approuvee',
        listing_type VARCHAR(50) NULL,
        condition_label VARCHAR(100) NULL,
        description TEXT NULL,
        city VARCHAR(100) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), UNIQUE KEY uq_qa_listing_meta_reference (product_reference),
        KEY idx_qa_listing_meta_user (user_id), KEY idx_qa_listing_meta_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS qa_comments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        listing_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id), KEY idx_qa_comments_listing (listing_id), KEY idx_qa_comments_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("INSERT IGNORE INTO qa_listing_meta (product_reference, status) SELECT reference, 'Approuvee' FROM produit");
}
