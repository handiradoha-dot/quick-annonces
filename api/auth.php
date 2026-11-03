<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
apiStart();
apiMethod('GET', 'POST', 'DELETE');
$action = $_GET['action'] ?? '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && $action === 'me') {
    apiJson(['ok' => true, 'user' => apiUser()]);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'DELETE' || $action === 'logout') {
    apiClearUser();
    apiJson(['ok' => true]);
}
apiMethod('POST');
$input = apiInput();
$action = (string)($input['action'] ?? $action);
$email = strtolower(trim((string)($input['email'] ?? '')));
$password = (string)($input['password'] ?? '');
$pdo = apiDb();

if ($action === 'register') {
    $name = trim((string)($input['name'] ?? ''));
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[A-Za-z0-9]{4}$/', $password)) {
        apiJson(['ok' => false, 'error' => 'Enter your name, a valid email, and a password of exactly 4 letters or numbers.'], 422);
    }
    try {
        $stmt = $pdo->prepare("INSERT INTO qa_users (full_name, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
        $id = (int)$pdo->lastInsertId();
        $user = ['id' => $id, 'name' => $name, 'email' => $email, 'role' => 'user'];
        apiSetUser($user);
        apiJson(['ok' => true, 'user' => $user], 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') apiJson(['ok' => false, 'error' => 'An account with this email already exists.'], 409);
        throw $e;
    }
}

if ($action === 'login') {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[A-Za-z0-9]{4}$/', $password)) {
        apiJson(['ok' => false, 'error' => 'Enter a valid email and a password of exactly 4 letters or numbers.'], 422);
    }
    $stmt = $pdo->prepare('SELECT id, full_name, email, password_hash, role FROM qa_users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($password, $row['password_hash'])) {
        apiJson(['ok' => false, 'error' => 'Email or password is incorrect.'], 401);
    }
    if (($_GET['role'] ?? $input['role'] ?? '') === 'admin' && $row['role'] !== 'admin') {
        apiJson(['ok' => false, 'error' => 'This account is not an administrator.'], 403);
    }
    $user = ['id' => (int)$row['id'], 'name' => $row['full_name'], 'email' => $row['email'], 'role' => $row['role']];
    apiSetUser($user);
    apiJson(['ok' => true, 'user' => $user]);
}

apiJson(['ok' => false, 'error' => 'Unknown authentication action.'], 400);
