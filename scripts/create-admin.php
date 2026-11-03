<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once dirname(__DIR__) . '/config/db.php';

$email = strtolower(trim((string)(getenv('ADMIN_EMAIL') ?: 'handiradoha@gmail.com')));
$password = (string)getenv('ADMIN_PASSWORD');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    fwrite(STDERR, "Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.\n");
    exit(1);
}

$name = trim((string)(getenv('ADMIN_NAME') ?: 'QuickAnnonces Admin'));
$pdo = getDatabase();
$stmt = $pdo->prepare("INSERT INTO qa_users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'admin') ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = 'admin'");
$stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
fwrite(STDOUT, "Admin account ready for {$email}.\n");
