<?php
declare(strict_types=1);

function getDatabase(): PDO
{
    // Load local configuration
    $localPath = __DIR__ . '/local.php';

    if (!is_file($localPath)) {
        throw new RuntimeException('config/local.php was not found.');
    }

    $local = require $localPath;

    if (!is_array($local)) {
        throw new RuntimeException('Invalid local.php configuration.');
    }

    // Read environment variables first, then local.php
    $get = static function (
        string $key,
        ?string $default = null
    ) use ($local): ?string {
        $env = getenv($key);

        if ($env !== false && $env !== '') {
            return $env;
        }

        $value = $local[$key] ?? $default;

        return $value === null ? null : (string) $value;
    };

    $host = $get('DB_HOST');
    $port = $get('DB_PORT');
    $name = $get('DB_NAME');
    $user = $get('DB_USER');
    $password = $get('DB_PASSWORD');

    if (!$password) {
        throw new RuntimeException('DB_PASSWORD is missing from local.php.');
    }

    // Check Aiven SSL certificate
    $caPath = dirname(__DIR__) . '/certs/ca.pem';

    if (!is_readable($caPath)) {
        throw new RuntimeException('Aiven CA certificate is missing.');
    }

    if (!extension_loaded('pdo_mysql')) {
        throw new RuntimeException('pdo_mysql is not enabled.');
    }

    $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    if (!defined('PDO::MYSQL_ATTR_SSL_CA')) {
        throw new RuntimeException('MySQL SSL support is unavailable.');
    }

    $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;

    if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
    }

    return new PDO($dsn, $user, $password, $options);
}