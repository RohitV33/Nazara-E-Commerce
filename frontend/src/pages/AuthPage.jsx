import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader, Mail, ArrowLeft, RefreshCw, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';


function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = Array(6).fill('').map((_, i) => value[i] || '');

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const arr = [...digits]; arr[index] = '';
      onChange(arr.join('')); return;
    }
    if (val.length > 1) {
      const arr = [...digits];
      val.split('').slice(0, 6 - index).forEach((ch, j) => { arr[index + j] = ch; });
      onChange(arr.join(''));
      setTimeout(() => inputs.current[Math.min(index + val.length, 5)]?.focus(), 0);
      return;
    }
    const arr = [...digits]; arr[index] = val;
    onChange(arr.join(''));
    if (index < 5) setTimeout(() => inputs.current[index + 1]?.focus(), 0);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = [...digits];
      if (arr[index]) { arr[index] = ''; onChange(arr.join('')); }
      else if (index > 0) { arr[index - 1] = ''; onChange(arr.join('')); inputs.current[index - 1]?.focus(); }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const arr = Array(6).fill('').map((_, i) => pasted[i] || '');
    onChange(arr.join(''));
    setTimeout(() => inputs.current[Math.min(pasted.length, 5)]?.focus(), 0);
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1} value={digit}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste} onFocus={e => e.target.select()}
          autoComplete="one-time-code"
          className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all duration-200 text-ink-950 cursor-text
            ${digit ? 'bg-white border-ink-950' : 'bg-ink-50 border-ink-200'}
            focus:border-ink-950 focus:bg-white focus:scale-105`}
        />
      ))}
    </div>
  );
}


function OTPScreen({ email, onSuccess, onBack }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleVerify = async () => {
    const clean = otp.replace(/\s/g, '');
    if (clean.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: clean });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Email verified! Welcome to NAZARA 🎉');
      onSuccess(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp('');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New OTP sent!');
      setCountdown(60); setOtp('');
    } catch (err) { toast.error('Failed to resend'); }
    finally { setResending(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-6">
        <Mail size={28} className="text-ink-700" />
      </div>
      <h1 className="text-3xl font-semibold text-ink-950 mb-2">Check your email</h1>
      <p className="text-ink-400 text-sm mb-1">We sent a 6-digit code to</p>
      <p className="font-semibold text-ink-800 mb-8">{email}</p>
      <div className="mb-6"><OTPInput value={otp} onChange={setOtp} /></div>
      <button onClick={handleVerify} disabled={loading || otp.replace(/\s/g,'').length !== 6}
        className="btn-primary w-full justify-center py-3.5 mb-4">
        {loading ? <><Loader size={16} className="animate-spin" /> Verifying...</> : 'Verify Email'}
      </button>
      <div className="flex items-center justify-center gap-2 mb-6">
        {countdown > 0
          ? <p className="text-sm text-ink-400">Resend in <span className="font-semibold text-ink-700">{countdown}s</span></p>
          : <button onClick={handleResend} disabled={resending}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-950 transition-colors">
              {resending ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />} Resend Code
            </button>
        }
      </div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mx-auto">
        <ArrowLeft size={14} /> Back to Sign Up
      </button>
    </motion.div>
  );
}


function ForgotPasswordFlow({ onBack }) {
  const [step, setStep] = useState('email'); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset code sent!');
      setStep('otp'); setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    const clean = otp.replace(/\s/g, '');
    if (clean.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-reset-otp', { email, otp: clean });
      setStep('newpass');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
      setOtp('');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('New code sent!');
      setCountdown(60); setOtp('');
    } catch { toast.error('Failed to resend'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) { toast.error('Passwords do not match'); return; }
    if (newPass.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: otp.replace(/\s/g,''), newPassword: newPass });
      toast.success('Password reset successfully!');
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

      {/* Step: Email */}
      {step === 'email' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
            <Lock size={28} className="text-amber-600" />
          </div>
          <h1 className="text-3xl font-semibold text-ink-950 mb-2">Forgot password?</h1>
          <p className="text-ink-400 text-sm mb-8">Enter your email and we'll send a reset code.</p>
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-600 mb-1.5 block">Email Address</label>
              <input type="email" className="input-field" placeholder="jane@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
              {loading ? <><Loader size={16} className="animate-spin" /> Sending...</> : 'Send Reset Code'}
            </button>
          </form>
        </>
      )}

      {/* Step: OTP */}
      {step === 'otp' && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-amber-600" />
          </div>
          <h1 className="text-3xl font-semibold text-ink-950 mb-2">Enter reset code</h1>
          <p className="text-ink-400 text-sm mb-1">We sent a 6-digit code to</p>
          <p className="font-semibold text-ink-800 mb-8">{email}</p>
          <div className="mb-6"><OTPInput value={otp} onChange={setOtp} /></div>
          <button onClick={handleVerifyOTP} disabled={loading || otp.replace(/\s/g,'').length !== 6}
            className="btn-primary w-full justify-center py-3.5 mb-4">
            {loading ? <><Loader size={16} className="animate-spin" /> Verifying...</> : 'Verify Code'}
          </button>
          <div className="flex items-center justify-center mb-4">
            {countdown > 0
              ? <p className="text-sm text-ink-400">Resend in <span className="font-semibold">{countdown}s</span></p>
              : <button onClick={handleResend} className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-950">
                  <RefreshCw size={14} /> Resend Code
                </button>
            }
          </div>
        </div>
      )}

      {/* Step: New Password */}
      {step === 'newpass' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
            <Lock size={28} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-semibold text-ink-950 mb-2">Set new password</h1>
          <p className="text-ink-400 text-sm mb-8">Choose a strong password for your account.</p>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-600 mb-1.5 block">New Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                  placeholder="Min. 6 characters" value={newPass}
                  onChange={e => setNewPass(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600 mb-1.5 block">Confirm Password</label>
              <input type="password" className="input-field" placeholder="Re-enter password"
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
              {confirmPass && newPass !== confirmPass && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading || newPass !== confirmPass}
              className="btn-primary w-full justify-center py-3.5">
              {loading ? <><Loader size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
            </button>
          </form>
        </>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-3xl font-semibold text-ink-950 mb-2">Password Reset!</h1>
          <p className="text-ink-400 text-sm mb-8">Your password has been updated. Please login with your new password.</p>
          <button onClick={onBack} className="btn-primary w-full justify-center py-3.5">
            Back to Login
          </button>
        </div>
      )}

      {step !== 'done' && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mx-auto mt-6">
          <ArrowLeft size={14} /> Back to Login
        </button>
      )}
    </motion.div>
  );
}

// ── Main Auth Page ─────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otpEmail, setOtpEmail] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
      const result = await login(form.email, form.password);
      if (result?.success) navigate(result?.user?.role === 'admin' ? '/admin' : '/');
      else if (result?.requiresOTP) { setOtpEmail(form.email); setShowOTP(true); }
    } else {
      try {
        const { data } = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
        if (data.requiresOTP) { setOtpEmail(form.email); setShowOTP(true); toast.success('OTP sent to your email!'); }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    }
  };

  const screen = showForgot ? 'forgot' : showOTP ? 'otp' : 'auth';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&q=80"
          alt="fashion" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ink-950/50 flex flex-col justify-end p-12">
          <Link to="/" className="font-display text-5xl text-white font-semibold mb-4">NAZARA</Link>
          <p className="text-ink-200 text-lg max-w-xs leading-relaxed">
            "Quality is never an accident. It is always the result of high intention."
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16 bg-cream">
        <div className="w-full max-w-md">
          <Link to="/" className="font-display text-3xl text-ink-950 font-semibold lg:hidden mb-8 block">NAZARA</Link>
          <AnimatePresence mode="wait">

            {screen === 'forgot' && (
              <ForgotPasswordFlow key="forgot"
                onBack={() => { setShowForgot(false); setMode('login'); }} />
            )}

            {screen === 'otp' && (
              <OTPScreen key="otp" email={otpEmail}
                onSuccess={() => window.location.href = '/'}
                onBack={() => { setShowOTP(false); setForm({...form, password: ''}); }} />
            )}

            {screen === 'auth' && (
              <motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <h1 className="text-3xl font-semibold text-ink-950 mb-2">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h1>
                <p className="text-ink-400 text-sm mb-8">
                  {mode === 'login' ? 'Sign in to continue shopping' : 'Join thousands of happy customers'}
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div>
                      <label className="text-xs font-medium text-ink-600 mb-1.5 block">Full Name</label>
                      <input className="input-field" placeholder="Jane Smith"
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-ink-600 mb-1.5 block">Email Address</label>
                    <input type="email" className="input-field" placeholder="jane@example.com"
                      value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-ink-600">Password</label>
                      {mode === 'login' && (
                        <button type="button" onClick={() => setShowForgot(true)}
                          className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                        placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                        value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                        required minLength={6} />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-2">
                    {loading ? <><Loader size={16} className="animate-spin" /> Please wait...</>
                      : mode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                   <div className="flex items-center my-6">
                  <div className="flex-grow border-t"></div>
                  <span className="mx-3 text-gray-400 text-sm">OR</span>
                  <div className="flex-grow border-t"></div>
                </div>

                {/* Google Login Button */}
                <button
                  onClick={() =>
                    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
                  }
                  className="w-full border border-gray-300 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition"
                >
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Continue with Google
                </button>

                

                <div className="mt-6 text-center">
                  <span className="text-sm text-ink-500">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  </span>
                  <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setForm({ name: '', email: '', password: '' }); }}
                    className="text-sm font-semibold text-ink-950 hover:text-gold-600 transition-colors">
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
