<?php
// Connect to your database (using PDO, mysqli, etc.)
$pdo = new PDO('mysql:host=nomadmtchengfeng.mysql.db;dbname=nomadmtchengfeng', 'nomadmtchengfeng', '7237237aA');

// Fetch data from the database
$stmt = $pdo->prepare("SELECT * FROM brand");
$stmt->execute();
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Return data as JSON
header('Content-Type: application/json');
echo json_encode($data);
?>
