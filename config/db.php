<?php
declare(strict_types=1);

use Cloudinary\Cloudinary;

require_once __DIR__ . '/env.php';
require_once dirname(__DIR__) . '/vendor/autoload.php';

function db(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;

    $host = envValue('DB_HOST');
    $name = envValue('DB_NAME');
    $user = envValue('DB_USER');
    $password = envValue('DB_PASSWORD');
    $port = envValue('DB_PORT', '3306');
    if (!$host || !$name || !$user || !$password) throw new RuntimeException('Database configuration is incomplete.');

    $ca = __DIR__ . '/../ca.pem';
    if (!is_file($ca)) throw new RuntimeException('Database TLS certificate is unavailable.');

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_SSL_CA => __DIR__ . '/../ca.pem',
    ];
    if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4", $user, $password, $options);
    return $pdo;
}

function cloudinary(): Cloudinary
{
    $cloud = envValue('CLOUDINARY_CLOUD_NAME');
    $key = envValue('CLOUDINARY_API_KEY');
    $secret = envValue('CLOUDINARY_API_SECRET');
    if (!$cloud || !$key || !$secret) throw new RuntimeException('Image storage is not configured.');
    return new Cloudinary(['cloud' => ['cloud_name' => $cloud], 'api' => ['key' => $key, 'secret' => $secret], 'url' => ['secure' => true]]);
}
