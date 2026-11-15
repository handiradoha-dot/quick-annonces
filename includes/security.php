<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/env.php';

$authCookie = 'quickannonces_session';
$authSecret = envValue('AUTH_SECRET');
if ($authSecret && isset($_COOKIE[$authCookie])) {
    $parts = explode('.', (string)$_COOKIE[$authCookie], 2);
    if (count($parts) === 2 && hash_equals(hash_hmac('sha256', $parts[0], $authSecret), $parts[1])) {
        $payload = json_decode((string)base64_decode(strtr($parts[0], '-_', '+/')), true);
        if (is_array($payload) && (int)($payload['exp'] ?? 0) > time()) {
            $_SESSION['user'] = $payload['user'] ?? null;
            $_SESSION['csrf'] = $payload['csrf'] ?? null;
        }
    }
}

function persistAuthCookie(): void
{
    $secret = envValue('AUTH_SECRET');
    if (!$secret || strlen($secret) < 32) throw new RuntimeException('AUTH_SECRET must contain at least 32 characters.');
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    $payload = ['user' => $_SESSION['user'] ?? null, 'csrf' => $_SESSION['csrf'] ?? null, 'exp' => time() + 604800];
    $encoded = rtrim(strtr(base64_encode(json_encode($payload, JSON_UNESCAPED_UNICODE)), '+/', '-_'), '=');
    $token = $encoded . '.' . hash_hmac('sha256', $encoded, $secret);
    setcookie('quickannonces_session', $token, ['expires' => time() + 604800, 'path' => '/', 'secure' => $isHttps, 'httponly' => true, 'samesite' => 'Lax']);
}

function clearAuthCookie(): void
{
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    setcookie('quickannonces_session', '', ['expires' => time() - 3600, 'path' => '/', 'secure' => $isHttps, 'httponly' => true, 'samesite' => 'Lax']);
}

function requireCsrf(): void
{
    $expected = $_SESSION['csrf'] ?? '';
    $received = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$expected || !$received || !hash_equals($expected, $received)) respond(['error' => 'Invalid request token. Refresh and try again.'], 419);
}
