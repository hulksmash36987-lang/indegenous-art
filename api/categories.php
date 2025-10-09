<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'list') {
    $categories = read_json('categories.json');
    send_response(['success' => true, 'categories' => $categories]);
}

if ($method === 'GET' && empty($action)) {
    $categories = read_json('categories.json');
    send_response(['categories' => $categories]);
}

if ($method === 'POST' && $action === 'add') {
    $data = get_post_data();
    $name = $data['name'] ?? '';

    if (empty($name)) {
        send_response(['success' => false, 'error' => 'Category name required'], 400);
    }

    $categories = read_json('categories.json');

    $max_id = 0;
    foreach ($categories as $cat) {
        if ($cat['id'] > $max_id) {
            $max_id = $cat['id'];
        }
    }

    $new_category = [
        'id' => $max_id + 1,
        'name' => $name,
        'created_at' => date('Y-m-d H:i:s')
    ];

    $categories[] = $new_category;
    write_json('categories.json', $categories);

    send_response(['success' => true, 'category' => $new_category]);
}

if ($method === 'POST' && $action === 'delete') {
    $id = $_GET['id'] ?? 0;

    $categories = read_json('categories.json');
    $filtered = array_filter($categories, function($cat) use ($id) {
        return $cat['id'] != $id;
    });

    write_json('categories.json', array_values($filtered));
    send_response(['success' => true, 'message' => 'Category deleted']);
}

send_response(['error' => 'Invalid request'], 400);
?>
