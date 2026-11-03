<?php

header('Content-Type: text/plain; charset=utf-8');

try {
    require_once __DIR__ . '/config/db.php';

    $pdo = getDatabase();

    echo "CONNECTION SUCCESSFUL!\n";

    echo "Database: ";
    echo $pdo->query('SELECT DATABASE()')->fetchColumn();

    echo "\nMySQL Version: ";
    echo $pdo->query('SELECT VERSION()')->fetchColumn();

} catch (Throwable $e) {

    echo "CONNECTION FAILED!\n";
    echo "Error type: " . get_class($e) . "\n";
    echo "Error message: " . $e->getMessage();

}