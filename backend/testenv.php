<?php

// Attempt to load the .env file
try {
    // Include the custom .env loader function
    require_once __DIR__ . '/env-loader.php';
    
    // Load the .env file
    loadEnv(__DIR__ . '/.env');
    
    // If the .env file is loaded successfully, output success message
    echo "env okay";
} catch (Exception $e) {
    // If an error occurs, output the error message
    echo "Error: " . $e->getMessage();
}
?>
