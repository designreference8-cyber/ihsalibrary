CREATE DATABASE IF NOT EXISTS ihsa_library;
USE ihsa_library;

CREATE TABLE IF NOT EXISTS app_state (
    id INT PRIMARY KEY,
    json_data LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize with empty data if not exists so the first fetch doesn't fail
-- The 'ON DUPLICATE KEY UPDATE' is just a no-op here to ensure we don't error if it exists
INSERT INTO app_state (id, json_data) VALUES (1, '{}') ON DUPLICATE KEY UPDATE id=id;
