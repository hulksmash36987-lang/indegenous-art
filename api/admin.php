<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// check if user is admin (simple check)
function check_admin() {
    $user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? 0;
    $users = read_json('users.json');
    
    foreach ($users as $user) {
        if ($user['id'] == $user_id && $user['role'] === 'admin') {
            return true;
        }
    }
    return false;
}

// get dashboard stats
if ($method === 'GET' && $action === 'stats') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized'], 403);
    }
    
    $submissions = read_json('submissions.json');
    $users = read_json('users.json');
    $artworks = read_json('artworks.json');
    
    $pending = count(array_filter($submissions, function($s) {
        return $s['status'] === 'pending';
    }));
    
    $approved_artworks = array_filter($artworks, function($a) {
        return $a['status'] === 'approved';
    });
    
    send_response([
        'success' => true,
        'stats' => [
            'pending' => $pending,
            'users' => count($users),
            'artworks' => count($approved_artworks)
        ]
    ]);
}

// get pending submissions
if ($method === 'GET' && $action === 'pending') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized'], 403);
    }
    
    $submissions = read_json('submissions.json');
    $pending = array_filter($submissions, function($s) {
        return $s['status'] === 'pending';
    });
    
    send_response([
        'success' => true,
        'submissions' => array_values($pending)
    ]);
}

// approve submission
if ($method === 'POST' && $action === 'approve') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized'], 403);
    }
    
    $id = $_GET['id'] ?? 0;
    
    $submissions = read_json('submissions.json');
    $artworks = read_json('artworks.json');
    
    $found = false;
    foreach ($submissions as &$sub) {
        if ($sub['id'] == $id) {
            $sub['status'] = 'approved';
            
            $new_artwork = $sub;
            $new_artwork['id'] = count($artworks) + 1;
            $artworks[] = $new_artwork;
            
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'Submission not found'], 404);
    }
    
    write_json('submissions.json', $submissions);
    write_json('artworks.json', $artworks);
    
    send_response(['success' => true, 'message' => 'Artwork approved']);
}

// reject submission
if ($method === 'POST' && $action === 'reject') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized'], 403);
    }
    
    $id = $_GET['id'] ?? 0;
    
    $submissions = read_json('submissions.json');
    
    $found = false;
    foreach ($submissions as &$sub) {
        if ($sub['id'] == $id) {
            $sub['status'] = 'rejected';
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'Submission not found'], 404);
    }
    
    write_json('submissions.json', $submissions);
    send_response(['success' => true, 'message' => 'Submission rejected']);
}

// delete submission
if ($method === 'DELETE' && $action === 'delete') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized'], 403);
    }
    
    $submission_id = $_GET['submission_id'] ?? 0;
    $submissions = read_json('submissions.json');
    
    $filtered = array_filter($submissions, function($s) use ($submission_id) {
        return $s['id'] != $submission_id;
    });
    
    write_json('submissions.json', array_values($filtered));
    send_response(['success' => true, 'message' => 'Submission deleted']);
}

// get all users
if ($method === 'GET' && $action === 'users') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized'], 403);
    }
    
    $users = read_json('users.json');
    
    foreach ($users as &$user) {
        unset($user['password']);
    }
    
    send_response([
        'success' => true,
        'users' => $users
    ]);
}

// update user role
if ($method === 'POST' && $action === 'update_role') {
    if (!check_admin()) {
        send_response(['error' => 'Unauthorized'], 403);
    }
    
    $data = get_post_data();
    $user_id = $data['user_id'] ?? 0;
    $new_role = $data['role'] ?? '';
    
    $users = read_json('users.json');
    
    $found = false;
    foreach ($users as &$user) {
        if ($user['id'] == $user_id) {
            $user['role'] = $new_role;
            $user['account_type'] = $new_role;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        send_response(['success' => false, 'error' => 'User not found'], 404);
    }
    
    write_json('users.json', $users);
    send_response(['success' => true, 'message' => 'User role updated']);
}

send_response(['success' => false, 'error' => 'Invalid request'], 400);
?>
