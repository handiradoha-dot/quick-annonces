<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
apiMethod('GET', 'POST');
$user = apiRequireUser();
$pdo = apiDb();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    $stmt = $pdo->prepare("SELECT c.id, c.listing_id, c.buyer_id, c.seller_id, l.title AS listing_title, other.full_name AS other_name, (SELECT m.body FROM qa_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message FROM qa_conversations c JOIN qa_listings l ON l.id = c.listing_id JOIN qa_users other ON other.id = IF(c.buyer_id = ?, c.seller_id, c.buyer_id) WHERE c.buyer_id = ? OR c.seller_id = ? ORDER BY c.created_at DESC");
    $stmt->execute([(int)$user['id'], (int)$user['id'], (int)$user['id']]);
    apiJson(['ok' => true, 'data' => $stmt->fetchAll()]);
}

$input = apiInput();
$listingId = filter_var($input['listing_id'] ?? null, FILTER_VALIDATE_INT);
if (!$listingId || $listingId < 1) apiJson(['ok' => false, 'error' => 'A valid listing id is required.'], 422);
$find = $pdo->prepare("SELECT seller_id FROM qa_listings WHERE id = ? AND status = 'approved'");
$find->execute([$listingId]);
$sellerId = $find->fetchColumn();
if (!$sellerId) apiJson(['ok' => false, 'error' => 'Listing not found or not available.'], 404);
if ((int)$sellerId === (int)$user['id']) apiJson(['ok' => false, 'error' => 'You cannot message yourself about your own listing.'], 422);
$create = $pdo->prepare('INSERT IGNORE INTO qa_conversations (listing_id, buyer_id, seller_id) VALUES (?, ?, ?)');
$create->execute([$listingId, (int)$user['id'], (int)$sellerId]);
$findId = $pdo->prepare('SELECT id FROM qa_conversations WHERE listing_id = ? AND buyer_id = ? AND seller_id = ?');
$findId->execute([$listingId, (int)$user['id'], (int)$sellerId]);
apiJson(['ok' => true, 'id' => (int)$findId->fetchColumn()], 201);
