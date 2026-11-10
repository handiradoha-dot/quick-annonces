<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(['error' => 'Méthode non autorisée.'], 405);
}
$user = authenticatedUser();
$body = requestBody();
$firstName = trim((string)(isset($body['firstName']) ? $body['firstName'] : ''));
$lastName = trim((string)(isset($body['lastName']) ? $body['lastName'] : ''));
if ($firstName === '' || $lastName === '') {
    jsonResponse(['error' => 'Le prénom et le nom sont obligatoires.'], 422);
}
$statement = database()->prepare('UPDATE qa_users SET full_name = ? WHERE id = ?');
$statement->execute(["$firstName $lastName", $user['id']]);
$user['full_name'] = "$firstName $lastName";
jsonResponse(['user' => $user]);
