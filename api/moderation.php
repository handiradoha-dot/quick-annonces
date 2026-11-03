<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
apiMethod('PATCH', 'DELETE');
apiRequireUser('admin');
$input = apiInput();
$id = filter_var($input['id'] ?? $_GET['id'] ?? null, FILTER_VALIDATE_INT);
if (!$id || $id < 1) apiJson(['ok' => false, 'error' => 'A valid listing id is required.'], 422);
$pdo = apiDb();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'DELETE') {
    $stmt = $pdo->prepare('DELETE FROM qa_listings WHERE id = ?');
    $stmt->execute([$id]);
    apiJson(['ok' => true]);
}
$status = $input['status'] ?? '';
$statuses = ['En attente' => 'pending', 'Approuvee' => 'approved', 'Refusee' => 'rejected', 'pending' => 'pending', 'approved' => 'approved', 'rejected' => 'rejected'];
if (!isset($statuses[$status])) apiJson(['ok' => false, 'error' => 'Invalid moderation status.'], 422);
$stmt = $pdo->prepare('UPDATE qa_listings SET status = ? WHERE id = ?');
$stmt->execute([$statuses[$status], $id]);
apiJson(['ok' => true]);
