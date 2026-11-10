<?php
require __DIR__ . '/bootstrap.php';

try {
    $pdo = database();
    $categoryNames = $pdo->query('SELECT name FROM qa_categories ORDER BY name ASC')->fetchAll(PDO::FETCH_COLUMN);
    $categoryCount = count($categoryNames);
    $listingCount = (int)$pdo->query('SELECT COUNT(*) FROM produit')->fetchColumn();
    $sessionTable = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'qa_sessions'")->fetchColumn();
    $usersTable = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'qa_users'")->fetchColumn();
    jsonResponse(['ok' => true, 'database' => 'connected', 'users_table' => (bool)$usersTable, 'session_table' => (bool)$sessionTable, 'categories' => $categoryCount, 'category_names' => $categoryNames, 'listings' => $listingCount]);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    jsonResponse(['ok' => false, 'error' => 'Connexion ou schéma de base de données indisponible.'], 503);
}
