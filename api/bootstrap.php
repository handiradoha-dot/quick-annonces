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
    $driverCode = $isDatabaseError ? (int)($exception->errorInfo[1] ?? 0) : 0;
    if (!$isDatabaseError) $message = 'Erreur serveur.';
    elseif ($driverCode === 1142 || $driverCode === 1143) $message = 'DB_USER doit avoir les droits SELECT, INSERT, UPDATE et DELETE sur les tables applicatives.';
    elseif ($driverCode === 1146) $message = 'Une table requise manque. Exécutez les migrations SQL du dossier api/migrations dans Aiven.';
    elseif ($driverCode === 1054) $message = 'Une colonne SQL est absente du schéma utilisé. Vérifiez les colonnes de produit et qa_categories; les journaux Vercel donnent la table concernée.';
    else $message = 'Erreur base de données. Vérifiez le schéma et les droits de DB_USER.';
    jsonResponse(['error' => $message], $isDatabaseError ? 503 : 500);
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

function assertUserSchema($pdo = null)
{
    $pdo = $pdo ?: database();
    $columns = $pdo->query('SHOW COLUMNS FROM qa_users')->fetchAll(PDO::FETCH_COLUMN);
    $required = ['id', 'full_name', 'email', 'password_hash', 'role'];
    $missing = array_values(array_diff($required, $columns));
    if ($missing) jsonResponse(['error' => 'qa_users missing columns: ' . implode(', ', $missing) . '. Check DB_NAME in Vercel and the schema in Aiven.'], 503);
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
    $check = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'qa_sessions'");
    $check->execute();
    if ((int)$check->fetchColumn() === 0) jsonResponse(['error' => 'Table qa_sessions absente. Exécutez api/migrations/001_qa_sessions.sql une fois dans Aiven avec un utilisateur administrateur.'], 503);
}
function ensureListingMeta($pdo = null)
{
    $pdo = $pdo ?: database();
    $check = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('qa_listing_meta', 'qa_comments')");
    $check->execute();
    if ((int)$check->fetchColumn() < 2) jsonResponse(['error' => 'Tables applicatives absentes. Exécutez api/migrations/002_app_tables.sql une fois dans Aiven avec un utilisateur administrateur.'], 503);
    $pdo->exec("INSERT IGNORE INTO qa_listing_meta (product_reference, status) SELECT reference, 'Approuvee' FROM produit");
}
