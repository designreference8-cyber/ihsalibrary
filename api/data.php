<?php
require 'config.php';

header('Content-Type: application/json');

try {
    // Fetch the single row of application state
    $stmt = $pdo->query("SELECT json_data FROM app_state WHERE id = 1 LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo $row['json_data'];
    } else {
        echo '{}'; // Return empty object if no data found
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>