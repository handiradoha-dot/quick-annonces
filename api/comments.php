<?php
require __DIR__ . '/bootstrap.php';
$pdo = database(); ensureListingMeta($pdo);
$pdo->exec("CREATE TABLE IF NOT EXISTS qa_comments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    listing_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_qa_comments_listing (listing_id), KEY idx_qa_comments_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $listingId = (int)($_GET['listing_id'] ?? 0); if (!$listingId) jsonResponse(['error' => 'Annonce requise.'], 422);
    $stmt = $pdo->prepare('SELECT c.id, c.body AS text, u.full_name AS user, c.created_at FROM qa_comments c JOIN qa_users u ON u.id = c.user_id WHERE c.listing_id = ? ORDER BY c.id DESC');
    $stmt->execute([$listingId]); jsonResponse(['comments' => $stmt->fetchAll()]);
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = authenticatedUser(); $body = requestBody(); $listingId = (int)($body['listing_id'] ?? 0); $text = trim((string)($body['body'] ?? ''));
    if (!$listingId || $text === '' || mb_strlen($text) > 3000) jsonResponse(['error' => 'Commentaire invalide.'], 422);
    $stmt = $pdo->prepare('SELECT id FROM qa_listing_meta WHERE id = ? AND status IN (\'Approuvee\', \'Approuvée\', \'approved\', \'active\')'); $stmt->execute([$listingId]);
    if (!$stmt->fetchColumn()) jsonResponse(['error' => 'Annonce introuvable.'], 404);
    $stmt = $pdo->prepare('INSERT INTO qa_comments (listing_id, user_id, body) VALUES (?, ?, ?)'); $stmt->execute([$listingId, (int)$user['id'], $text]);
    jsonResponse(['id' => (int)$pdo->lastInsertId()], 201);
}
jsonResponse(['error' => 'Méthode non autorisée.'], 405);
