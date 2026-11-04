<?php
require __DIR__ . '/bootstrap.php';

$rows = database()->query('SELECT id, name FROM qa_categories ORDER BY name ASC')->fetchAll();
jsonResponse(['categories' => array_map(static function ($row) {
    return ['id' => (int)$row['id'], 'name' => $row['name']];
}, $rows)]);
