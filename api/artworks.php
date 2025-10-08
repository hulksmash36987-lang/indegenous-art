<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// get all approved artworks with pagination and filtering
if ($method === 'GET' && $action === 'list') {
    $artworks = read_json('artworks.json');
    $approved = array_filter($artworks, function($art) {
        return $art['status'] === 'approved';
    });
    
    // search filter
    $search = $_GET['search'] ?? '';
    if (!empty($search)) {
        $approved = array_filter($approved, function($art) use ($search) {
            return stripos($art['title'], $search) !== false || 
                   stripos($art['description'], $search) !== false ||
                   stripos($art['type'], $search) !== false;
        });
    }
    
    // type filter
    $type_filter = $_GET['type'] ?? '';
    if (!empty($type_filter)) {
        $types = explode(',', $type_filter);
        $approved = array_filter($approved, function($art) use ($types) {
            return in_array($art['type'], $types);
        });
    }
    
    // period filter
    $period_filter = $_GET['period'] ?? '';
    if (!empty($period_filter)) {
        $periods = explode(',', $period_filter);
        $approved = array_filter($approved, function($art) use ($periods) {
            return in_array($art['period'], $periods);
        });
    }
    
    // sorting
    $sort = $_GET['sort'] ?? 'title_asc';
    $approved = array_values($approved);
    
    if ($sort === 'title_asc') {
        usort($approved, function($a, $b) {
            return strcmp($a['title'], $b['title']);
        });
    } elseif ($sort === 'title_desc') {
        usort($approved, function($a, $b) {
            return strcmp($b['title'], $a['title']);
        });
    } elseif ($sort === 'recent') {
        usort($approved, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
    }
    
    // pagination
    $limit = $_GET['limit'] ?? 12;
    $page = $_GET['page'] ?? 1;
    $offset = ($page - 1) * $limit;
    $paginated = array_slice($approved, $offset, $limit);
    
    send_response([
        'success' => true,
        'artworks' => $paginated,
        'total' => count($approved)
    ]);
}

// get single artwork by id or alias 'get'
if ($method === 'GET' && ($action === 'get' || $action === 'detail')) {
    $id = $_GET['id'] ?? 0;
    $artworks = read_json('artworks.json');
    
    foreach ($artworks as $art) {
        if ($art['id'] == $id && $art['status'] === 'approved') {
            send_response(['success' => true, 'artwork' => $art]);
        }
    }
    
    send_response(['success' => false, 'error' => 'Artwork not found'], 404);
}

// get all approved artworks
if ($method === 'GET' && empty($action)) {
    $artworks = read_json('artworks.json');
    $approved = array_filter($artworks, function($art) {
        return $art['status'] === 'approved';
    });
    send_response(['success' => true, 'artworks' => array_values($approved)]);
}

// get latest artworks
if ($method === 'GET' && $action === 'latest') {
    $limit = $_GET['limit'] ?? 6;
    $artworks = read_json('artworks.json');
    
    $approved = array_filter($artworks, function($art) {
        return $art['status'] === 'approved';
    });
    
    // sort by created date
    usort($approved, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    $latest = array_slice($approved, 0, $limit);
    send_response(['success' => true, 'artworks' => $latest]);
}

// get similar artworks
if ($method === 'GET' && $action === 'similar') {
    $id = $_GET['id'] ?? 0;
    $limit = $_GET['limit'] ?? 3;
    $artworks = read_json('artworks.json');
    
    $current = null;
    foreach ($artworks as $art) {
        if ($art['id'] == $id) {
            $current = $art;
            break;
        }
    }
    
    if (!$current) {
        send_response(['success' => true, 'artworks' => []]);
    }
    
    // find similar by type
    $similar = array_filter($artworks, function($art) use ($current, $id) {
        return $art['id'] != $id && 
               $art['type'] === $current['type'] && 
               $art['status'] === 'approved';
    });
    
    $similar = array_slice(array_values($similar), 0, $limit);
    send_response(['success' => true, 'artworks' => $similar]);
}

// submit new artwork
if ($method === 'POST' && $action === 'submit') {
    $data = get_post_data();
    
    $required = ['title', 'type', 'description', 'artist_name', 'period', 'user_id'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            send_response(['success' => false, 'error' => "Field $field is required"], 400);
        }
    }
    
    $submissions = read_json('submissions.json');
    
    $new_submission = [
        'id' => count($submissions) + 1,
        'title' => $data['title'],
        'type' => $data['type'],
        'description' => $data['description'],
        'artist_name' => $data['artist_name'],
        'period' => $data['period'],
        'location' => $data['location'] ?? '',
        'location_notes' => $data['location_notes'] ?? '',
        'location_sensitive' => $data['location_sensitive'] ?? false,
        'condition_note' => $data['condition_note'] ?? '',
        'image_url' => $data['image_url'] ?? '',
        'user_id' => $data['user_id'],
        'status' => 'pending',
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $submissions[] = $new_submission;
    write_json('submissions.json', $submissions);
    
    send_response([
        'success' => true,
        'submission' => $new_submission,
        'message' => 'Artwork submitted for review'
    ]);
}

// get user's own submissions
if ($method === 'GET' && $action === 'my_submissions') {
    $user_id = $_GET['user_id'] ?? 0;
    $submissions = read_json('submissions.json');
    
    $my_subs = array_filter($submissions, function($s) use ($user_id) {
        return $s['user_id'] == $user_id;
    });
    
    send_response([
        'success' => true,
        'submissions' => array_values($my_subs)
    ]);
}

// delete endpoint for artists to delete their own submissions
if ($method === 'DELETE' && $action === 'delete') {
    $id = $_GET['id'] ?? 0;
    $submissions = read_json('submissions.json');
    
    $filtered = array_filter($submissions, function($s) use ($id) {
        return $s['id'] != $id;
    });
    
    write_json('submissions.json', array_values($filtered));
    send_response(['success' => true, 'message' => 'Submission deleted']);
}

send_response(['success' => false, 'error' => 'Invalid request'], 400);
?>
