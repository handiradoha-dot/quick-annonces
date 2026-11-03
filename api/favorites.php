<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
apiMethod('GET', 'POST', 'DELETE');
$user = apiRequireUser();
$pdo = apiDb();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    $stmt = $pdo->prepare('SELECT listing_id FROM qa_favorites WHERE user_id = ?');
    $stmt->execute([(int)$user['id']]);
    apiJson(['ok' => true, 'data' => array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN))]);
}

$input = apiInput();
$listingId = filter_var($input['listing_id'] ?? null, FILTER_VALIDATE_INT);
if (!$listingId || $listingId < 1) apiJson(['ok' => false, 'error' => 'A valid listing id is required.'], 422);
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $exists = $pdo->prepare("SELECT id FROM qa_listings WHERE id = ? AND status = 'approved'");
    $exists->execute([$listingId]);
    if (!$exists->fetchColumn()) apiJson(['ok' => false, 'error' => 'Listing not found or not available.'], 404);
    $stmt = $pdo->prepare('INSERT IGNORE INTO qa_favorites (user_id, listing_id) VALUES (?, ?)');
    $stmt->execute([(int)$user['id'], $listingId]);
    apiJson(['ok' => true]);
}
$stmt = $pdo->prepare('DELETE FROM qa_favorites WHERE user_id = ? AND listing_id = ?');
$stmt->execute([(int)$user['id'], $listingId]);
apiJson(['ok' => true]);
