import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/price';

export default function CartPage() {
  const { cart, updateItem, removeItem } = useCart();
  const { items, total } = cart;

  const subtotal = total;
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const grandTotal = +(subtotal + shipping + tax).toFixed(2);

  if (!items || items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <ShoppingBag size={64} className="text-ink-200 mx-auto mb-6" />
          <h1 className="text-3xl font-semibold text-ink-900 mb-3">Your cart is empty</h1>
          <p className="text-ink-400 mb-8">Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn-primary">
            Start Shopping <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-title mb-8"
      >
        Cart
        <span className="ml-3 text-xl text-ink-400 font-sans font-normal">({items.length})</span>
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30, height: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="card p-3 sm:p-4"
              >
                <div className="flex items-center gap-3">
                  {/* Image */}
                  <Link to={`/products/${item.product_id}`} className="shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-ink-50"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-medium text-ink-900 hover:text-ink-600 transition-colors line-clamp-2 text-sm leading-tight"
                    >
                      {item.name}
                    </Link>
                    <p className="text-base font-semibold text-ink-950 mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Mobile: qty + delete in same row */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-ink-200 rounded-full overflow-hidden">
                        <button
                          onClick={() => updateItem(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-ink-50 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-ink-50 transition-colors disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-800">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-ink-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5 sticky top-24"
          >
            <h2 className="font-semibold text-lg text-ink-950 mb-4">Order Summary</h2>

            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Subtotal ({items.reduce((s,i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                  {shipping === 0 ? 'Free 🎉' : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Tax (8%)</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
            </div>

            <div className="border-t border-ink-100 pt-3 flex justify-between mb-5">
              <span className="font-semibold text-ink-950">Total</span>
              <span className="font-bold text-xl text-ink-950">{formatPrice(grandTotal)}</span>
            </div>

            {shipping > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 mb-4 text-xs text-amber-700">
               💡 Add <strong>{formatPrice(100 - subtotal)}</strong> more for free shipping!
              </div>
            )}

            <Link to="/checkout" className="btn-primary w-full justify-center">
              Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/products" className="btn-ghost w-full justify-center mt-2 text-sm">
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}