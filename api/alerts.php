<?php
require __DIR__ . '/bootstrap.php';
$user = authenticatedUser(); $pdo = database(); $method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT a.id, a.search_text AS query, a.category_id, c.name AS category, a.city, a.min_price, a.max_price, a.active, a.created_at FROM qa_alerts a LEFT JOIN qa_categories c ON c.id = a.category_id WHERE a.user_id = ? ORDER BY a.created_at DESC');
    $stmt->execute([(int)$user['id']]); jsonResponse(['alerts' => $stmt->fetchAll()]);
}
$body = requestBody();
if ($method === 'POST') {
    $query = trim((string)($body['query'] ?? $body['search_text'] ?? ''));
    if ($query === '' || mb_strlen($query) > 150) jsonResponse(['error' => 'Saisissez une recherche (150 caractères maximum).'], 422);
    $categoryId = null; $category = trim((string)($body['category'] ?? ''));
    if ($category !== '' && $category !== 'Toutes les catégories') {
        $stmt = $pdo->prepare('SELECT id FROM qa_categories WHERE name = ?'); $stmt->execute([$category]); $categoryId = $stmt->fetchColumn();
        if (!$categoryId) jsonResponse(['error' => 'Catégorie inconnue.'], 422);
    }
    $city = trim((string)($body['city'] ?? '')) ?: null;
    $max = $body['max_price'] ?? $body['budget'] ?? null;
    $max = ($max !== null && $max !== '') ? max(0, (float)$max) : null;
    $stmt = $pdo->prepare('INSERT INTO qa_alerts (user_id, search_text, category_id, city, min_price, max_price, active) VALUES (?, ?, ?, ?, ?, ?, 1)');
    $stmt->execute([(int)$user['id'], $query, $categoryId, $city, isset($body['min_price']) && $body['min_price'] !== '' ? (float)$body['min_price'] : null, $max]);
    jsonResponse(['id' => (int)$pdo->lastInsertId()], 201);
}
if ($method === 'DELETE') {
    $id = (int)($body['id'] ?? 0); if (!$id) jsonResponse(['error' => 'Alerte requise.'], 422);
    $stmt = $pdo->prepare('DELETE FROM qa_alerts WHERE id = ? AND user_id = ?'); $stmt->execute([$id, (int)$user['id']]); jsonResponse(['ok' => true]);
}
jsonResponse(['error' => 'Méthode non autorisée.'], 405);
