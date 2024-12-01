<?php

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Include the custom .env loader
require_once __DIR__ . '/env-loader.php';

try {
    // Load environment variables from the .env file
    loadEnv(__DIR__ . '/.env');

    // Get database connection information from the environment
    $dbHost = $_ENV['DB_HOST'];
    $dbName = $_ENV['DB_NAME'];
    $dbUser = $_ENV['DB_USER'];
    $dbPass = $_ENV['DB_PASS'];

    // Connect to the database
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch data from the database
    $stmt = $pdo->prepare("SELECT * FROM brand");
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return data as JSON
    header('Content-Type: application/json');
    echo json_encode($data);

} catch (Exception $e) {
    // Handle errors
    echo 'Error: ' . $e->getMessage();
} catch (PDOException $e) {
    echo 'Database connection failed: ' . $e->getMessage();
}
?>
