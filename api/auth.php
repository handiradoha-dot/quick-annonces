<?php
require __DIR__ . '/bootstrap.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'register' && $method === 'POST') {
    $body = requestBody();
    $firstName = trim((string)(isset($body['firstName']) ? $body['firstName'] : ''));
    $lastName = trim((string)(isset($body['lastName']) ? $body['lastName'] : ''));
    $email = strtolower(trim((string)(isset($body['email']) ? $body['email'] : '')));
    $password = (string)(isset($body['password']) ? $body['password'] : '');
    if ($firstName === '' || $lastName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
        jsonResponse(['error' => 'Veuillez renseigner un prénom, un nom, un e-mail valide et un mot de passe de 6 caractères minimum.'], 422);
    }
    try {
        ensureSessionTable(database());
        $statement = database()->prepare('INSERT INTO qa_users (full_name, email, password_hash, role) VALUES (?, ?, ?, "user")');
        $statement->execute(["$firstName $lastName", $email, password_hash($password, PASSWORD_DEFAULT)]);
    } catch (PDOException $exception) {
        if ($exception->getCode() === '23000') {
            jsonResponse(['error' => 'Cette adresse e-mail est déjà utilisée.'], 409);
        }
        throw $exception;
    }
    try {
        setAuthenticatedUser((int)database()->lastInsertId());
        jsonResponse(['user' => authenticatedUser()], 201);
    } catch (Throwable $exception) {
        error_log($exception->getMessage());
        jsonResponse(['error' => 'Le compte a été créé, mais la session n’a pas pu démarrer. Vérifiez les droits de création de table pour DB_USER sur la base Aiven.'], 503);
    }
}

if ($action === 'login' && $method === 'POST') {
    $body = requestBody();
    $email = strtolower(trim((string)(isset($body['email']) ? $body['email'] : '')));
    $password = (string)(isset($body['password']) ? $body['password'] : '');
    $statement = database()->prepare('SELECT id, full_name, email, password_hash, role FROM qa_users WHERE email = ?');
    $statement->execute([$email]);
    $user = $statement->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['error' => 'E-mail ou mot de passe incorrect.'], 401);
    }
    setAuthenticatedUser((int)$user['id']);
    unset($user['password_hash']);
    jsonResponse(['user' => $user]);
}

if ($action === 'session' && $method === 'GET') {
    jsonResponse(['user' => authenticatedUser()]);
}

if ($action === 'logout' && $method === 'POST') {
    revokeAuthSession();
    jsonResponse(['ok' => true]);
}

jsonResponse(['error' => 'Action non reconnue.'], 404);
