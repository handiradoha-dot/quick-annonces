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
    $q = $pdo->prepare("SELECT a.id, a.user_id, a.category_id, a.annonce_type, a.title, a.description, a.price, a.currency, a.city, a.item_condition, CASE WHEN a.status='approved' AND a.date_expiration < CURDATE() THEN 'expired' ELSE a.status END AS status, a.created_at, a.date_publication, a.date_expiration, c.name AS category, u.full_name AS seller FROM annonce a JOIN categories c ON c.id=a.category_id JOIN users u ON u.id=a.user_id WHERE a.id=?");
    $q->execute([$id]);
    $row = $q->fetch();
    if ($row) $row['images'] = rowImages($pdo, (int)$row['id']);
    return $row ?: null;
}

/** Load photo rows for a result set in one query instead of one query per ad. */
function attachListingImages(PDO $pdo, array $items): array
{
    if (!$items) return [];
    $ids = array_values(array_unique(array_filter(array_map(static fn(array $item): int => (int)($item['id'] ?? 0), $items))));
    foreach ($items as &$item) $item['images'] = [];
    unset($item);
    if (!$ids) return $items;

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT annonce_id,image_url,cloudinary_public_id,position FROM annonce_images WHERE annonce_id IN ($placeholders) ORDER BY annonce_id,position,id");
    $stmt->execute($ids);
    $positions = [];
    foreach ($items as $index => $item) $positions[(int)$item['id']] = $index;
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $image) {
        $index = $positions[(int)$image['annonce_id']] ?? null;
        if ($index === null) continue;
        unset($image['annonce_id']);
        $items[$index]['images'][] = $image;
    }
    $stmt->closeCursor();
    return $items;
}

/** Fetch a set of listings and their photos with two database queries total. */
function listingsByIds(PDO $pdo, array $ids): array
{
    $orderedIds = array_values(array_unique(array_filter(array_map('intval', $ids), static fn(int $id): bool => $id > 0)));
    if (!$orderedIds) return [];
    $placeholders = implode(',', array_fill(0, count($orderedIds), '?'));
    $stmt = $pdo->prepare("SELECT a.id,a.user_id,a.category_id,a.annonce_type,a.title,a.description,a.price,a.currency,a.city,a.item_condition,CASE WHEN a.status='approved' AND a.date_expiration<CURDATE() THEN 'expired' ELSE a.status END AS status,a.created_at,a.date_publication,a.date_expiration,c.name AS category,u.full_name AS seller FROM annonce a JOIN categories c ON c.id=a.category_id JOIN users u ON u.id=a.user_id WHERE a.id IN ($placeholders)");
    $stmt->execute($orderedIds);
    $byId = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $item) $byId[(int)$item['id']] = $item;
    $stmt->closeCursor();
    $ordered = [];
    foreach ($orderedIds as $id) if (isset($byId[$id])) $ordered[] = $byId[$id];
    return attachListingImages($pdo, $ordered);
}

/** Execute a fixed stored-procedure call and release every pending result rowset. */
function procedureRows(PDO $pdo, string $call): array
{
    $stmt = $pdo->query($call);
    try {
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } finally {
        $stmt->closeCursor();
    }
}

/** Rehydrate report IDs through the normal listing serializer, including images. */
function listingsForReport(PDO $pdo, array $rows): array
{
    $ids = [];
    foreach ($rows as $row) {
        $id = filter_var($row['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id !== false && $id !== null) $ids[] = (int)$id;
    }
    return listingsByIds($pdo, $ids);
}

final class UploadValidationException extends RuntimeException {}

function saveImage(array $file, int $position, array &$uploadedPublicIds): ?array
{
    $error = filter_var($file['error'] ?? UPLOAD_ERR_NO_FILE, FILTER_VALIDATE_INT);
    if ($error === UPLOAD_ERR_NO_FILE) return null;
    if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE || (int)($file['size'] ?? 0) > 8 * 1024 * 1024) {
        throw new UploadValidationException('Each image must be 8 MB or smaller.');
    }
    if ($error !== UPLOAD_ERR_OK) throw new UploadValidationException('The image could not be uploaded. Please try again.');

    $tmp = is_string($file['tmp_name'] ?? null) ? $file['tmp_name'] : '';
    $name = is_string($file['name'] ?? null) ? $file['name'] : '';
    if ($tmp === '' || !is_uploaded_file($tmp)) throw new UploadValidationException('Invalid image upload.');

    $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
    $allowed = ['image/jpeg' => ['jpg', 'jpeg']];
    if (!is_string($mime) || !isset($allowed[$mime]) || !in_array($extension, $allowed[$mime], true)) {
        throw new UploadValidationException('Use a JPG or JPEG image.');
    }

    $result = cloudinary()->uploadApi()->upload($tmp, [
        'folder' => 'quickannonces',
        'resource_type' => 'image',
        'allowed_formats' => ['jpg', 'jpeg'],
        'overwrite' => false,
    ]);
    $secureUrl = $result['secure_url'] ?? null;
    $publicId = $result['public_id'] ?? null;
    if (!is_string($secureUrl) || $secureUrl === '' || !is_string($publicId) || $publicId === '') {
        throw new RuntimeException('Image storage returned an incomplete result.');
    }
    $uploadedPublicIds[] = $publicId;
    return ['cloudinary_public_id' => $publicId, 'image_url' => $secureUrl, 'position' => $position];
}

/** Convert PHP's column-oriented $_FILES structure into one record per file. */
function normalizeUploadedFiles(array $files): array
{
    if (!array_key_exists('name', $files)) return [];
    $names = is_array($files['name']) ? $files['name'] : [$files['name']];
    $normalized = [];
    foreach ($names as $index => $name) {
        $get = static function (string $key) use ($files, $index): mixed {
            $value = $files[$key] ?? null;
            return is_array($value) ? ($value[$index] ?? null) : $value;
        };
        $normalized[] = [
            'name' => $name,
            'type' => $get('type'),
            'tmp_name' => $get('tmp_name'),
            'error' => $get('error') ?? UPLOAD_ERR_NO_FILE,
            'size' => $get('size') ?? 0,
        ];
    }
    return $normalized;
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

// Fill dates only for legacy listings that do not already have them.
function setPublicationDates(PDO $pdo, int $id): void
{
    $pdo->prepare('UPDATE annonce SET date_expiration=COALESCE(date_expiration,calculer_date_expiration(COALESCE(date_publication,CURDATE()))), date_publication=COALESCE(date_publication,CURDATE()) WHERE id=?')->execute([$id]);
}
