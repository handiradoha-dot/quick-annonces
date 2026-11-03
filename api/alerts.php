<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
apiMethod('GET', 'POST', 'DELETE');
$user = apiRequireUser();
$pdo = apiDb();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    $stmt = $pdo->prepare('SELECT a.*, c.name AS category_name FROM qa_alerts a LEFT JOIN qa_categories c ON c.id = a.category_id WHERE a.user_id = ? ORDER BY a.created_at DESC');
    $stmt->execute([(int)$user['id']]);
    apiJson(['ok' => true, 'data' => $stmt->fetchAll()]);
}
$input = apiInput();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'DELETE') {
    $id = filter_var($input['id'] ?? $_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) apiJson(['ok' => false, 'error' => 'A valid alert id is required.'], 422);
    $stmt = $pdo->prepare('DELETE FROM qa_alerts WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, (int)$user['id']]);
    apiJson(['ok' => true]);
}
$query = trim((string)($input['query'] ?? ''));
$city = trim((string)($input['city'] ?? ''));
$maxPrice = ($input['budget'] ?? '') !== '' ? filter_var($input['budget'], FILTER_VALIDATE_FLOAT) : null;
if ($query === '' || mb_strlen($query) > 150 || ($maxPrice !== null && ($maxPrice === false || $maxPrice < 0))) apiJson(['ok' => false, 'error' => 'Enter a search term and a valid maximum price.'], 422);
$stmt = $pdo->prepare('INSERT INTO qa_alerts (user_id, search_text, city, max_price) VALUES (?, ?, ?, ?)');
$stmt->execute([(int)$user['id'], $query, $city ?: null, $maxPrice]);
apiJson(['ok' => true, 'id' => (int)$pdo->lastInsertId()], 201);
