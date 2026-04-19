require("dotenv").config();

async function slackAlert(msg) {
  try {
    const https = require('https');
    const url = new URL(process.env.REMOVED);
    const req = https.request({
      hostname: url.hostname, path: url.pathname,
      method: 'POST', headers: { 'Content-Type': 'application/json' }
    });
    req.write(JSON.stringify({ text: msg }));
    req.end();
  } catch(e) {}
}

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const passport = require("./config/passport");

const app = express();
app.set('trust proxy', 1);
const { verifyMailer } = require("./config/mailer");
verifyMailer();

import("monilog-sdk").then((mod) => {
  app.use(
    mod.monitor({
      serviceName: "Any service",
      slackWebhookUrl: process.env.REMOVED || "https://hooks.slack.com/services/YOUR_WEBHOOK_URL",
      maxLogSize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
  console.log("✅ Monilog connected");
});



app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://nazara-frontend.vercel.app",
    "https://nazara-shop.vercel.app",
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { message: "Too many attempts" } });
const generalLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 200, message: { message: "Too many requests" } });

app.use(passport.initialize());
app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);


app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/api/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
  }
);


app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/products/:id/reviews", require("./routes/reviews"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/addresses", require("./routes/addresses"));


app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


app.get("/error", (req, res, next) => {
  next(new Error("Test error from Nazara! 🚨"));
});


app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  slackAlert(`🚨 *Error on Nazara*\n*Route:* ${req.method} ${req.path}\n*Error:* ${err.message}`);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});