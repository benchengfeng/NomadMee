<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $to = "amine_bh@outlook.com";
    $subject = $data['subject'];
    $message = "Name: " . $data['fullname'] . "\n" .
               "Email: " . $data['email'] . "\n" .
               "Telephone: " . $data['telephone'] . "\n\n" .
               $data['message'];
    $headers = "From: " . $data['email'] . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Log the headers for debugging
    error_log("Headers: " . $headers);

    if (mail($to, $subject, $message, $headers)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to send email']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
}
?>
