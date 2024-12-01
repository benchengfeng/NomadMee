<?php
function loadEnv($filePath = __DIR__ . '/.env')
{
    if (!file_exists($filePath)) {
        throw new Exception("The .env file does not exist at $filePath");
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || !strpos($line, '=')) {
            continue; // Skip comments and invalid lines
        }

        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        // Strip quotes if present
        if (preg_match('/^["\'].*["\']$/', $value)) {
            $value = substr($value, 1, -1);
        }

        $_ENV[$key] = $value;
        $_SERVER[$key] = $value; // Optional: make it available in $_SERVER too
    }
}
?>
