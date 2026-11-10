<?php
require __DIR__ . '/bootstrap.php';

function listingRows($pdo, $admin = false, $mine = false)
{
    ensureListingMeta($pdo);
    $where = []; $params = [];
    if ($mine) { $user = authenticatedUser(); $where[] = 'm.user_id = ?'; $params[] = (int)$user['id']; }
    elseif (!$admin) $where[] = "m.status IN ('Approuvee','Approuvée','approved','active')";
    $sql = "SELECT m.id, p.reference AS product_reference, p.libelle AS title, p.prixUnitaire AS price,
        p.photoProduit AS image, c.name AS category, m.city, m.description, m.condition_label AS `condition`,
        m.listing_type AS type, m.status, m.created_at, u.full_name AS seller
        FROM produit p JOIN qa_listing_meta m ON m.product_reference = p.reference
        LEFT JOIN qa_categories c ON c.id = p.idCategorie LEFT JOIN qa_users u ON u.id = m.user_id" .
        ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY m.created_at DESC, m.id DESC';
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    return array_map(static function ($row) {
        $row['id'] = (int)$row['id']; $row['price'] = (float)$row['price'];
        $row['category'] = $row['category'] ?: 'Autre'; $row['city'] = $row['city'] ?: '';
        $row['seller'] = $row['seller'] ?: 'Vendeur'; $row['age'] = $row['created_at'] ?: '';
        $row['emoji'] = '📦'; $row['verified'] = false;
        $raw = strtolower((string)$row['status']);
        $row['status'] = in_array($raw, ['refusee','refusée','rejected'], true) ? 'Refusee' : (in_array($raw, ['en attente','pending','review'], true) ? 'En attente' : 'Approuvee');
        $row['type'] = $row['type'] ?: 'À vendre'; $row['condition'] = $row['condition'] ?: '';
        $row['description'] = $row['description'] ?: '';
        return $row;
    }, $stmt->fetchAll());
}

function publicProductRows($pdo)
{
    $hasMeta = (int)$pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'qa_listing_meta'")->fetchColumn() > 0;
    if ($hasMeta) {
        $sql = "SELECT m.id AS id, p.reference AS product_reference, p.libelle AS title,
            p.prixUnitaire AS price, p.photoProduit AS image, c.name AS category,
            m.city, m.description, m.condition_label AS `condition`, m.listing_type AS type,
            COALESCE(m.status, 'Approuvee') AS status, COALESCE(m.created_at, p.dateAchat) AS created_at
            FROM produit p LEFT JOIN qa_categories c ON c.id = p.idCategorie
            LEFT JOIN qa_listing_meta m ON m.product_reference = p.reference
            WHERE m.id IS NULL OR m.status IN ('Approuvee','Approuvée','approved','active')
            ORDER BY COALESCE(m.created_at, p.dateAchat) DESC, p.reference DESC";
    } else {
        $sql = "SELECT NULL AS id, p.reference AS product_reference, p.libelle AS title,
            p.prixUnitaire AS price, p.photoProduit AS image, c.name AS category,
            NULL AS city, NULL AS description, NULL AS `condition`, NULL AS type,
            'Approuvee' AS status, p.dateAchat AS created_at
            FROM produit p LEFT JOIN qa_categories c ON c.id = p.idCategorie
            ORDER BY p.dateAchat DESC, p.reference DESC";
    }
    try {
        $rows = $pdo->query($sql)->fetchAll();
    } catch (PDOException $exception) {
        error_log('Public listing metadata unavailable: ' . $exception->getMessage());
        $fallback = "SELECT NULL AS id, p.reference AS product_reference, p.libelle AS title,
            p.prixUnitaire AS price, p.photoProduit AS image, c.name AS category,
            NULL AS city, NULL AS description, NULL AS `condition`, NULL AS type,
            'Approuvee' AS status, p.dateAchat AS created_at
            FROM produit p LEFT JOIN qa_categories c ON c.id = p.idCategorie
            ORDER BY p.dateAchat DESC, p.reference DESC";
        $rows = $pdo->query($fallback)->fetchAll();
    }
    return array_map(static function ($row) {
        $hasMetaId = $row['id'] !== null;
        if (!$hasMetaId) $row['id'] = (string)$row['product_reference'];
        if (is_numeric($row['id'])) $row['id'] = (int)$row['id'];
        $row['price'] = (float)$row['price'];
        $row['category'] = $row['category'] ?: 'Autre'; $row['city'] = $row['city'] ?: '';
        $row['seller'] = 'Vendeur'; $row['age'] = $row['created_at'] ?: '';
        $row['emoji'] = '📦'; $row['verified'] = false;
        $row['status'] = 'Approuvee'; $row['type'] = $row['type'] ?: 'À vendre';
        $row['condition'] = $row['condition'] ?: ''; $row['description'] = $row['description'] ?: '';
        $row['can_favorite'] = $hasMetaId;
        return $row;
    }, $rows);
}

