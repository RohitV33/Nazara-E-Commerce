const https = require("https");

async function brevoSendMail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("[Mailer] BREVO_API_KEY not set.");
    return null;
  }

  const senderEmail = process.env.SMTP_FROM_EMAIL || "verma61421st@gmail.com";
  const senderName = "Nazara Store";

  const payload = JSON.stringify({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

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
          console.log(`[Mailer] Email sent to ${to}`);
          resolve(JSON.parse(data));
        } else {
          console.error(`[Mailer] Brevo API error ${res.statusCode}:`, data);
          resolve(null);
        }
      });
    });

    req.on("error", (err) => {
      console.error("[Mailer] Request failed:", err.message);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

async function verifyMailer() {
  if (process.env.BREVO_API_KEY) {
    console.log("[Mailer] Brevo HTTP API ready.");
  } else {
    console.warn("[Mailer] WARNING: BREVO_API_KEY not set.");
  }
}

async function sendMail({ to, subject, html }) {
  return brevoSendMail({ to, subject, html });
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