"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nodemailer_1 = __importDefault(require("nodemailer"));
const router = (0, express_1.Router)();
// POST route to send an email
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subject, message } = req.body;
    // Set up the SMTP transporter (using Aliyun for this example)
    const transporter = nodemailer_1.default.createTransport({
        host: 'smtp.mail.aliyun.com', // Aliyun SMTP server
        port: 465, // Use port 465 for SSL (or 587 for TLS)
        secure: true, // Use SSL
        auth: {
            user: process.env.EMAIL_USER, // Your Aliyun email address (e.g., info@yourdomain.com)
            pass: process.env.EMAIL_PASS, // Your Aliyun email password or App-specific password
        },
    });
    // Email options
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender email (your Aliyun email)
        to: process.env.EMAIL_USER, // Receiver email (you can change this to the recipient)
        subject, // Subject of the email
        text: message, // Plain text body
        html: message, // HTML body (optional)
    };
    try {
        // Send the email
        yield transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully' });
    }
    catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email', error: error.message });
    }
}));
exports.default = router;
