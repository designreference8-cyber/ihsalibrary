<?php
require 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get raw POST data
    $json = file_get_contents('php://input');

    // Validate it's valid JSON
    json_decode($json);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data');
    }

    // Update or Insert (Upsert) the singleton record (ID=1)
    $stmt = $pdo->prepare("INSERT INTO app_state (id, json_data, updated_at) VALUES (1, ?, NOW()) ON DUPLICATE KEY UPDATE json_data = VALUES(json_data), updated_at = NOW()");
    $stmt->execute([$json]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>