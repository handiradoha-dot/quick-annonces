<?php
require __DIR__ . '/bootstrap.php';

try {
    $pdo = database();
    $categoryCount = (int)$pdo->query('SELECT COUNT(*) FROM qa_categories')->fetchColumn();
    $listingCount = (int)$pdo->query('SELECT COUNT(*) FROM qa_listings')->fetchColumn();
    jsonResponse(['ok' => true, 'database' => 'connected', 'categories' => $categoryCount, 'listings' => $listingCount]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    jsonResponse(['ok' => false, 'error' => 'Connexion ou schéma de base de données indisponible.'], 503);
}
