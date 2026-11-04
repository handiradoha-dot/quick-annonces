<?php
require __DIR__ . '/bootstrap.php';

function tableColumns($table)
{
    if (!in_array($table, ['qa_listings', 'qa_categories', 'qa_users'], true)) jsonResponse(['error' => 'Table invalide.'], 400);
    $rows = database()->query("SHOW COLUMNS FROM `$table`")->fetchAll();
    return array_column($rows, 'Field');
}
function pickColumn($available, $choices)
{
    foreach ($choices as $choice) if (in_array($choice, $available, true)) return $choice;
    return null;
}
function listingRows($admin = false, $mine = false)
{
    $columns = tableColumns('qa_listings');
    $id = pickColumn($columns, ['id']);
    $title = pickColumn($columns, ['title', 'name', 'libelle']);
    $price = pickColumn($columns, ['price', 'prix', 'prixUnitaire']);
    if (!$id || !$title || !$price) jsonResponse(['error' => 'Schéma qa_listings incomplet : colonnes id, title et price requises.'], 503);
    $description = pickColumn($columns, ['description', 'details']);
    $city = pickColumn($columns, ['city', 'ville']);
    $image = pickColumn($columns, ['image_url', 'image', 'photo', 'photoProduit']);
    $status = pickColumn($columns, ['status', 'moderation_status', 'statut']);
    $categoryId = pickColumn($columns, ['category_id', 'idCategorie']);
    $categoryName = pickColumn($columns, ['category', 'category_name', 'categorie']);
    $userId = pickColumn($columns, ['user_id', 'seller_id', 'owner_id']);
    $type = pickColumn($columns, ['type', 'listing_type']);
    $condition = pickColumn($columns, ['condition_label', 'item_condition', 'condition']);
    $created = pickColumn($columns, ['created_at', 'dateAchat']);
    $select = ["l.`$id` AS id", "l.`$title` AS title", "l.`$price` AS price"];
    foreach (['description' => $description, 'city' => $city, 'image' => $image, 'status' => $status, 'category_id' => $categoryId, 'type' => $type, 'condition' => $condition, 'created_at' => $created] as $alias => $column) $select[] = $column ? "l.`$column` AS `$alias`" : "NULL AS `$alias`";
    $joins = '';
    if ($categoryId && in_array('id', tableColumns('qa_categories'), true)) {
        $catCols = tableColumns('qa_categories'); $catName = pickColumn($catCols, ['name', 'title', 'libelle']);
        if ($catName) { $joins .= " LEFT JOIN qa_categories c ON c.id = l.`$categoryId`"; $select[] = "c.`$catName` AS category"; }
    }
    if (!isset($catName)) $select[] = $categoryName ? "l.`$categoryName` AS category" : "NULL AS category";
    if ($userId && in_array('id', tableColumns('qa_users'), true)) {
        $select[] = 'u.full_name AS seller'; $joins .= " LEFT JOIN qa_users u ON u.id = l.`$userId`";
    } else $select[] = "NULL AS seller";
    $where = []; $params = [];
    if ($mine) { $user = authenticatedUser(); if (!$userId) jsonResponse(['error' => 'qa_listings doit posséder user_id pour gérer les annonces par compte.'], 503); $where[] = "l.`$userId` = ?"; $params[] = $user['id']; }
    if (!$admin && !$mine && $status) { $where[] = "l.`$status` IN ('Approuvee','Approuvée','approved','active')"; }
    $sql = 'SELECT ' . implode(', ', $select) . " FROM qa_listings l$joins" . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . " ORDER BY l.`$id` DESC";
    $stmt = database()->prepare($sql); $stmt->execute($params);
    return array_map(function ($row) {
        $row['id'] = (int)$row['id']; $row['price'] = (float)$row['price'];
        $row['category'] = $row['category'] ?: 'Autre'; $row['city'] = $row['city'] ?: '';
        $row['seller'] = $row['seller'] ?: 'Vendeur'; $row['age'] = $row['created_at'] ?: '';
        $row['emoji'] = '📦'; $row['verified'] = false;
        $rawStatus = strtolower((string)$row['status']);
        $row['status'] = in_array($rawStatus, ['refusee','refusée','rejected'], true) ? 'Refusee' : (in_array($rawStatus, ['en attente','pending','review'], true) ? 'En attente' : 'Approuvee');
        $row['type'] = $row['type'] ?: 'À vendre';
        return $row;
    }, $stmt->fetchAll());
}

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $admin = isset($_GET['admin']) && $_GET['admin'] === '1';
    $mine = isset($_GET['mine']) && $_GET['mine'] === '1';
    if ($admin && authenticatedUser()['role'] !== 'admin') jsonResponse(['error' => 'Accès administrateur requis.'], 403);
    jsonResponse(['listings' => listingRows($admin, $mine)]);
}
if ($method === 'POST') {
    $user = authenticatedUser(); $body = requestBody(); $columns = tableColumns('qa_listings');
    $userId = pickColumn($columns, ['user_id', 'seller_id', 'owner_id']);
    $title = pickColumn($columns, ['title', 'name', 'libelle']); $price = pickColumn($columns, ['price', 'prix', 'prixUnitaire']);
    if (!$userId || !$title || !$price) jsonResponse(['error' => 'Schéma qa_listings incomplet (user_id, title, price requis).'], 503);
    $status = pickColumn($columns, ['status','moderation_status','statut']);
    if (!$status) jsonResponse(['error' => 'Ajoutez une colonne de statut à qa_listings pour garder les annonces en attente de modération.'], 503);
    $values = [$userId => $user['id'], $title => trim((string)($body['title'] ?? '')), $price => (float)($body['price'] ?? 0)];
    $mapping = ['description' => ['description','details'], 'city' => ['city','ville'], 'image' => ['image_url','image','photo','photoProduit'], 'type' => ['type','listing_type'], 'condition' => ['condition_label','item_condition','condition']];
    foreach ($mapping as $key => $choices) { $column = pickColumn($columns, $choices); if ($column) $values[$column] = $body[$key] ?? null; }
    $catColumn = pickColumn($columns, ['category_id','idCategorie']);
    if ($catColumn && !empty($body['category'])) {
        $catCols = tableColumns('qa_categories'); $catName = pickColumn($catCols, ['name','title','libelle']);
        if ($catName) { $cat = database()->prepare("SELECT id FROM qa_categories WHERE `$catName` = ?"); $cat->execute([$body['category']]); $values[$catColumn] = $cat->fetchColumn() ?: null; }
    } else {
        $catNameColumn = pickColumn($columns, ['category','category_name','categorie']);
        if ($catNameColumn && !empty($body['category'])) $values[$catNameColumn] = (string)$body['category'];
    }
    $values[$status] = 'En attente';
    if ($values[$title] === '' || $values[$price] <= 0) jsonResponse(['error' => 'Titre et prix valide requis.'], 422);
    $names = array_keys($values); $quoted = array_map(fn($n) => "`$n`", $names);
    $sql = 'INSERT INTO qa_listings (' . implode(',', $quoted) . ') VALUES (' . implode(',', array_fill(0, count($names), '?')) . ')';
    $stmt = database()->prepare($sql); $stmt->execute(array_values($values));
    jsonResponse(['id' => (int)database()->lastInsertId()], 201);
}
if ($method === 'PATCH' || $method === 'DELETE') {
    $user = authenticatedUser(); if ($user['role'] !== 'admin') jsonResponse(['error' => 'Accès administrateur requis.'], 403);
    $body = requestBody(); $id = (int)($body['id'] ?? 0); if (!$id) jsonResponse(['error' => 'Identifiant requis.'], 422);
    $columns = tableColumns('qa_listings');
    if ($method === 'DELETE') { $stmt = database()->prepare('DELETE FROM qa_listings WHERE id = ?'); $stmt->execute([$id]); }
    else { $status = pickColumn($columns, ['status','moderation_status','statut']); if (!$status) jsonResponse(['error' => 'Colonne de statut absente dans qa_listings.'], 503); $value = (string)($body['status'] ?? ''); if (!in_array($value, ['Approuvee','Refusee','En attente'], true)) jsonResponse(['error' => 'Statut invalide.'], 422); $stmt = database()->prepare("UPDATE qa_listings SET `$status` = ? WHERE id = ?"); $stmt->execute([$value, $id]); }
    jsonResponse(['ok' => true]);
}
jsonResponse(['error' => 'Méthode non autorisée.'], 405);
