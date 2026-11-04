<?php
require __DIR__ . '/bootstrap.php';
$user = authenticatedUser(); $pdo = database(); ensureListingMeta($pdo);
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT listing_id FROM qa_favorites WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([(int)$user['id']]);
    jsonResponse(['ids' => array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN))]);
}
$body = requestBody(); $id = (int)($body['listing_id'] ?? $body['id'] ?? 0);
if (!$id) jsonResponse(['error' => 'Annonce requise.'], 422);
if ($method === 'POST') {
    $check = $pdo->prepare('SELECT id FROM qa_listing_meta WHERE id = ?'); $check->execute([$id]);
    if (!$check->fetchColumn()) jsonResponse(['error' => 'Annonce introuvable.'], 404);
    $stmt = $pdo->prepare('INSERT IGNORE INTO qa_favorites (user_id, listing_id) VALUES (?, ?)'); $stmt->execute([(int)$user['id'], $id]);
    jsonResponse(['ok' => true]);
}
if ($method === 'DELETE') {
    $stmt = $pdo->prepare('DELETE FROM qa_favorites WHERE user_id = ? AND listing_id = ?'); $stmt->execute([(int)$user['id'], $id]);
    jsonResponse(['ok' => true]);
}
jsonResponse(['error' => 'Méthode non autorisée.'], 405);
