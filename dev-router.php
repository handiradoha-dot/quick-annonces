<?php
declare(strict_types=1);

// Local PHP built-in server router. Production routing remains in Caddy/Vercel.
$requestPath = rawurldecode((string)(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'));
if (str_starts_with($requestPath, '/api/')) {
    $_GET['route'] = ltrim($requestPath, '/');
    require __DIR__ . '/api/router.php';
    return true;
}

$relativePath = ltrim($requestPath, '/');
if ($relativePath === '' || str_ends_with($relativePath, '/')) $relativePath .= 'index.html';
$publicRoot = realpath(__DIR__ . '/public');
$target = realpath($publicRoot . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativePath));
if (!$publicRoot || !$target || !str_starts_with($target, $publicRoot . DIRECTORY_SEPARATOR) || !is_file($target)) {
    http_response_code(404);
    echo 'Not found';
    return true;
}

$mime = function_exists('mime_content_type') ? mime_content_type($target) : false;
if (is_string($mime)) header('Content-Type: ' . $mime);
readfile($target);
return true;
