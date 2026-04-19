const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendOTPEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../config/mailer');
require('dotenv').config();

const generateToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;


    const existing = await db.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      if (existing.rows[0].is_verified) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      
      await db.query('DELETE FROM otp_verifications WHERE email = $1 AND type = $2', [email, 'register']);
      await db.query(
        'INSERT INTO otp_verifications (email, otp, type, expires_at) VALUES ($1, $2, $3, $4)',
        [email, otp, 'register', expiresAt]
      );
      await sendOTPEmail(email, name, otp);
      return res.json({ message: 'OTP resent to your email', requiresOTP: true, email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   
    await db.query(
      'INSERT INTO users (name, email, password, is_verified) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, false]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.query(
      'INSERT INTO otp_verifications (email, otp, type, expires_at) VALUES ($1, $2, $3, $4)',
      [email, otp, 'register', expiresAt]
    );
    await sendOTPEmail(email, name, otp);

    res.status(201).json({ message: 'OTP sent to your email', requiresOTP: true, email });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

   
    const otpResult = await db.query(
      `SELECT * FROM otp_verifications
       WHERE email = $1 AND otp = $2 AND type = $3 AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp, 'register']
    );
    if (otpResult.rows.length === 0) return res.status(400).json({ message: 'Invalid or expired OTP' });

   
    await db.query('UPDATE otp_verifications SET is_used = TRUE WHERE id = $1', [otpResult.rows[0].id]);
    await db.query('UPDATE users SET is_verified = TRUE WHERE email = $1', [email]);

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0]; 
    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    sendWelcomeEmail(email, user.name).catch(console.error);

    res.json({ message: 'Email verified! Welcome to LUXE 🎉', token, user: safeUser });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;


    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    if (userResult.rows[0].is_verified) return res.status(400).json({ message: 'Email already verified' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('DELETE FROM otp_verifications WHERE email = $1 AND type = $2', [email, 'register']);
    await db.query(
      'INSERT INTO otp_verifications (email, otp, type, expires_at) VALUES ($1, $2, $3, $4)',
      [email, otp, 'register', expiresAt]
    );
    await sendOTPEmail(email, userResult.rows[0].name, otp);

    res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });


    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.json({ message: 'If this email exists, a reset code has been sent', requiresOTP: true, email });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('DELETE FROM otp_verifications WHERE email = $1 AND type = $2', [email, 'reset_password']);
    await db.query(
      'INSERT INTO otp_verifications (email, otp, type, expires_at) VALUES ($1, $2, $3, $4)',
      [email, otp, 'reset_password', expiresAt]
    );
    await sendPasswordResetEmail(email, userResult.rows[0].name, otp);

    res.json({ message: 'Password reset code sent to your email', requiresOTP: true, email });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpResult = await db.query(
      `SELECT * FROM otp_verifications
       WHERE email = $1 AND otp = $2 AND type = $3 AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp, 'reset_password']
    );
    if (otpResult.rows.length === 0) return res.status(400).json({ message: 'Invalid or expired code' });

    res.json({ message: 'Code verified', canReset: true, email, otp });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }


    const otpResult = await db.query(
      `SELECT * FROM otp_verifications
       WHERE email = $1 AND otp = $2 AND type = $3 AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp, 'reset_password']
    );
    if (otpResult.rows.length === 0) return res.status(400).json({ message: 'Invalid or expired code' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    
    await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    await db.query('UPDATE otp_verifications SET is_used = TRUE WHERE id = $1', [otpResult.rows[0].id]);

    res.json({ message: 'Password reset successfully! Please login.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

   
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = userResult.rows[0]; // ✅ FIX: .rows[0]
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.is_verified) {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.query('DELETE FROM otp_verifications WHERE email = $1 AND type = $2', [email, 'register']);
      await db.query(
        'INSERT INTO otp_verifications (email, otp, type, expires_at) VALUES ($1, $2, $3, $4)',
        [email, otp, 'register', expiresAt]
      );
      await sendOTPEmail(email, user.name, otp);
      return res.status(403).json({ message: 'Email not verified. OTP sent.', requiresOTP: true, email });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;
    res.json({ message: 'Login successful', token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getMe = async (req, res) => {
  try {

    const userResult = await db.query(
      'SELECT id, name, email, role, avatar, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(userResult.rows[0]); // ✅ FIX: .rows[0]
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    
    await db.query('UPDATE users SET name = $1, avatar = $2 WHERE id = $3', [name, avatar || null, req.user.id]);

    const userResult = await db.query(
      'SELECT id, name, email, role, avatar, is_verified FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ message: 'Profile updated', user: userResult.rows[0] }); // ✅ FIX: .rows[0]
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'All fields required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

   
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};