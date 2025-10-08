<?php
// basic config stuff
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// where our json files live
define('DATA_DIR', __DIR__ . '/../data/');

// helper to read json file
function read_json($filename) {
    $path = DATA_DIR . $filename;
    if (!file_exists($path)) {
        return [];
    }
    $content = file_get_contents($path);
    return json_decode($content, true) ?: [];
}

// helper to write json file
function write_json($filename, $data) {
    $path = DATA_DIR . $filename;
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));
}

// send json response
function send_response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// get posted json data
function get_post_data() {
    return json_decode(file_get_contents('php://input'), true);
}

function check_auth() {
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
    
    if (!$token) {
        send_response(['error' => 'No token provided'], 401);
    }
    
    $sessions = read_json('sessions.json');
    foreach ($sessions as $session) {
        if ($session['token'] === $token && $session['expires'] > time()) {
            return $session['user'];
        }
    }
    
    send_response(['error' => 'Invalid or expired token'], 401);
}

function create_session($user) {
    $token = bin2hex(random_bytes(32));
    $sessions = read_json('sessions.json');
    
    // clean old sessions
    $sessions = array_filter($sessions, function($s) {
        return $s['expires'] > time();
    });
    
    $sessions[] = [
        'token' => $token,
        'user' => $user,
        'expires' => time() + (24 * 60 * 60) // 24 hours
    ];
    
    write_json('sessions.json', array_values($sessions));
    return $token;
}

function delete_session($token) {
    $sessions = read_json('sessions.json');
    $sessions = array_filter($sessions, function($s) use ($token) {
        return $s['token'] !== $token;
    });
    write_json('sessions.json', array_values($sessions));
}
?>
