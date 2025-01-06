import { Router, Request, Response } from 'express';
// import nodemailer from 'nodemailer';

const router = Router();

var nodemailer = require('nodemailer');

// POST route to send email
router.post('/', async (req: Request, res: Response) => {
  const { subject, message, fullName } = req.body;


  var transporter = nodemailer.createTransport({
    "host": "smtp.qiye.aliyun.com",
    "port": 465,
    "secureConnection": true, // use SSL
    "auth": {
        "user": `${process.env.EMAIL_USER}`, // user name
        "pass": `${process.env.EMAIL_PASS}`         // password
    }
});

  // setup e-mail data with unicode symbols.
var mailOptions = {
  from: `${process.env.EMAIL_USER}`, // sender address mailfrom must be same with the user.
  to: process.env.EMAIL_USER, // list of receivers
  subject: subject, // Subject line
  text: message, // plaintext body
  // html: '<b>Hello world</b><img src="cid:01" style="width:200px;height:auto">', // html body
  attachments: [
      {
          filename: fullName,
          content: message
      }
  ],

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