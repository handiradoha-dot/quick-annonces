<?php
declare(strict_types=1);

$localEnvPath = dirname(__DIR__) . '/.env';
if (is_file($localEnvPath)) {
    $lines = file($localEnvPath, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        throw new RuntimeException('Unable to read the local environment file.');
    }

    foreach ($lines as $index => $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        if (!preg_match('/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/', $line, $matches)) {
            throw new RuntimeException('Invalid environment setting on line ' . ($index + 1) . '.');
        }

        $key = $matches[1];
        $value = trim($matches[2]);
        $first = $value[0] ?? '';
        $last = $value === '' ? '' : $value[strlen($value) - 1];
        if ($first === '"' || $first === "'") {
            if ($last !== $first) {
                throw new RuntimeException('Unclosed quoted environment value on line ' . ($index + 1) . '.');
            }
            $value = substr($value, 1, -1);
        }

        if (!isset($_SERVER[$key]) && !isset($_ENV[$key]) && getenv($key) === false) {
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

function envValue(string $key, ?string $default = null): ?string
{
    $value = $_SERVER[$key] ?? $_ENV[$key] ?? getenv($key);
    return $value === false || $value === null || $value === '' ? $default : (string)$value;
}
