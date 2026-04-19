import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ChevronUp, X, Loader, MapPin, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/price';

const STATUS_COLORS = {
  pending:          'bg-yellow-50 text-yellow-700 border-yellow-200',
  dispatched:       'bg-blue-50 text-blue-700 border-blue-200',
  out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered:        'bg-green-50 text-green-700 border-green-200',
  cancelled:        'bg-red-50 text-red-700 border-red-200',
};

const STATUS_STEPS = ['pending', 'dispatched', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  pending: 'Pending', dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
};

const CANCEL_REASONS = [
  "I want to change my delivery address",
  "I want to change the payment method",
  "I ordered the wrong item",
  "I found a better price elsewhere",
  "I no longer need this item",
  "Delivery time is too long",
  "Item was ordered by mistake",
  "Other reason",
];


function CancelModal({ order, onClose, onCancelled }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);

  const finalReason = selectedReason === 'Other reason' ? otherReason : selectedReason;

  const handleCancel = async () => {
    if (!selectedReason) { toast.error('Please select a reason'); return; }
    if (selectedReason === 'Other reason' && !otherReason.trim()) {
      toast.error('Please describe your reason'); return;
    }
    setLoading(true);
    try {
      await api.put(`/orders/${order.id}/cancel`, { reason: finalReason });
      toast.success('Order cancelled successfully');
      onCancelled(order.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel this order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold text-ink-950">Cancel Order #{order.id}</h2>
              <p className="text-xs text-ink-400">Please tell us why you're cancelling</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={16} className="text-ink-400" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-72 overflow-y-auto">
          <div className="space-y-2">
            {CANCEL_REASONS.map((reason) => (
              <label key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedReason === reason
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input type="radio" name="reason" value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-red-500 w-4 h-4" />
                <span className="text-sm text-ink-700">{reason}</span>
              </label>
            ))}
          </div>

          <AnimatePresence>
            {selectedReason === 'Other reason' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                  rows={3}
                  placeholder="Please describe your reason..."
                  value={otherReason}
                  onChange={e => setOtherReason(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-ink-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Keep Order
          </button>
          <button onClick={handleCancel} disabled={loading || !selectedReason}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader size={14} className="animate-spin" /> Cancelling...</> : 'Cancel Order'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


function OrderTimeline({ status }) {
  if (status === 'cancelled') return null;
  const current = STATUS_STEPS.indexOf(status);
  return (
    <div className="mt-4 pt-4 border-t border-ink-100">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-3 h-0.5 bg-ink-100 z-0" />
        <div className="absolute left-0 top-3 h-0.5 bg-green-400 z-0 transition-all duration-700"
          style={{ width: current >= 0 ? `${(current / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }} />
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-1 z-10">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
              i <= current ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-ink-200 text-ink-400'
            }`}>
              {i <= current ? '✓' : i + 1}
            </div>
            <span className="text-xs text-ink-500 hidden sm:block">{STATUS_LABELS[step]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function OrderCard({ order, index, onCancelled }) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const items = Array.isArray(order.items) ? order.items.filter(Boolean) : [];
  const canCancel = ['pending', 'dispatched'].includes(order.status);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        className="card overflow-hidden"
      >
        <div
          className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-ink-50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center shrink-0">
              <Package size={18} className="text-ink-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-ink-950 text-sm">Order #{order.id}</span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${
                  STATUS_COLORS[order.status] || 'bg-ink-50 text-ink-700 border-ink-200'
                }`}>
                  {order.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-ink-400 mt-0.5">
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
                {' · '}{items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canCancel && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowCancelModal(true); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-red-100"
              >
                <X size={12} /> Cancel
              </button>
            )}
            <span className="font-bold text-ink-950">{formatPrice(order.total_amount)}</span>
            {expanded ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-ink-100 px-5 pb-5">
                <OrderTimeline status={order.status} />

                {/* Cancelled reason */}
                {order.status === 'cancelled' && order.cancel_reason && (
                  <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs font-semibold text-red-600 mb-1">Cancellation Reason</p>
                    <p className="text-sm text-red-700">{order.cancel_reason}</p>
                  </div>
                )}

                {/* Items */}
                {items.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name}
                            className="w-12 h-12 rounded-lg object-cover bg-ink-50" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-800 truncate">{item.product_name}</p>
                          <p className="text-xs text-ink-400">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-400 mt-4">No item details available</p>
                )}

                {/* Shipping address */}
                {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-ink-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={13} className="text-ink-400" />
                      <p className="text-xs font-semibold text-ink-600 uppercase tracking-wider">Shipped To</p>
                    </div>
                    <div className="text-sm text-ink-700 space-y-0.5">
                      <p className="font-medium">{order.shipping_address.name}</p>
                      {order.shipping_address.phone && <p className="text-ink-500">{order.shipping_address.phone}</p>}
                      <p>{order.shipping_address.address}</p>
                      <p>{order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.zip}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showCancelModal && (
          <CancelModal
            order={order}
            onClose={() => setShowCancelModal(false)}
            onCancelled={onCancelled}
          />
        )}
      </AnimatePresence>
    </>
  );
}


export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancelled = (orderId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'cancelled' } : o
    ));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-title mb-10"
      >
        My Orders
      </motion.h1>

      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-ink-100" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-ink-100 rounded w-32" />
                  <div className="h-3 bg-ink-100 rounded w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={56} className="text-ink-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ink-800 mb-2">No orders yet</h3>
          <p className="text-ink-400 mb-6">When you place an order, it'll show up here.</p>
          <a href="/products" className="btn-primary">Start Shopping</a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} onCancelled={handleCancelled} />
          ))}
        </div>
      )}
    </div>
  );
}