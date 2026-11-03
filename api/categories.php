<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
apiMethod('GET');
$stmt = apiDb()->query('SELECT id, name FROM qa_categories ORDER BY name');
apiJson(['ok' => true, 'data' => $stmt->fetchAll()]);
