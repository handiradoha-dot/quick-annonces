<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
$pdo = apiDb();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $user = apiUser();
    $adminAll = isset($_GET['all']) && $_GET['all'] === '1' && ($user['role'] ?? '') === 'admin';
    $sql = apiListingSelect();
    $params = [];
    if (!$adminAll) {
        $sql .= " WHERE l.status = 'approved'";
    }
    if (isset($_GET['id']) && ctype_digit((string)$_GET['id'])) {
        $sql .= ($adminAll ? ' WHERE' : ' AND') . ' l.id = ?';
        $params[] = (int)$_GET['id'];
    }
    $sql .= ' ORDER BY l.created_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    apiJson(['ok' => true, 'data' => array_map('apiListingRow', $stmt->fetchAll())]);
}

apiMethod('POST');
$user = apiRequireUser();
$input = apiInput();
$title = trim((string)($input['title'] ?? ''));
$description = trim((string)($input['description'] ?? ''));
$city = trim((string)($input['city'] ?? ''));
$condition = trim((string)($input['condition'] ?? ''));
$price = filter_var($input['price'] ?? null, FILTER_VALIDATE_FLOAT);
$category = trim((string)($input['category'] ?? ''));
$type = ($input['type'] ?? '') === 'Je recherche' || ($input['type'] ?? '') === 'wanted' ? 'wanted' : 'sell';
$imageUrl = trim((string)($input['image_url'] ?? ''));
if (mb_strlen($title) < 3 || mb_strlen($title) > 150 || $description === '' || $city === '' || !$price || $price <= 0 || $category === '') {
    apiJson(['ok' => false, 'error' => 'Complete all required fields with valid values.'], 422);
}
if ($imageUrl !== '' && !filter_var($imageUrl, FILTER_VALIDATE_URL)) {
    apiJson(['ok' => false, 'error' => 'The image URL is invalid.'], 422);
}
$findCategory = $pdo->prepare('SELECT id FROM qa_categories WHERE name = ?');
$findCategory->execute([$category]);
$categoryId = $findCategory->fetchColumn();
if (!$categoryId) apiJson(['ok' => false, 'error' => 'Unknown category.'], 422);
$insert = $pdo->prepare('INSERT INTO qa_listings (seller_id, category_id, title, description, price, city, listing_type, item_condition, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$insert->execute([(int)$user['id'], (int)$categoryId, $title, $description, $price, $city, $type, $condition ?: null, $imageUrl ?: null]);
apiJson(['ok' => true, 'id' => (int)$pdo->lastInsertId(), 'message' => 'Listing submitted for approval.'], 201);
