<?php

// Attempt to load the .env file
try {
    // Include the custom .env loader function
    require_once __DIR__ . '/env-loader.php';
    
    // Load the .env file
    loadEnv(__DIR__ . '/.env');
    

    // Filter the $_ENV to exclude system variables and keep only custom ones
    $filteredEnv = array_filter($_ENV, function($key) {
        return strpos($key, 'HTTP_') !== 0 && strpos($key, 'SERVER_') !== 0 && strpos($key, 'GEOIP_') !== 0;
    }, ARRAY_FILTER_USE_KEY);

    // Check if DB_HOST and DB_NAME are set in the filtered environment variables
    if (isset($filteredEnv['DB_HOST']) && isset($filteredEnv['DB_NAME'])) {
        $dbHost = $filteredEnv['DB_HOST'];
        $dbName = $filteredEnv['DB_NAME'];
        $dbUser = $filteredEnv['DB_USER'];
        $dbPass = $filteredEnv['DB_PASS'];

        
        $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUser, $dbPass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        
        // Fetch data from the database
        $stmt = $pdo->prepare("SELECT * FROM brand");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Return data as JSON
        header('Content-Type: application/json');
        echo json_encode($data);

    } else {
        echo "Error: DB_HOST or DB_NAME not found in the environment variables.\n";
    }

} catch (Exception $e) {
    // If an error occurs, output the error message
    echo "Error: " . $e->getMessage();
}
?>
