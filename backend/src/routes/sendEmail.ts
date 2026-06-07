import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { subject, message, fullName } = req.body as { subject?: string; message?: string; fullName?: string };

  const transporter = nodemailer.createTransport({
    host: 'smtp.qiye.aliyun.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: subject ?? '(no subject)',
    text: message ?? '',
    attachments: fullName && message ? [{ filename: fullName, content: message }] : [],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    logger.error('Failed to send email', { error: String(error) });
    res.status(500).json({ message: 'Failed to send email', error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
