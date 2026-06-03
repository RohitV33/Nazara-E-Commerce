const https = require("https");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
require("dotenv").config();

// Initialize Resend if API key is provided
let resendClient = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

// Initialize Nodemailer transporter if Gmail settings are provided
let gmailTransporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  gmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// 1. Brevo HTTP Mail Sender
async function brevoSendMail({ to, subject, html, replyTo }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("[Mailer] BREVO_API_KEY not set.");
    return null;
  }

  const senderEmail = process.env.SMTP_FROM_EMAIL || "verma61421st@gmail.com";
  const senderName = "Nazara Store";

  const payloadData = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (replyTo) {
    payloadData.replyTo = { email: replyTo };
  }

  const payload = JSON.stringify(payloadData);

  return new Promise((resolve) => {
    const options = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[Mailer] Email sent to ${to} via Brevo`);
          resolve(JSON.parse(data));
        } else {
          console.error(`[Mailer] Brevo API error ${res.statusCode}:`, data);
          resolve(null);
        }
      });
    });

    req.on("error", (err) => {
      console.error("[Mailer] Brevo request failed:", err.message);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

// 2. Resend SDK Mail Sender
async function resendSendMail({ to, subject, html, replyTo }) {
  if (!resendClient) return null;
  try {
    const senderEmail = process.env.SMTP_FROM_EMAIL || "onboarding@resend.dev";
    const senderName = "Nazara Store";

    const response = await resendClient.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to,
      subject,
      html,
      reply_to: replyTo,
    });
    console.log(`[Mailer] Email sent to ${to} via Resend`);
    return response;
  } catch (err) {
    console.error("[Mailer] Resend error:", err.message);
    return null;
  }
}

// 3. Gmail SMTP Mail Sender
async function gmailSendMail({ to, subject, html, replyTo }) {
  if (!gmailTransporter) return null;
  try {
    const senderEmail = process.env.GMAIL_USER;
    const senderName = "Nazara Store";

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html,
    };

    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await gmailTransporter.sendMail(mailOptions);
    console.log(`[Mailer] Email sent to ${to} via Gmail SMTP`);
    return info;
  } catch (err) {
    console.error("[Mailer] Gmail SMTP error:", err.message);
    return null;
  }
}

// Verify configured provider
async function verifyMailer() {
  if (process.env.BREVO_API_KEY) {
    console.log("✅ [Mailer] Brevo HTTP API configuration active.");
  } else if (process.env.RESEND_API_KEY) {
    console.log("✅ [Mailer] Resend API configuration active.");
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log("✅ [Mailer] Nodemailer Gmail SMTP active.");
  } else {
    console.warn("⚠️ [Mailer] No valid mailer keys found in environment variables.");
  }
}

// Unified Send Mail Router
async function sendMail({ to, subject, html, replyTo }) {
  // Priority: 1. Resend, 2. Gmail SMTP, 3. Brevo HTTP
  if (process.env.RESEND_API_KEY) {
    return resendSendMail({ to, subject, html, replyTo });
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return gmailSendMail({ to, subject, html, replyTo });
  } else if (process.env.BREVO_API_KEY) {
    return brevoSendMail({ to, subject, html, replyTo });
  } else {
    console.error("[Mailer] Failed to send email: No configuration found in environment variables.");
    return null;
  }
}

async function sendOTPEmail(email, name, otp) {
  return sendMail({
    to: email,
    subject: "Your Nazara Verification Code",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px;background:#fff;border-radius:16px;">
      <h1 style="text-align:center;color:#111827;">NAZARA</h1>
      <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
      <p style="color:#6B7280;">Your verification code is:</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <h2 style="letter-spacing:12px;color:#111827;font-size:36px;margin:0;">${otp}</h2>
      </div>
      <p style="color:#9CA3AF;font-size:13px;">Expires in 10 minutes. Ignore if you didn't request this.</p>
      <p style="color:#9CA3AF;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Nazara Store</p>
    </div>`,
  });
}

async function sendPasswordResetEmail(email, name, otp) {
  return sendMail({
    to: email,
    subject: "Reset Your Nazara Password",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px;background:#fff;border-radius:16px;">
      <h1 style="text-align:center;color:#EF4444;">NAZARA</h1>
      <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
      <p style="color:#6B7280;">Your password reset code is:</p>
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <h2 style="letter-spacing:12px;color:#EF4444;font-size:36px;margin:0;">${otp}</h2>
      </div>
      <p style="color:#9CA3AF;font-size:13px;">Expires in 10 minutes. Ignore if you didn't request this.</p>
      <p style="color:#9CA3AF;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Nazara Store</p>
    </div>`,
  });
}

async function sendWelcomeEmail(email, name) {
  return sendMail({
    to: email,
    subject: "Welcome to Nazara Store!",
    html: `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px;background:#fff;border-radius:16px;text-align:center;">
      <h1 style="color:#111827;">NAZARA</h1>
      <div style="font-size:48px;margin:16px 0;">🎉</div>
      <h2 style="color:#111827;">Welcome, ${name}!</h2>
      <p style="color:#6B7280;">Your account is verified. Start exploring our premium collection!</p>
      <a href="${process.env.FRONTEND_URL || 'https://nazara-shop.vercel.app'}"
        style="display:inline-block;background:#111827;color:#fff;padding:14px 32px;
               border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
        Shop Now
      </a>
      <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">© ${new Date().getFullYear()} Nazara Store</p>
    </div>`,
  });
}

module.exports = { sendMail, verifyMailer, sendOTPEmail, sendPasswordResetEmail, sendWelcomeEmail };