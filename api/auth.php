<?php
require_once 'config.php';
session_start();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'login') {
    $data = get_post_data();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        send_response(['success' => false, 'message' => 'Email and password required'], 400);
    }
    
    $users = read_json('users.json');
    
    foreach ($users as $user) {
        if ($user['email'] === $email && $user['password'] === $password) {
            if ($user['status'] !== 'active') {
                send_response(['success' => false, 'message' => 'Account is not active'], 403);
            }
            
            $token = create_session($user);
            unset($user['password']);
            
            send_response([
                'success' => true,
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful'
            ]);
        }
    }
    
    send_response(['success' => false, 'message' => 'Invalid email or password'], 401);
}

if ($method === 'POST' && $action === 'register') {
    $data = get_post_data();
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $account_type = $data['account_type'] ?? 'General';
    
    if (empty($username) || empty($email) || empty($password)) {
        send_response(['success' => false, 'message' => 'All fields are required'], 400);
    }
    
    if (strlen($password) < 6) {
        send_response(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_response(['success' => false, 'message' => 'Invalid email format'], 400);
    }
    
    $users = read_json('users.json');
    
    foreach ($users as $user) {
        if (strtolower($user['email']) === strtolower($email)) {
            send_response(['success' => false, 'message' => 'Email already exists'], 400);
        }
        if (strtolower($user['username']) === strtolower($username)) {
            send_response(['success' => false, 'message' => 'Username already exists'], 400);
        }
    }
    
    $role = ($account_type === 'Artist') ? 'artist' : 'user';
    
    $new_user = [
        'id' => count($users) + 1,
        'username' => $username,
        'email' => $email,
        'password' => $password,
        'account_type' => $account_type,
        'role' => $role,
        'status' => 'active',
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $users[] = $new_user;
    write_json('users.json', $users);
    
    send_response([
        'success' => true,
        'message' => 'Account created successfully. Please login.'
    ]);
}

if ($method === 'POST' && $action === 'logout') {
    $data = get_post_data();
    $token = $data['token'] ?? '';
    
    if ($token) {
        delete_session($token);
    }
    
    send_response([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
}

if ($method === 'GET' && $action === 'verify') {
    $token = $_GET['token'] ?? '';
    
    if (!$token) {
        send_response(['success' => false, 'valid' => false], 401);
    }
    
    $sessions = read_json('sessions.json');
    foreach ($sessions as $session) {
        if ($session['token'] === $token && $session['expires'] > time()) {
            unset($session['user']['password']);
            send_response([
                'success' => true,
                'valid' => true,
                'user' => $session['user']
            ]);
        }
    }
    
    send_response(['success' => false, 'valid' => false], 401);
}

send_response(['success' => false, 'message' => 'Invalid request'], 400);
?>
