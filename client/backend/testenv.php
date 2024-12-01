<?php

// Attempt to load the .env file
try {
    // Include the custom .env loader function
    require_once __DIR__ . '/env-loader.php';
    
    // Load the .env file
    loadEnv(__DIR__ . '/.env');
    
    // If the .env file is loaded successfully, output success message
    echo "env okay\n";

    // Filter the $_ENV to exclude system variables and keep only custom ones
    $filteredEnv = array_filter($_ENV, function($key) {
        return strpos($key, 'HTTP_') !== 0 && strpos($key, 'SERVER_') !== 0 && strpos($key, 'GEOIP_') !== 0;
    }, ARRAY_FILTER_USE_KEY);

    // Check if DB_HOST and DB_NAME are set in the filtered environment variables
    if (isset($filteredEnv['DB_HOST']) && isset($filteredEnv['DB_NAME'])) {
        echo "DB_HOST: " . $filteredEnv['DB_HOST'] . "\n";
        echo "DB_NAME: " . $filteredEnv['DB_NAME'] . "\n";
        echo "DB_NAME: " . $filteredEnv['DB_USER'] . "\n";
        echo "DB_NAME: " . $filteredEnv['DB_PASS'] . "\n";
    } else {
        echo "Error: DB_HOST or DB_NAME not found in the environment variables.\n";
    }

} catch (Exception $e) {
    // If an error occurs, output the error message
    echo "Error: " . $e->getMessage();
}
?>
