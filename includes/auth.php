<?php
declare(strict_types=1);

function user(): ?array { return $_SESSION['user'] ?? null; }

function requireUser(): array
{
    $current = user();
    if (!$current) respond(['error' => 'Authentication required.'], 401);
    return $current;
}

function requireAdmin(array $current): void
{
    if (($current['role'] ?? '') !== 'admin') respond(['error' => 'Administrator access required.'], 403);
}
