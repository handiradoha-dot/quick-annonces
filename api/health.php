<?php
require __DIR__ . '/bootstrap.php';

try {
    $pdo = database();
    $categoryNames = $pdo->query('SELECT name FROM qa_categories ORDER BY name ASC')->fetchAll(PDO::FETCH_COLUMN);
    $categoryCount = count($categoryNames);
    $listingCount = (int)$pdo->query('SELECT COUNT(*) FROM qa_listings')->fetchColumn();
    jsonResponse(['ok' => true, 'database' => 'connected', 'categories' => $categoryCount, 'category_names' => $categoryNames, 'listings' => $listingCount]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    jsonResponse(['ok' => false, 'error' => 'Connexion ou schéma de base de données indisponible.'], 503);
}
