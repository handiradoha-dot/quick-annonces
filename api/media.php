<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'Méthode non autorisée.'], 405);
authenticatedUser();

$cloudinaryUrl = getenv('CLOUDINARY_URL') ?: '';
$cloudinary = parse_url($cloudinaryUrl);
$cloudName = $cloudinary['host'] ?? '';
$apiKey = rawurldecode($cloudinary['user'] ?? '');
$apiSecret = rawurldecode($cloudinary['pass'] ?? '');
if (($cloudinary['scheme'] ?? '') !== 'cloudinary' || !$cloudName || !$apiKey || !$apiSecret) {
    jsonResponse(['error' => 'Configuration CLOUDINARY_URL absente ou invalide dans Vercel.'], 503);
}
if (!function_exists('curl_init') || !class_exists('CURLFile')) jsonResponse(['error' => 'Extension cURL indisponible sur le serveur.'], 503);
if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) jsonResponse(['error' => 'Sélectionnez une image valide.'], 422);
$file = $_FILES['photo'];
if ($file['size'] > 5 * 1024 * 1024) jsonResponse(['error' => 'La photo doit faire 5 Mo maximum.'], 413);
$imageInfo = @getimagesize($file['tmp_name']);
if (!$imageInfo || !in_array($imageInfo['mime'], ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
    jsonResponse(['error' => 'Formats acceptés : JPEG, PNG, WebP ou GIF.'], 422);
}

$handle = curl_init('https://api.cloudinary.com/v1_1/' . rawurlencode($cloudName) . '/image/upload');
curl_setopt_array($handle, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => $apiKey . ':' . $apiSecret,
    CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
    CURLOPT_POSTFIELDS => ['file' => new CURLFile($file['tmp_name'], $imageInfo['mime'], basename($file['name']))],
    CURLOPT_TIMEOUT => 30,
]);
$response = curl_exec($handle);
$status = (int)curl_getinfo($handle, CURLINFO_HTTP_CODE);
$curlError = curl_error($handle);
curl_close($handle);
if ($response === false || $status < 200 || $status >= 300) {
    error_log('Cloudinary upload failed: ' . $curlError . ' HTTP ' . $status);
    jsonResponse(['error' => 'Cloudinary n’a pas pu enregistrer la photo.'], 502);
}
$payload = json_decode($response, true);
if (empty($payload['secure_url'])) jsonResponse(['error' => 'Cloudinary n’a pas retourné l’URL de la photo.'], 502);
jsonResponse(['url' => $payload['secure_url']]);
