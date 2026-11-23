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

    $ca = dirname(__DIR__) . '/ca.pem';
    if (!is_file($ca)) throw new RuntimeException('Database TLS certificate is unavailable.');

    if (!defined('PDO::MYSQL_ATTR_SSL_CA')) {
        throw new RuntimeException('PDO MySQL SSL support is required for the Aiven connection.');
    }

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_SSL_CA => $ca,
    ];
    if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
    try {
        $pdo = new PDO("mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4", $user, $password, $options);
    } catch (PDOException $e) {
        $sqlState = (string)($e->errorInfo[0] ?? $e->getCode());
        error_log('QuickAnnonces Aiven connection failed; SQLSTATE ' . $sqlState);
        throw new RuntimeException('Database connection failed. Verify the DB settings, network access, and Aiven CA certificate.');
    }
    return $pdo;
}

function cloudinary(): Cloudinary
{
    $cloud = envValue('CLOUDINARY_CLOUD_NAME');
    $key = envValue('CLOUDINARY_API_KEY');
    $secret = envValue('CLOUDINARY_API_SECRET');
    if (!$cloud || !$key || !$secret) throw new RuntimeException('Image storage is not configured.');
    return new Cloudinary([
        'cloud' => [
            'cloud_name' => $cloud,
            'api_key' => $key,
            'api_secret' => $secret,
        ],
        'url' => ['secure' => true],
    ]);
}
