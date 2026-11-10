<?php
require __DIR__ . '/bootstrap.php';
$user = authenticatedUser(); $pdo = database(); ensureListingMeta($pdo); $method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $conversationId = (int)($_GET['conversation'] ?? 0);
    if (!$conversationId) {
        $stmt = $pdo->prepare("SELECT c.id, c.listing_id, c.buyer_id, c.seller_id, p.libelle AS listing_title,
            IF(c.buyer_id = ?, seller.full_name, buyer.full_name) AS other_name,
            (SELECT body FROM qa_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_message,
            c.created_at FROM qa_conversations c JOIN qa_listing_meta m ON m.id = c.listing_id
            JOIN produit p ON p.reference = m.product_reference JOIN qa_users buyer ON buyer.id = c.buyer_id
            JOIN qa_users seller ON seller.id = c.seller_id WHERE c.buyer_id = ? OR c.seller_id = ? ORDER BY c.id DESC");
        $stmt->execute([(int)$user['id'], (int)$user['id'], (int)$user['id']]);
        jsonResponse(['conversations' => $stmt->fetchAll()]);
    }
    $check = $pdo->prepare('SELECT id FROM qa_conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)');
    $check->execute([$conversationId, (int)$user['id'], (int)$user['id']]);
    if (!$check->fetchColumn()) jsonResponse(['error' => 'Conversation introuvable.'], 404);
    $pdo->prepare('UPDATE qa_messages SET read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL')->execute([$conversationId, (int)$user['id']]);
    $stmt = $pdo->prepare('SELECT id, sender_id, body, created_at, read_at FROM qa_messages WHERE conversation_id = ? ORDER BY id ASC');
    $stmt->execute([$conversationId]); jsonResponse(['messages' => $stmt->fetchAll()]);
}
$body = requestBody();
if ($method === 'POST') {
    $action = (string)($body['action'] ?? 'message');
    if ($action === 'start') {
        $listingId = (int)($body['listing_id'] ?? 0); if (!$listingId) jsonResponse(['error' => 'Annonce requise.'], 422);
        $stmt = $pdo->prepare('SELECT m.user_id FROM qa_listing_meta m WHERE m.id = ?'); $stmt->execute([$listingId]); $sellerId = (int)$stmt->fetchColumn();
        if (!$sellerId) jsonResponse(['error' => 'Annonce introuvable.'], 404);
        if ($sellerId === (int)$user['id']) jsonResponse(['error' => 'Vous ne pouvez pas vous contacter vous-même.'], 422);
        $stmt = $pdo->prepare('SELECT id FROM qa_conversations WHERE listing_id = ? AND buyer_id = ? AND seller_id = ? LIMIT 1');
        $stmt->execute([$listingId, (int)$user['id'], $sellerId]); $id = (int)$stmt->fetchColumn();
        if (!$id) { $stmt = $pdo->prepare('INSERT INTO qa_conversations (listing_id, buyer_id, seller_id) VALUES (?, ?, ?)'); $stmt->execute([$listingId, (int)$user['id'], $sellerId]); $id = (int)$pdo->lastInsertId(); }
        jsonResponse(['id' => $id], 201);
    }
    $conversationId = (int)($body['conversation_id'] ?? 0); $text = trim((string)($body['body'] ?? $body['message'] ?? ''));
    if (!$conversationId || $text === '' || mb_strlen($text) > 5000) jsonResponse(['error' => 'Message invalide.'], 422);
    $check = $pdo->prepare('SELECT id FROM qa_conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)'); $check->execute([$conversationId, (int)$user['id'], (int)$user['id']]);
    if (!$check->fetchColumn()) jsonResponse(['error' => 'Conversation introuvable.'], 404);
    $stmt = $pdo->prepare('INSERT INTO qa_messages (conversation_id, sender_id, body) VALUES (?, ?, ?)'); $stmt->execute([$conversationId, (int)$user['id'], $text]);
    jsonResponse(['id' => (int)$pdo->lastInsertId()], 201);
}
jsonResponse(['error' => 'Méthode non autorisée.'], 405);
