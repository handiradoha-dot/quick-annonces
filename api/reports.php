<?php
declare(strict_types=1);

$report = (string)($_GET['report'] ?? '');
if (!preg_match('/^[a-z-]+$/', $report)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Report not found.']);
    exit;
}

$_GET['route'] = 'reports/' . $report;
require __DIR__ . '/router.php';
