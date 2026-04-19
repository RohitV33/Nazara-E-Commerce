const express = require('express');
const router = express.Router();
const {
  register, login, verifyOTP, resendOTP,
  forgotPassword, verifyResetOTP, resetPassword,
  getMe, updateProfile, changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../middleware/validate');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
