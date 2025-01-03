import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

// POST route to send an email
router.post('/', async (req: Request, res: Response) => {
  const { subject, message } = req.body;

  // Set up the SMTP transporter (using Aliyun for this example)
  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.aliyun.com',  // Aliyun SMTP server
    port: 465,                     // Use port 465 for SSL (or 587 for TLS)
    secure: true,                  // Use SSL
    auth: {
      user: process.env.EMAIL_USER, // Your Aliyun email address (e.g., info@yourdomain.com)
      pass: process.env.EMAIL_PASS, // Your Aliyun email password or App-specific password
    },
  });

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USER,  // Sender email (your Aliyun email)
    to: process.env.EMAIL_USER,    // Receiver email (you can change this to the recipient)
    subject,                       // Subject of the email
    text: message,                 // Plain text body
    html: message,                 // HTML body (optional)
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

export default router;
