<?php

session_set_cookie_params([
    'httponly' => true,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Lax',
]);
session_start();
header('Content-Type: application/json; charset=utf-8');

function jsonResponse(array $payload, $status = 200)
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function requestBody()
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        jsonResponse(['error' => 'Corps de requête invalide.'], 400);
    }
    return $data;
}

function database()
{
    static $pdo;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $config = require __DIR__ . '/config.php';
    try {
        $pdo = new PDO($config['dsn'], $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $exception) {
        error_log($exception->getMessage());
        jsonResponse(['error' => 'Connexion à la base de données impossible.'], 503);
    }
    return $pdo;
}

function authenticatedUser()
{
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['error' => 'Authentification requise.'], 401);
    }
    $statement = database()->prepare('SELECT id, full_name, email, role FROM qa_users WHERE id = ?');
    $statement->execute([$_SESSION['user_id']]);
    $user = $statement->fetch();
    if (!$user) {
        session_destroy();
        jsonResponse(['error' => 'Session invalide.'], 401);
    }
    return $user;
}
