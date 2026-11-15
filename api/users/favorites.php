<?php
declare(strict_types=1);
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$_GET['route'] = 'favorites' . ($id ? '/' . $id : '');
require dirname(__DIR__) . '/router.php';
