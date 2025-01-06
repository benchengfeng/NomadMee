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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import nodemailer from 'nodemailer';
const router = (0, express_1.Router)();
var nodemailer = require('nodemailer');
// POST route to send email
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subject, message, fullName } = req.body;
    var transporter = nodemailer.createTransport({
        "host": "smtp.qiye.aliyun.com",
        "port": 465,
        "secureConnection": true, // use SSL
        "auth": {
            "user": `${process.env.EMAIL_USER}`, // user name
            "pass": `${process.env.EMAIL_PASS}` // password
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
        yield transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully' });
    }
    catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email', error: error.message });
    }
}));
exports.default = router;
