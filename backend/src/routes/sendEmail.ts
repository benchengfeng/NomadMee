import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

// POST route to send email
router.post('/', async (req: Request, res: Response) => {
  const { subject, message } = req.body;

  // Set up the SMTP transporter (using Gmail for this example)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
  });

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_USER , // Sender email
    to: process.env.EMAIL_USER, // Receiver email
    subject, // Subject of the email
    text: message, // Plain text body
    html: message, // HTML body (optional)
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