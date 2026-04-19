import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ComingSoonPage() {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').replace('-', ' ')
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const [email, setEmail] = useState('');

  const handleNotify = (e) => {
    e.preventDefault();
    toast.success('You\'ll be notified when this launches!');
    setEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="text-center max-w-lg">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-7xl mb-6">🚀</div>
          <span className="text-xs text-gold-600 font-medium tracking-widest uppercase">{pageName}</span>
          <h1 className="font-display text-5xl font-semibold text-ink-950 mt-2 mb-4">Coming Soon</h1>
          <p className="text-ink-500 text-lg mb-8 leading-relaxed">
            We're working hard to bring you something amazing. Enter your email to be notified when it launches!
          </p>

          <form onSubmit={handleNotify} className="flex gap-2 max-w-sm mx-auto mb-8">
            <input type="email" className="input-field flex-1" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="btn-primary shrink-0">
              <Bell size={16} /> Notify Me
            </button>
          </form>

          <Link to="/" className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-950 transition-colors mx-auto justify-center">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