$pdo = database();
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $admin = ($_GET['admin'] ?? '') === '1'; $mine = ($_GET['mine'] ?? '') === '1';
    if ($admin && authenticatedUser()['role'] !== 'admin') jsonResponse(['error' => 'Accès administrateur requis.'], 403);
    jsonResponse(['listings' => ($admin || $mine) ? listingRows($pdo, $admin, $mine) : publicProductRows($pdo)]);
}
if ($method === 'POST') {
    $user = authenticatedUser(); $body = requestBody();
    $title = trim((string)($body['title'] ?? '')); $price = (float)($body['price'] ?? 0);
    $category = trim((string)($body['category'] ?? ''));
    if ($title === '' || mb_strlen($title) > 150 || $price <= 0 || $category === '') jsonResponse(['error' => 'Titre, catégorie et prix valide requis.'], 422);
    $cat = $pdo->prepare('SELECT id FROM qa_categories WHERE name = ? LIMIT 1'); $cat->execute([$category]);
    $categoryId = $cat->fetchColumn();
    if (!$categoryId) jsonResponse(['error' => 'Catégorie inconnue. Rechargez la page et réessayez.'], 422);
    $image = trim((string)($body['image'] ?? ''));
    if ($image !== '' && !filter_var($image, FILTER_VALIDATE_URL)) jsonResponse(['error' => 'URL de photo invalide.'], 422);
    $reference = 'QA' . strtoupper(bin2hex(random_bytes(10)));
    ensureListingMeta($pdo); $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('INSERT INTO produit (reference, libelle, prixUnitaire, dateAchat, photoProduit, idCategorie) VALUES (?, ?, ?, CURRENT_DATE, ?, ?)');
        $stmt->execute([$reference, $title, $price, $image !== '' ? $image : null, (int)$categoryId]);
        $stmt = $pdo->prepare("INSERT INTO qa_listing_meta (product_reference, user_id, status, listing_type, condition_label, description, city) VALUES (?, ?, 'En attente', ?, ?, ?, ?)");
        $stmt->execute([$reference, (int)$user['id'], substr(trim((string)($body['type'] ?? 'À vendre')), 0, 50), substr(trim((string)($body['condition'] ?? '')), 0, 100), trim((string)($body['description'] ?? '')), substr(trim((string)($body['city'] ?? '')), 0, 100)]);
        $id = (int)$pdo->lastInsertId(); $pdo->commit();
        jsonResponse(['id' => $id, 'reference' => $reference], 201);
    } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
}
if ($method === 'PATCH' || $method === 'DELETE') {
    $user = authenticatedUser(); if ($user['role'] !== 'admin') jsonResponse(['error' => 'Accès administrateur requis.'], 403);
    $body = requestBody(); $id = (int)($body['id'] ?? 0); if (!$id) jsonResponse(['error' => 'Identifiant requis.'], 422);
    ensureListingMeta($pdo);
    if ($method === 'PATCH') {
        $status = (string)($body['status'] ?? '');
        if (!in_array($status, ['Approuvee','Refusee','En attente'], true)) jsonResponse(['error' => 'Statut invalide.'], 422);
        $stmt = $pdo->prepare('UPDATE qa_listing_meta SET status = ? WHERE id = ?'); $stmt->execute([$status, $id]);
    } else {
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT product_reference FROM qa_listing_meta WHERE id = ?'); $stmt->execute([$id]); $reference = $stmt->fetchColumn();
            if ($reference) {
                $pdo->prepare('DELETE f FROM qa_favorites f WHERE f.listing_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM qa_comments WHERE listing_id = ?')->execute([$id]);
                $pdo->prepare('DELETE msg FROM qa_messages msg JOIN qa_conversations c ON c.id = msg.conversation_id WHERE c.listing_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM qa_conversations WHERE listing_id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM qa_listing_meta WHERE id = ?')->execute([$id]);
                $pdo->prepare('DELETE FROM produit WHERE reference = ?')->execute([$reference]);
            }
            $pdo->commit();
        } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
    }
    jsonResponse(['ok' => true]);
}
jsonResponse(['error' => 'Méthode non autorisée.'], 405);
