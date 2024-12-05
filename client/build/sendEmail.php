<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $to = "aminebizerta@gmail.com";
    $subject = $data['subject'];
    $message = "Name: " . $data['fullname'] . "\n" .
               "Email: " . $data['email'] . "\n" .
               "Telephone: " . $data['telephone'] . "\n\n" .
               $data['message'];
    $headers = "From: " . $data['email'] . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Use -f flag to set the return path
    if (mail($to, $subject, $message, $headers, "-f" . $data['email'])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to send email']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
}
?>
    