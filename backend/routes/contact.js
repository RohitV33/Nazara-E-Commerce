const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sendMail } = require('../config/mailer');

router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').isLength({ min: 10 }).withMessage('Message too short'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, email, subject, message } = req.body;

      await sendMail({
        to: process.env.GMAIL_USER,
        replyTo: email, 
        subject: `[Nazara Contact] ${subject} — from ${name}`,
        html: `
        <div style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
          <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;
                      overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,0.1);">
            
            <div style="background:#111;color:#fff;padding:20px;text-align:center;">
              <h2 style="margin:0;">Nazara Store</h2>
              <p style="margin:5px 0 0;font-size:14px;">New Contact Message</p>
            </div>

            <div style="padding:25px;">
              <h3 style="margin-bottom:15px;">Contact Details</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <div style="margin-top:15px;padding:15px;background:#f9f9f9;border-radius:8px;">
                <strong>Message:</strong>
                <p style="margin-top:10px;">${message}</p>
              </div>
              <div style="text-align:center;margin-top:25px;">
                <a href="https://nazara-shop.vercel.app"
                  style="display:inline-block;padding:12px 25px;background:#111;
                         color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
                  Visit Website
                </a>
              </div>
            </div>

            <div style="background:#f1f1f1;padding:15px;text-align:center;
                        font-size:12px;color:#555;">
              <p style="margin:0;">© ${new Date().getFullYear()} Nazara Store</p>
              <p style="margin:5px 0 0;">Sent from your website contact form</p>
            </div>

          </div>
        </div>`,
      });

      res.json({ message: "Message sent successfully!" });
    } catch (err) {
      console.error("Contact form error:", err);
      res.status(500).json({ message: "Failed to send message" });
    }
  }
);

module.exports = router;