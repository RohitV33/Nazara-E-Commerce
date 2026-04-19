import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Check, ChevronLeft, Minus, Plus, Tag } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/product/ProductCard';
import ReviewSection from '../components/product/ReviewSection';
import { ProductDetailSkeleton } from '../components/common/Skeletons';
import { formatPrice } from "../utils/price";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    setQuantity(1);
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(console.error)
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleAddToCart = async () => {
    const success = await addToCart(product.id, quantity);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  const discount = product?.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  if (loading) return <div className="pt-16"><ProductDetailSkeleton /></div>;
  if (!product) return (
    <div className="pt-28 text-center">
      <h2 className="text-2xl font-semibold">Product not found</h2>
      <Link to="/products" className="btn-primary mt-4 inline-flex">Back to Shop</Link>
    </div>
  );

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images : [product.image_url];
  const tags = Array.isArray(product.tags) ? product.tags : [];

  return (
    <div className="pt-20 pb-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Link to="/" className="hover:text-ink-950 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-ink-950 transition-colors">Shop</Link>
          {product.category_name && (
            <>
              <span>/</span>
              <Link to={`/products?category=${product.category_slug}`} className="hover:text-ink-950 transition-colors">
                {product.category_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-ink-700 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="sticky top-24">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-ink-50 mb-3">
                {discount > 0 && (
                  <span className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    -{discount}%
                  </span>
                )}
                <motion.img
                  key={activeImg}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  src={images[activeImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImg === i ? 'border-ink-950' : 'border-transparent hover:border-ink-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="pt-4"
          >
            {product.category_name && (
              <Link to={`/products?category=${product.category_slug}`}
                className="text-xs text-gold-600 font-medium tracking-widest uppercase hover:text-gold-700">
                {product.category_name}
              </Link>
            )}

            <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-950 mt-2 mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={15}
                    className={s <= Math.round(product.rating)
                      ? 'fill-gold-500 text-gold-500'
                      : 'text-ink-200 fill-ink-200'}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-ink-800">{Number(product.rating).toFixed(1)}</span>
              <span className="text-sm text-ink-400">({product.review_count} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-semibold text-ink-950">₹{Number(product.price).toFixed(2)}</span>
              {product.original_price && (
                <span className="text-xl text-ink-400 line-through">₹{Number(product.original_price).toFixed(2)}</span>
              )}
              {discount > 0 && (
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Save {discount}%
                </span>
              )}
            </div>

            <p className="text-ink-600 leading-relaxed mb-7 text-base">{product.description}</p>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-7">
                {tags.map((tag) => (
                  <span key={tag} className="tag"><Tag size={10} className="mr-1" />{tag}</span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-ink-600">
                {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-ink-200 rounded-full overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center hover:bg-ink-50 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="w-11 h-11 flex items-center justify-center hover:bg-ink-50 transition-colors disabled:opacity-40">
                  <Plus size={14} />
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={cartLoading || product.stock === 0 || added}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-full text-sm font-semibold transition-all duration-300 ${
                  added ? 'bg-green-500 text-white' : 'bg-ink-950 text-white hover:bg-ink-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {added ? <><Check size={16} /> Added to Cart</> : <><ShoppingBag size={16} /> Add to Cart</>}
              </motion.button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-6 border-t border-ink-100">
              {[
                { icon: '🚚', text: 'Free shipping on orders over ?00' },
                { icon: '↩️', text: '30-day easy returns & exchanges' },
                { icon: '🔒', text: 'Secure payment with SSL encryption' },
              ].map((perk) => (
                <div key={perk.text} className="flex items-center gap-2 text-sm text-ink-600">
                  <span>{perk.icon}</span>{perk.text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <ReviewSection
          productId={product.id}
          rating={product.rating}
          reviewCount={product.review_count}
        />

        {/* Related Products */}
        {product.related?.length > 0 && (
          <div className="mt-20">
            <h2 className="section-title mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
