<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/includes/security.php';
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/functions.php';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = trim((string)($_GET['route'] ?? parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH)), '/');
$parts = explode('/', preg_replace('#^api/?#', '', $path));
$resource = $parts[0] ?? '';
if ($resource === 'admin') {
    $sub = $parts[1] ?? '';
    $id = isset($parts[2]) && ctype_digit($parts[2]) ? (int)$parts[2] : null;
} elseif (isset($parts[1]) && ctype_digit($parts[1])) {
    $id = (int)$parts[1];
    $sub = $parts[2] ?? '';
} else {
    $id = null;
    $sub = $parts[1] ?? '';
}
if ($method === 'OPTIONS') { header('Allow: GET, POST, PATCH, DELETE, OPTIONS'); exit; }

try {
    $pdo = db();
    if ($resource === 'health' && $method === 'GET') { $pdo->query('SELECT 1'); respond(['ok' => true]); }
    if ($resource === 'categories' && $method === 'GET') respond(['categories' => $pdo->query('SELECT id, name, slug FROM categories ORDER BY id')->fetchAll()]);

    if ($resource === 'auth' && $sub === 'register' && $method === 'POST') {
        $data = input();
        $name = trim((string)($data['name'] ?? ''));
        $email = strtolower(trim((string)($data['email'] ?? '')));
        $password = (string)($data['password'] ?? '');
        if (mb_strlen($name) < 2 || mb_strlen($name) > 120 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 10) respond(['error' => 'Enter a name, valid email, and password of at least 10 characters.'], 422);
        $q = $pdo->prepare('INSERT INTO users (full_name,email,password_hash) VALUES (?,?,?)');
        try { $q->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]); }
        catch (PDOException $e) { if ($e->getCode() === '23000') respond(['error' => 'An account with that email already exists.'], 409); throw $e; }
        $_SESSION['user'] = ['id' => (int)$pdo->lastInsertId(), 'full_name' => $name, 'email' => $email, 'role' => 'user'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        persistAuthCookie();
        respond(['user' => $_SESSION['user'], 'csrf' => $_SESSION['csrf']], 201);
    }
    if ($resource === 'auth' && $sub === 'login' && $method === 'POST') {
        $data = input(); $email = strtolower(trim((string)($data['email'] ?? ''))); $password = (string)($data['password'] ?? '');
        $q = $pdo->prepare('SELECT id,full_name,email,password_hash,role FROM users WHERE email=?'); $q->execute([$email]); $found = $q->fetch();
        if (!$found || !password_verify($password, $found['password_hash'])) respond(['error' => 'Email or password is incorrect.'], 401);
        unset($found['password_hash']); $_SESSION['user'] = $found; $_SESSION['csrf'] = bin2hex(random_bytes(32));
        persistAuthCookie();
        respond(['user' => $found, 'csrf' => $_SESSION['csrf']]);
    }
    if ($resource === 'auth' && $sub === 'logout' && $method === 'POST') { requireUser(); requireCsrf(); $_SESSION = []; clearAuthCookie(); respond(['ok' => true]); }
    if ($resource === 'auth' && $sub === 'me' && $method === 'GET') respond(['user' => user(), 'csrf' => $_SESSION['csrf'] ?? null]);
    if ($resource === 'auth' && $sub === 'forgot' && $method === 'POST') respond(['error' => 'Password reset email is not configured yet.'], 503);

    if ($resource === 'listings' && $method === 'GET' && !$id) {
        $where = ["a.status='approved'"]; $params = [];
        $qText = trim((string)($_GET['q'] ?? '')); $category = trim((string)($_GET['category'] ?? '')); $city = trim((string)($_GET['city'] ?? '')); $type = trim((string)($_GET['type'] ?? ''));
        if ($qText !== '') { $where[] = '(a.title LIKE ? OR a.description LIKE ?)'; $params[] = '%'.$qText.'%'; $params[] = '%'.$qText.'%'; }
        if ($category !== '') { $where[] = 'c.slug=?'; $params[] = $category; }
        if ($city !== '') { $where[] = 'a.city=?'; $params[] = $city; }
        if ($type === 'sale' || $type === 'wanted') { $where[] = 'a.annonce_type=?'; $params[] = $type; }
        $sort = ($_GET['sort'] ?? '') === 'price_asc' ? 'a.price ASC' : (($_GET['sort'] ?? '') === 'price_desc' ? 'a.price DESC' : 'a.created_at DESC');
        $sql = 'SELECT a.id,a.user_id,a.category_id,a.annonce_type,a.title,a.description,a.price,a.currency,a.city,a.item_condition,a.status,a.created_at,c.name AS category,c.slug AS category_slug,u.full_name AS seller FROM annonce a JOIN categories c ON c.id=a.category_id JOIN users u ON u.id=a.user_id WHERE '.implode(' AND ',$where).' ORDER BY '.$sort.' LIMIT 100';
        $stmt=$pdo->prepare($sql); $stmt->execute($params); $items=$stmt->fetchAll();
        foreach ($items as &$item) $item['images']=rowImages($pdo,(int)$item['id']); unset($item);
        respond(['listings'=>$items]);
    }
    if ($resource === 'listings' && $method === 'GET' && $id) {
        $item=listing($pdo,$id); if (!$item || ($item['status']!=='approved' && (int)(user()['id'] ?? 0)!==(int)$item['user_id'] && (user()['role'] ?? '')!=='admin')) respond(['error'=>'Listing not found.'],404);
        respond(['listing'=>$item]);
    }
    if ($resource === 'listings' && $method === 'POST') {
        $current=requireUser(); requireCsrf(); $data=input();
        $title=trim((string)($data['title'] ?? '')); $description=trim((string)($data['description'] ?? '')); $category=trim((string)($data['category'] ?? '')); $city=trim((string)($data['city'] ?? '')); $price=filter_var($data['price'] ?? null,FILTER_VALIDATE_FLOAT); $type=($data['type'] ?? 'sale')==='wanted'?'wanted':'sale';
        if ($title===''||mb_strlen($title)>180||$description===''||$city===''||$price===false||$price<0||$category==='') respond(['error'=>'Complete all required listing fields with a valid price.'],422);
        $q=$pdo->prepare('SELECT id FROM categories WHERE name=? OR slug=?'); $q->execute([$category,$category]); $categoryId=$q->fetchColumn(); if (!$categoryId) respond(['error'=>'Choose a valid category.'],422);
        $pdo->beginTransaction();
        $q=$pdo->prepare('INSERT INTO annonce (user_id,category_id,annonce_type,title,description,price,city,item_condition) VALUES (?,?,?,?,?,?,?,?)');
        $q->execute([$current['id'],$categoryId,$type,$title,$description,$price,$city,trim((string)($data['condition'] ?? '')) ?: null]); $newId=(int)$pdo->lastInsertId();
        $files=$_FILES['images'] ?? $_FILES['photo'] ?? null;
        if ($files) {
            $names=is_array($files['name'] ?? null)?$files['name']:[$files['name']]; $max=min(count($names),5);
            for($i=0;$i<$max;$i++) { $file=is_array($files['name'])?['name'=>$files['name'][$i],'type'=>$files['type'][$i]??'','tmp_name'=>$files['tmp_name'][$i]??'','error'=>$files['error'][$i]??UPLOAD_ERR_NO_FILE,'size'=>$files['size'][$i]??0]:$files; saveImage($pdo,$newId,$file,$i); }
        }
        $pdo->commit(); respond(['listing'=>listing($pdo,$newId)],201);
    }
    if ($resource === 'listings' && $id && in_array($method,['PATCH','DELETE'],true)) {
        $current=requireUser(); requireCsrf(); $item=listing($pdo,$id);
        if (!$item) respond(['error'=>'Listing not found.'],404);
        if ((int)$item['user_id']!==(int)$current['id'] && $current['role']!=='admin') respond(['error'=>'You cannot change this listing.'],403);
        if ($method==='DELETE') { $q=$pdo->prepare('DELETE FROM annonce WHERE id=?'); $q->execute([$id]); respond(['ok'=>true]); }
        if ($current['role']==='admin') respond(['error'=>'Moderate listings through the moderation endpoint.'],400);
        $data=input(); $allowed=['title','description','price','city','item_condition']; $set=[];$values=[];
        foreach($allowed as $field) if(array_key_exists($field,$data)) { $set[]="$field=?"; $values[]=$data[$field]; }
        if(!$set) respond(['error'=>'No editable fields were provided.'],422);
        $values[]=$id; $q=$pdo->prepare('UPDATE annonce SET '.implode(',',$set).", status='pending' WHERE id=?"); $q->execute($values); respond(['listing'=>listing($pdo,$id)]);
    }
    if ($resource === 'me' && $sub === 'listings' && $method === 'GET') {
        $current=requireUser(); $stmt=$pdo->prepare('SELECT id FROM annonce WHERE user_id=? ORDER BY created_at DESC'); $stmt->execute([$current['id']]); $items=[];
        foreach($stmt->fetchAll(PDO::FETCH_COLUMN) as $adId) $items[]=listing($pdo,(int)$adId); respond(['listings'=>$items]);
    }
    if ($resource === 'favorites' && $method === 'GET') {
        $current=requireUser(); $stmt=$pdo->prepare('SELECT annonce_id FROM favorites WHERE user_id=? ORDER BY created_at DESC'); $stmt->execute([$current['id']]); $items=[];
        foreach($stmt->fetchAll(PDO::FETCH_COLUMN) as $adId) { $item=listing($pdo,(int)$adId); if($item) $items[]=$item; } respond(['listings'=>$items]);
    }
    if ($resource === 'favorites' && $id && $method === 'POST') { $current=requireUser(); requireCsrf(); $stmt=$pdo->prepare('INSERT IGNORE INTO favorites (user_id,annonce_id) SELECT ?,id FROM annonce WHERE id=? AND status="approved"'); $stmt->execute([$current['id'],$id]); respond(['ok'=>true],201); }
    if ($resource === 'favorites' && $id && $method === 'DELETE') { $current=requireUser(); requireCsrf(); $stmt=$pdo->prepare('DELETE FROM favorites WHERE user_id=? AND annonce_id=?'); $stmt->execute([$current['id'],$id]); respond(['ok'=>true]); }

    if ($resource === 'listings' && $id && $sub === 'comments' && $method === 'GET') { $stmt=$pdo->prepare('SELECT c.id,c.user_id,c.parent_comment_id,c.comment_text,c.created_at,u.full_name AS user FROM annonce_comments c JOIN users u ON u.id=c.user_id WHERE c.annonce_id=? ORDER BY c.created_at'); $stmt->execute([$id]); respond(['comments'=>$stmt->fetchAll()]); }
    if ($resource === 'listings' && $id && $sub === 'comments' && $method === 'POST') { $current=requireUser(); requireCsrf(); $data=input(); $text=trim((string)($data['comment']??'')); if($text===''||mb_strlen($text)>3000) respond(['error'=>'Comment must contain 1 to 3000 characters.'],422); $parent=$data['parent_comment_id']??null; $stmt=$pdo->prepare('INSERT INTO annonce_comments (annonce_id,user_id,parent_comment_id,comment_text) VALUES (?,?,?,?)'); $stmt->execute([$id,$current['id'],$parent,$text]); respond(['id'=>(int)$pdo->lastInsertId()],201); }

    if ($resource === 'conversations' && $method === 'GET') { $current=requireUser(); $stmt=$pdo->prepare('SELECT c.id,c.annonce_id,c.buyer_id,c.seller_id,c.updated_at,a.title,bu.full_name AS buyer, su.full_name AS seller FROM conversations c JOIN annonce a ON a.id=c.annonce_id JOIN users bu ON bu.id=c.buyer_id JOIN users su ON su.id=c.seller_id WHERE c.buyer_id=? OR c.seller_id=? ORDER BY c.updated_at DESC'); $stmt->execute([$current['id'],$current['id']]); respond(['conversations'=>$stmt->fetchAll()]); }
    if ($resource === 'conversations' && $method === 'POST') { $current=requireUser(); requireCsrf(); $data=input(); $adId=(int)($data['annonce_id']??0); $item=listing($pdo,$adId); if(!$item||$item['status']!=='approved') respond(['error'=>'Listing is not available.'],404); if((int)$item['user_id']===(int)$current['id']) respond(['error'=>'You cannot contact yourself.'],422); $stmt=$pdo->prepare('INSERT INTO conversations (annonce_id,buyer_id,seller_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)'); $stmt->execute([$adId,$current['id'],$item['user_id']]); respond(['conversation_id'=>(int)$pdo->lastInsertId()],201); }
    if ($resource === 'conversations' && $id && $sub === 'messages' && $method === 'GET') { $current=requireUser(); $stmt=$pdo->prepare('SELECT id FROM conversations WHERE id=? AND (buyer_id=? OR seller_id=?)'); $stmt->execute([$id,$current['id'],$current['id']]); if(!$stmt->fetchColumn()) respond(['error'=>'Conversation not found.'],404); $stmt=$pdo->prepare('SELECT m.id,m.sender_id,m.message_text,m.is_read,m.created_at,u.full_name AS sender FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_id=? ORDER BY m.created_at'); $stmt->execute([$id]); respond(['messages'=>$stmt->fetchAll()]); }
    if ($resource === 'conversations' && $id && $sub === 'messages' && $method === 'POST') { $current=requireUser(); requireCsrf(); $data=input(); $text=trim((string)($data['message']??'')); if($text===''||mb_strlen($text)>5000) respond(['error'=>'Message must contain 1 to 5000 characters.'],422); $stmt=$pdo->prepare('SELECT id FROM conversations WHERE id=? AND (buyer_id=? OR seller_id=?)'); $stmt->execute([$id,$current['id'],$current['id']]); if(!$stmt->fetchColumn()) respond(['error'=>'Conversation not found.'],404); $stmt=$pdo->prepare('INSERT INTO messages (conversation_id,sender_id,message_text) VALUES (?,?,?)'); $stmt->execute([$id,$current['id'],$text]); respond(['id'=>(int)$pdo->lastInsertId()],201); }

    if ($resource === 'alerts' && $method === 'GET') { $current=requireUser(); $stmt=$pdo->prepare('SELECT id,search_query,city,max_price,category_id,is_active,created_at FROM search_alerts WHERE user_id=? ORDER BY created_at DESC'); $stmt->execute([$current['id']]); respond(['alerts'=>$stmt->fetchAll()]); }
    if ($resource === 'alerts' && $method === 'POST') { $current=requireUser(); requireCsrf(); $data=input(); $query=trim((string)($data['query']??'')); if($query===''||mb_strlen($query)>255) respond(['error'=>'Enter a search up to 255 characters.'],422); $stmt=$pdo->prepare('INSERT INTO search_alerts (user_id,search_query,city,max_price,category_id) VALUES (?,?,?,?,?)'); $stmt->execute([$current['id'],$query,trim((string)($data['city']??''))?:null,$data['max_price']??null,$data['category_id']??null]); respond(['id'=>(int)$pdo->lastInsertId()],201); }

    if ($resource === 'admin' && $sub === 'listings' && $method === 'GET') { $current=requireUser(); requireAdmin($current); $status=$_GET['status']??'pending'; if($status==='all') { $stmt=$pdo->query('SELECT id FROM annonce ORDER BY created_at DESC LIMIT 100'); } else { if(!in_array($status,['pending','approved','rejected','sold','archived'],true)) respond(['error'=>'Invalid status filter.'],422); $stmt=$pdo->prepare('SELECT id FROM annonce WHERE status=? ORDER BY created_at DESC LIMIT 100'); $stmt->execute([$status]); } $items=[]; foreach($stmt->fetchAll(PDO::FETCH_COLUMN) as $adId) $items[]=listing($pdo,(int)$adId); respond(['listings'=>$items]); }
    if ($resource === 'admin' && $sub === 'listings' && $id && $method === 'PATCH') { $current=requireUser(); requireAdmin($current); requireCsrf(); $data=input(); $status=$data['status']??''; if(!in_array($status,['approved','rejected'],true)) respond(['error'=>'Status must be approved or rejected.'],422); $stmt=$pdo->prepare('UPDATE annonce SET status=?,moderation_note=?,moderated_by=?,moderated_at=NOW() WHERE id=?'); $stmt->execute([$status,trim((string)($data['moderation_note']??''))?:null,$current['id'],$id]); respond(['listing'=>listing($pdo,$id)]); }

    respond(['error'=>'Route not found.'],404);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('QuickAnnonces request failed: '.get_class($e));
    respond(['error'=>'The request could not be completed. Check server configuration and try again.'],500);
}

