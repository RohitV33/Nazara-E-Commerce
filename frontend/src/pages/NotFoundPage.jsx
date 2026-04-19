import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="text-center max-w-lg">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative inline-block mb-8">
            <span className="font-display text-[10rem] md:text-[14rem] font-semibold text-ink-100 leading-none select-none">
              404
            </span>
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-6xl">🔍</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-950 mb-3">
            Oops! Page Not Found
          </h1>
          <p className="text-ink-500 text-lg mb-8 leading-relaxed">
            It looks like this page doesn’t exist. <br />
            The link might be broken, or the page may have been moved or deleted.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn-outline flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft size={16} />
             Go Back
            </button>
            <Link to="/" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
              <Home size={16} />
              Home Page
            </Link>
            <Link to="/products" className="btn-ghost flex items-center gap-2 w-full sm:w-auto">
              <Search size={16} />
              Start Shopping
            </Link>
          </div>
        </motion.div>

        {/* Decorative */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 flex items-center justify-center gap-6"
        >
          {['Electronics', 'Fashion', 'Beauty', 'Sports'].map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${cat.toLowerCase()}`}
              className="text-xs text-ink-400 hover:text-ink-950 transition-colors font-medium"
            >
              {cat}
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
