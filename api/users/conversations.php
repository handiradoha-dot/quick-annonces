<?php
declare(strict_types=1);
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$messages = filter_input(INPUT_GET, 'messages', FILTER_VALIDATE_BOOLEAN);
$_GET['route'] = 'conversations' . ($id ? '/' . $id . ($messages ? '/messages' : '') : '');
require dirname(__DIR__) . '/router.php';
