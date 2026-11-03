<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';


function apiAuthSecret(): string
{
    static $secret = null;

    if ($secret !== null) {
        return $secret;
    }

    $configPath = dirname(__DIR__) . '/config/local.php';

    if (!is_file($configPath)) {
        return $secret = '';
    }

    $config = require $configPath;

    $secret = is_array($config)
        ? (string)($config['AUTH_SECRET'] ?? '')
        : '';

    return $secret;
}


function apiStart(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    $GLOBALS['qaUser'] = null;
    $secret = apiAuthSecret();
    $parts = explode('.', (string)($_COOKIE['qa_auth'] ?? ''), 2);
    if (!$secret || strlen($secret) < 32 || count($parts) !== 2) return;
    [$payload, $signature] = $parts;
    $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, $secret, true)), '+/', '-_'), '=');
    if (!hash_equals($expected, $signature)) return;
    $json = base64_decode(strtr($payload, '-_', '+/'));
    $claims = json_decode($json ?: '', true);
    if (!is_array($claims) || (int)($claims['exp'] ?? 0) < time() || !isset($claims['id'], $claims['name'], $claims['email'], $claims['role'])) return;
    $GLOBALS['qaUser'] = ['id' => (int)$claims['id'], 'name' => $claims['name'], 'email' => $claims['email'], 'role' => $claims['role']];
}

function apiJson(array $body, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function apiMethod(string ...$allowed): void
{
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        apiJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
    }
}

function apiInput(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : $_POST;
}

function apiUser(): ?array
{
    return isset($GLOBALS['qaUser']) && is_array($GLOBALS['qaUser']) ? $GLOBALS['qaUser'] : null;
}

function apiSetUser(array $user): void
{
    $secret = apiAuthSecret();
    if (!$secret || strlen($secret) < 32) apiJson(['ok' => false, 'error' => 'AUTH_SECRET must be configured with at least 32 characters.'], 503);
    $claims = $user + ['exp' => time() + 86400];
    $payload = rtrim(strtr(base64_encode(json_encode($claims, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)), '+/', '-_'), '=');
    $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, $secret, true)), '+/', '-_'), '=');
    $secure = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    setcookie('qa_auth', $payload . '.' . $signature, ['expires' => time() + 86400, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
    $GLOBALS['qaUser'] = $user;
}

function apiClearUser(): void
{
    $secure = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    setcookie('qa_auth', '', ['expires' => time() - 3600, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax']);
    $GLOBALS['qaUser'] = null;
}

function apiRequireUser(?string $role = null): array
{
    $user = apiUser();
    if (!$user) apiJson(['ok' => false, 'error' => 'Please sign in first.'], 401);
    if ($role !== null && ($user['role'] ?? '') !== $role) {
        apiJson(['ok' => false, 'error' => 'You are not allowed to do that.'], 403);
    }
    return $user;
}

function apiDb(): PDO
{
    try {
        return getDatabase();
    } catch (Throwable $e) {
        error_log('QuickAnnonces database error: ' . $e->getMessage());
        apiJson(['ok' => false, 'error' => 'Database connection failed. Check server configuration.'], 503);
    }
}

function apiListingRow(array $row): array
{
    $row['id'] = (int)$row['id'];
    $row['price'] = (float)$row['price'];
    $row['category'] = $row['category_name'];
    $row['seller'] = $row['seller_name'];
    $row['condition'] = $row['item_condition'] ?? '';
    $row['image'] = $row['image_url'] ?? '';
    $row['type'] = $row['listing_type'] === 'wanted' ? 'Je recherche' : 'À vendre';
    $row['status'] = ['pending' => 'En attente', 'approved' => 'Approuvee', 'rejected' => 'Refusee'][$row['status']] ?? $row['status'];
    $row['age'] = $row['created_at'];
    $row['emoji'] = '📦';
    $row['verified'] = false;
    return $row;
}

function apiListingSelect(): string
{
    return 'SELECT l.*, c.name AS category_name, u.full_name AS seller_name '
        . 'FROM qa_listings l JOIN qa_categories c ON c.id = l.category_id '
        . 'JOIN qa_users u ON u.id = l.seller_id';
}
