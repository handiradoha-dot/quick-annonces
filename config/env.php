<?php
declare(strict_types=1);

function envValue(string $key, ?string $default = null): ?string
{
    $value = $_SERVER[$key] ?? $_ENV[$key] ?? getenv($key);
    return $value === false || $value === null || $value === '' ? $default : (string)$value;
}
