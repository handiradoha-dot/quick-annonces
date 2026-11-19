<?php
declare(strict_types=1);

function respond(array $body, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function input(): array
{
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($type, 'application/json')) {
        $data = json_decode(file_get_contents('php://input') ?: '', true);
        return is_array($data) ? $data : [];
    }
    return $_POST;
}

function rowImages(PDO $pdo, int $id): array
{
    $q = $pdo->prepare('SELECT image_url, cloudinary_public_id, position FROM annonce_images WHERE annonce_id = ? ORDER BY position, id');
    $q->execute([$id]);
    return $q->fetchAll();
}

function listing(PDO $pdo, int $id): ?array
{
    $q = $pdo->prepare('SELECT a.id, a.user_id, a.category_id, a.annonce_type, a.title, a.description, a.price, a.currency, a.city, a.item_condition, a.status, a.created_at, c.name AS category, u.full_name AS seller FROM annonce a JOIN categories c ON c.id=a.category_id JOIN users u ON u.id=a.user_id WHERE a.id=?');
    $q->execute([$id]);
    $row = $q->fetch();
    if ($row) $row['images'] = rowImages($pdo, (int)$row['id']);
    return $row ?: null;
}

function saveImage(PDO $pdo, int $adId, array $file, int $position): void
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return;
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || ($file['size'] ?? 0) > 8 * 1024 * 1024) respond(['error' => 'Each image must be 8 MB or smaller.'], 422);
    $tmp = $file['tmp_name'] ?? '';
    if (!$tmp || !is_uploaded_file($tmp)) respond(['error' => 'Invalid image upload.'], 422);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!isset($allowed[$mime]) || strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION)) !== $allowed[$mime]) respond(['error' => 'Use a JPG, PNG, or WebP image.'], 422);
    $result = cloudinary()->uploadApi()->upload($tmp, ['folder' => 'quickannonces', 'resource_type' => 'image', 'allowed_formats' => ['jpg', 'png', 'webp'], 'overwrite' => false]);
    $secureUrl = $result['secure_url'] ?? null;
    $publicId = $result['public_id'] ?? null;
    if (!$secureUrl || !$publicId) throw new RuntimeException('Image storage returned an incomplete result.');
    $q = $pdo->prepare('INSERT INTO annonce_images (annonce_id, cloudinary_public_id, image_url, position) VALUES (?, ?, ?, ?)');
    $q->execute([$adId, $publicId, $secureUrl, $position]);
}

// Base URL used in emailed links. Never derived from the request Host header,
// which a client controls.
function appUrl(): ?string
{
    $url = envValue('APP_URL');
    if (!$url && envValue('VERCEL_PROJECT_PRODUCTION_URL')) $url = 'https://' . envValue('VERCEL_PROJECT_PRODUCTION_URL');
    return $url ? rtrim($url, '/') : null;
}

function mailConfigured(): bool
{
    return (bool)(envValue('RESEND_API_KEY') && envValue('MAIL_FROM'));
}

// Sends a plain-text email through the Resend HTTP API (https://resend.com).
function sendMail(string $to, string $subject, string $text): void
{
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . envValue('RESEND_API_KEY'), 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['from' => envValue('MAIL_FROM'), 'to' => [$to], 'subject' => $subject, 'text' => $text], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($body === false || $status < 200 || $status >= 300) throw new RuntimeException('Email delivery failed with status ' . $status . '.');
}

// When the expiration migration has been applied, an approved listing is
// published today and expires 30 days later. Without the migration the
// columns do not exist and this is skipped.
function setPublicationDates(PDO $pdo, int $id): void
{
    try {
        $pdo->prepare('UPDATE annonce SET date_publication=CURDATE(), date_expiration=DATE_ADD(CURDATE(), INTERVAL 30 DAY) WHERE id=?')->execute([$id]);
    } catch (PDOException $e) {
        if ($e->getCode() !== '42S22') throw $e;
    }
}
