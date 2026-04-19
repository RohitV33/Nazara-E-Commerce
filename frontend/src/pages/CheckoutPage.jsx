import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, MapPin, CheckCircle, Loader, ShieldCheck, Plus, Home, Star, Pencil } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/price';
import AddressForm from '../components/common/AddressForm';

const STEPS = ['Shipping', 'Payment', 'Confirm'];

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) { resolve(true); return; }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, refetch } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const { items, total } = cart;
  const subtotal = total;
  const shippingCost = subtotal >= 999 ? 0 : 49;
  const grandTotal = +(subtotal + shippingCost).toFixed(2);

  // Fetch saved addresses
  useEffect(() => {
    if (!isAuthenticated) { setShowNewForm(true); setLoadingAddresses(false); return; }
    api.get('/addresses').then(({ data }) => {
      setSavedAddresses(data);
      const def = data.find(a => a.is_default);
      if (def) { setSelectedAddressId(def.id); setShowNewForm(false); }
      else if (data.length === 0) setShowNewForm(true);
      else setSelectedAddressId(data[0].id);
    }).catch(() => setShowNewForm(true))
    .finally(() => setLoadingAddresses(false));
  }, [isAuthenticated]);

  const getActiveAddress = () => {
    if (!showNewForm && selectedAddressId) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      if (addr) return {
        name: addr.name, phone: addr.phone,
        address: `${addr.flat}, ${addr.area}${addr.landmark ? ', Near ' + addr.landmark : ''}`,
        city: addr.city, state: addr.state, zip: addr.zip, country: addr.country,
      };
    }
    return null;
  };

  const handleAddressSaved = (savedAddr) => {
    setSavedAddresses(prev => {
      const exists = prev.find(a => a.id === savedAddr.id);
      if (exists) return prev.map(a => a.id === savedAddr.id ? savedAddr : a);
      return [savedAddr, ...prev];
    });
    setSelectedAddressId(savedAddr.id);
    setShowNewForm(false);
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    const addr = getActiveAddress();
    if (!addr && !showNewForm) {
      toast.error('Please select or add a delivery address');
      return;
    }
    setStep(1);
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    const activeAddr = getActiveAddress();
    if (!activeAddr) { toast.error('No address selected'); setLoading(false); return; }

    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Failed to load payment gateway.'); setLoading(false); return; }

      const { data } = await api.post('/payment/create-order', { amount: grandTotal, shipping_address: activeAddr });

      const options = {
        key: data.key, amount: data.amount, currency: data.currency,
        name: 'NAZARA', description: 'Order Payment', order_id: data.orderId,
        prefill: { name: activeAddr.name, email: user?.email || '', contact: activeAddr.phone || '' },
        theme: { color: '#0d0d12' },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              shipping_address: activeAddr,
              payment_method: 'razorpay',
            });
            setOrderId(verifyRes.data.orderId);
            await refetch();
            setStep(2);
            toast.success('Payment successful! 🎉');
          } catch { toast.error('Payment verification failed. Contact support.'); }
        },
        modal: { ondismiss: () => { toast.error('Payment cancelled'); setLoading(false); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (res) => { toast.error(`Payment failed: ${res.error.description}`); setLoading(false); });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setLoading(false); }
  };

  // Step 2 — Success
  if (step === 2) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <CheckCircle size={72} className="text-green-500 mx-auto mb-6" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-3xl font-semibold text-ink-950 mb-3">Order Placed! 🎉</h1>
          <p className="text-ink-500 mb-2">Thank you for your purchase.</p>
          <p className="text-sm text-ink-400 mb-8">Order #{orderId}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/orders')} className="btn-primary">View Orders</button>
            <button onClick={() => navigate('/products')} className="btn-outline">Continue Shopping</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <h1 className="section-title mb-8">Checkout</h1>

      {/* Step indicators */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-400'
              }`}>{i < step ? '✓' : i + 1}</div>
              <span className="text-xs text-ink-500 hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 mb-4 mx-1 transition-all ${i < step ? 'bg-green-500' : 'bg-ink-100'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">

          {/* ── Step 0 — Address ── */}
          {step === 0 && (
                    <div className="space-y-4">

              {loadingAddresses ? (
                <div className="card p-8 flex items-center justify-center">
                  <Loader size={24} className="animate-spin text-ink-400" />
                </div>
              ) : (
                <>
                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin size={18} className="text-ink-600" />
                        <h2 className="font-semibold text-ink-950">Select Delivery Address</h2>
                      </div>

                      <div className="space-y-3">
                        {savedAddresses.map((addr) => (
                          <label key={addr.id}
                            className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              selectedAddressId === addr.id && !showNewForm
                                ? 'border-ink-950 bg-ink-50'
                                : 'border-ink-100 hover:border-ink-300'
                            }`}
                          >
                            <input type="radio" name="addr" className="mt-1 accent-ink-900"
                              checked={selectedAddressId === addr.id && !showNewForm}
                              onChange={() => { setSelectedAddressId(addr.id); setShowNewForm(false); }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-ink-950">{addr.name}</p>
                                <p className="text-xs text-ink-500">{addr.phone}</p>
                                {addr.is_default && (
                                  <span className="flex items-center gap-0.5 text-xs bg-ink-950 text-white px-2 py-0.5 rounded-full">
                                    <Star size={9} fill="currentColor" /> Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-ink-600 mt-1">
                                {addr.flat}, {addr.area}
                                {addr.landmark ? `, Near ${addr.landmark}` : ''}
                              </p>
                              <p className="text-sm text-ink-500">{addr.city}, {addr.state} — {addr.zip}</p>
                            </div>
                          </label>
                        ))}

                        {/* Add new option */}
                        <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          showNewForm ? 'border-ink-950 bg-ink-50' : 'border-ink-100 hover:border-ink-300'
                        }`}>
                          <input type="radio" name="addr" className="accent-ink-900"
                            checked={showNewForm}
                            onChange={() => { setShowNewForm(true); setSelectedAddressId(null); }} />
                          <Plus size={16} className="text-ink-600" />
                          <span className="font-medium text-sm text-ink-700">Add a new address</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* New address form */}
                  <AnimatePresence>
                    {showNewForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="card p-6 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 mb-5">
                          <MapPin size={18} className="text-ink-600" />
                          <h2 className="font-semibold text-ink-950">
                            {savedAddresses.length === 0 ? 'Delivery Address' : 'Add New Address'}
                          </h2>
                        </div>
                        <AddressForm
                          address={null}
                          onSave={handleAddressSaved}
                          onCancel={savedAddresses.length > 0 ? () => { setShowNewForm(false); setSelectedAddressId(savedAddresses[0].id); } : undefined}
                          showCancel={savedAddresses.length > 0}
                          submitLabel="Save & Use This Address"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

            {!showNewForm && selectedAddressId && (
                  <button type="button" onClick={handleShippingSubmit} className="btn-primary w-full sm:w-auto">
                    Continue to Payment →
                  </button>
                )}
            </div>
    )}

        
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard size={20} className="text-ink-600" />
                <h2 className="font-semibold text-lg">Payment</h2>
              </div>

         
              {(() => {
                const addr = getActiveAddress();
                return addr ? (
                  <div className="bg-ink-50 rounded-2xl p-4 mb-5 border border-ink-100 flex items-start gap-3">
                    <Home size={16} className="text-ink-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Delivering to</p>
                      <p className="text-sm font-medium text-ink-950">{addr.name} · {addr.phone}</p>
                      <p className="text-sm text-ink-500">{addr.address}, {addr.city}, {addr.state} — {addr.zip}</p>
                    </div>
                    <button onClick={() => setStep(0)} className="text-xs text-blue-500 hover:underline shrink-0">Change</button>
                  </div>
                ) : null;
              })()}

              <div className="bg-ink-50 rounded-2xl p-5 mb-6 border border-ink-100">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheck size={20} className="text-green-600" />
                  <p className="font-medium text-ink-900">Secure Payment via Razorpay</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['💳 Cards', '📱 UPI', '🏦 NetBanking', '👝 Wallets', '📦 EMI'].map(m => (
                    <span key={m} className="text-xs bg-white border border-ink-200 px-2.5 py-1 rounded-full font-medium text-ink-700">{m}</span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-ink-100 p-4 mb-6">
                <h3 className="font-semibold text-ink-950 mb-3 text-sm">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  {items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between text-ink-600">
                      <span className="truncate max-w-[200px]">{item.name} ×{item.quantity}</span>
                      <span className="font-medium ml-2">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  {items.length > 3 && <p className="text-xs text-ink-400">+{items.length - 3} more items</p>}
                  <div className="border-t border-ink-100 pt-2 flex justify-between font-bold text-ink-950">
                    <span>Total</span><span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-outline flex-1">← Back</button>
                <button onClick={handleRazorpayPayment} disabled={loading} className="btn-primary flex-1">
                  {loading ? <><Loader size={16} className="animate-spin" /> Processing...</> : `Pay ${formatPrice(grandTotal)}`}
                </button>
              </div>
              <p className="text-xs text-ink-400 text-center mt-3">🔒 256-bit SSL encrypted · Powered by Razorpay</p>
            </motion.div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="card p-5 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Your Order</h2>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-ink-50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink-900 truncate">{item.name}</p>
                    <p className="text-xs text-ink-400">×{item.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? <span className="text-green-600">Free</span> : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span><span>{formatPrice(grandTotal)}</span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-ink-400 text-center">Free shipping on orders above {formatPrice(999)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}