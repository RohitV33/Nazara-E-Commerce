import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <AnimatePresence>
      {loading && (
        <>
          {/* Top progress bar */}
          <motion.div
            initial={{ width: '0%', opacity: 1 }}
            animate={{ width: '85%' }}
            exit={{ width: '100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-0 left-0 h-0.5 bg-ink-950 z-[100]"
            style={{ boxShadow: '0 0 8px rgba(13,13,18,0.4)' }}
          />
          {/* Small dot at end of bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 right-4 w-1.5 h-1.5 rounded-full bg-ink-950 z-[100] mt-[-2px]"
          />
        </>
      )}
    </AnimatePresence>
  );
}