<?php
declare(strict_types=1);
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$_GET['route'] = 'listings/' . ($id ?: 0) . '/comments';
require dirname(__DIR__) . '/router.php';
