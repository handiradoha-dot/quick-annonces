<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
apiMethod('GET', 'POST');
$user = apiRequireUser();
$pdo = apiDb();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    $conversationId = filter_var($_GET['conversation_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$conversationId || $conversationId < 1) apiJson(['ok' => false, 'error' => 'A conversation id is required.'], 422);
    $allowed = $pdo->prepare('SELECT id FROM qa_conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)');
    $allowed->execute([$conversationId, (int)$user['id'], (int)$user['id']]);
    if (!$allowed->fetchColumn()) apiJson(['ok' => false, 'error' => 'Conversation not found.'], 404);
    $stmt = $pdo->prepare('SELECT m.id, m.sender_id, m.body, m.created_at, u.full_name AS sender_name FROM qa_messages m JOIN qa_users u ON u.id = m.sender_id WHERE m.conversation_id = ? ORDER BY m.created_at, m.id');
    $stmt->execute([$conversationId]);
    apiJson(['ok' => true, 'data' => $stmt->fetchAll()]);
}

$input = apiInput();
$conversationId = filter_var($input['conversation_id'] ?? null, FILTER_VALIDATE_INT);
$body = trim((string)($input['body'] ?? ''));
if (!$conversationId || $conversationId < 1 || $body === '' || mb_strlen($body) > 5000) apiJson(['ok' => false, 'error' => 'Enter a message (up to 5000 characters).'], 422);
$allowed = $pdo->prepare('SELECT id FROM qa_conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)');
$allowed->execute([$conversationId, (int)$user['id'], (int)$user['id']]);
if (!$allowed->fetchColumn()) apiJson(['ok' => false, 'error' => 'Conversation not found.'], 404);
$stmt = $pdo->prepare('INSERT INTO qa_messages (conversation_id, sender_id, body) VALUES (?, ?, ?)');
$stmt->execute([$conversationId, (int)$user['id'], $body]);
apiJson(['ok' => true, 'id' => (int)$pdo->lastInsertId()], 201);
