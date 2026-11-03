<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
apiMethod('GET');
$user = apiRequireUser();
$stmt = apiDb()->prepare(apiListingSelect() . ' WHERE l.seller_id = ? ORDER BY l.created_at DESC');
$stmt->execute([(int)$user['id']]);
apiJson(['ok' => true, 'data' => array_map('apiListingRow', $stmt->fetchAll())]);
