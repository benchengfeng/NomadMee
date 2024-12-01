<?php

// Allow CORS
header("Access-Control-Allow-Origin: *"); // Allows all origins to make requests. Adjust this for security if needed.
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Allow specific HTTP methods.
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // Allow specific headers.


// Include the Composer autoload file
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables from .env file
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Get database connection information from the environment
$dbHost = $_ENV['DB_HOST'];
$dbName = $_ENV['DB_NAME'];
$dbUser = $_ENV['DB_USER'];
$dbPass = $_ENV['DB_PASS'];

// Connect to the database using the loaded environment variables
try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Fetch data from the database
    $stmt = $pdo->prepare("SELECT * FROM brand");
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return data as JSON
    header('Content-Type: application/json');
    echo json_encode($data);

} catch (PDOException $e) {
    // Handle connection errors
    echo 'Connection failed: ' . $e->getMessage();
}
?>
