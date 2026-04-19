import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from "../../utils/price";

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, loading } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const fallbackImg = `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <div className="group card hover:shadow-lg transition-shadow duration-300">
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-square bg-ink-50">
          {discount > 0 && (
            <span className="badge-sale">-{discount}%</span>
          )}

          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Heart
              size={15}
              className={wishlisted ? 'fill-red-500 text-red-500' : 'text-ink-400'}
            />
          </button>

          <Link to={`/products/${product.id}`}>
            <motion.img
              src={imgError ? fallbackImg : product.image_url}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </Link>
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category_name && (
            <span className="text-xs text-ink-400 uppercase tracking-widest font-medium">
              {product.category_name}
            </span>
          )}

          <Link to={`/products/${product.id}`}>
            <h3 className="font-medium text-ink-900 mt-1 mb-2 line-clamp-2 leading-snug hover:text-ink-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1 mb-3">
            <Star size={13} className="fill-gold-500 text-gold-500" />
            <span className="text-xs font-medium text-ink-700">{Number(product.rating).toFixed(1)}</span>
            <span className="text-xs text-ink-400">({product.review_count})</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-ink-950">{formatPrice(product.price)}</span>
              {product.original_price && (
                <span className="text-sm text-ink-400 line-through">{formatPrice(product.original_price)}</span>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => addToCart(product.id)}
              disabled={loading || product.stock === 0}
              className="w-9 h-9 rounded-full bg-ink-950 text-white flex items-center justify-center hover:bg-ink-700 transition-colors disabled:opacity-40"
            >
              <ShoppingBag size={15} />
            </motion.button>
          </div>

          {product.stock === 0 && (
            <p className="text-xs text-red-500 mt-1 font-medium">Out of stock</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
