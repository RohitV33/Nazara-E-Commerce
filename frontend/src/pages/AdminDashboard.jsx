import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from "../utils/price";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  DollarSign, Plus, Pencil, Trash2, X, Loader,
  TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Products', 'Orders'];

//Stat Card 
function StatCard({ icon: Icon, label, value, color, sub, trend, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-ink-950 font-mono">{value}</p>
      <p className="text-sm text-ink-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

//Revenue Chart 
function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 bg-ink-50 rounded-2xl text-ink-400 text-sm mt-4">
        No revenue data for the last 7 days
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => parseFloat(d.revenue || 0)), 1);

  return (
    <div className="mt-4 bg-ink-50 rounded-2xl p-4 pt-6">
      <div className="flex items-end gap-3 h-40">
        {data.map((d, i) => {
          const height = Math.max((parseFloat(d.revenue || 0) / maxRevenue) * 85, 4);
          const date = new Date(d.date);
          const label = date.toLocaleDateString('en-IN', { weekday: 'short' });
          return (
            <motion.div
              key={d.date}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
              className="group relative flex-1 flex flex-col justify-end"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-ink-950 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="font-medium">{formatPrice(parseFloat(d.revenue))}</p>
                <p className="text-ink-400">{d.orders} orders</p>
              </div>
              <div className="w-full bg-ink-700 rounded-t-xl hover:bg-gold-500 transition-all duration-200 cursor-default" style={{ height: '100%' }} />
              <p className="text-xs text-ink-500 text-center mt-2 font-medium">{label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

//Top Products Chart
function TopProductsChart({ products }) {
  if (!products || products.length === 0) return null;
  const max = Math.max(...products.map(p => p.total_sold || 0), 1);

  return (
    <div className="space-y-3 mt-4">
      {products.map((p, i) => (
        <motion.div
          key={p.product_name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-3"
        >
          <span className="text-xs font-mono text-ink-400 w-4">{i + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-ink-800 truncate max-w-[200px]">{p.product_name}</span>
              <span className="text-ink-500 ml-2 shrink-0">{p.total_sold} sold</span>
            </div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(p.total_sold / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="h-full bg-ink-950 rounded-full"
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-ink-700 w-24 text-right">
            {formatPrice(parseFloat(p.total_revenue))}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

//Product Modal 
function ProductModal({ product, categories, onClose, onSave }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    original_price: product?.original_price || '',
    category_id: product?.category_id || '',
    image_url: product?.image_url || '',
    stock: product?.stock ?? 0,
    is_featured: product?.is_featured || false,
    tags: Array.isArray(product?.tags) ? product.tags.join(', ') : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        stock: parseInt(form.stock),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: form.image_url ? [form.image_url] : [],
      };
      if (isEdit) {
        await api.put(`/products/${product.id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-ink-50 rounded-full"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-600 mb-1.5 block">Product Name *</label>
            <input className="input-field" placeholder="e.g. Wireless Headphones Pro" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600 mb-1.5 block">Description</label>
            <textarea className="input-field resize-none h-24" placeholder="Describe the product..."
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-600 mb-1.5 block">Price *</label>
              <input type="number" step="0.01" className="input-field" placeholder="299"
                value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600 mb-1.5 block">Original Price</label>
              <input type="number" step="0.01" className="input-field" placeholder="399"
                value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-600 mb-1.5 block">Category</label>
              <select className="input-field" value={form.category_id}
                onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600 mb-1.5 block">Stock</label>
              <input type="number" className="input-field" placeholder="0"
                value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600 mb-1.5 block">Image URL</label>
            <input className="input-field" placeholder="https://images.unsplash.com/..."
              value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
            {form.image_url && (
              <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden border border-ink-100">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover"
                  onError={e => e.target.style.display='none'} />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600 mb-1.5 block">Tags (comma-separated)</label>
            <input className="input-field" placeholder="wireless, audio, premium"
              value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured}
              onChange={e => setForm({...form, is_featured: e.target.checked})}
              className="w-4 h-4 rounded accent-ink-900" />
            <span className="text-sm text-ink-700 font-medium">Featured product</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Loader size={14} className="animate-spin" /> Saving...</> : isEdit ? 'Update' : 'Create Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

//Main Dashboard 
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const STATUS_COLORS = {
    pending:          'bg-yellow-50 text-yellow-700',
    dispatched:       'bg-blue-50 text-blue-700',
    out_for_delivery: 'bg-purple-50 text-purple-700',
    delivered:        'bg-green-50 text-green-700',
    cancelled:        'bg-red-50 text-red-700',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes, catsRes] = await Promise.all([
        api.get('/orders/admin/stats'),
        api.get('/products?limit=200'),
        api.get('/orders/admin/all'),
        api.get('/products/categories'),
      ]);
      setStats(statsRes.data);
      setProducts(productsRes.data.products || []);
      setFilteredProducts(productsRes.data.products || []);
      setOrders(ordersRes.data);
      setCategories(catsRes.data);

      try {
        const topRes = await api.get('/orders/admin/top-products');
        setTopProducts(topRes.data);
      } catch { /* optional */ }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!productSearch.trim()) {
      setFilteredProducts(products);
    } else {
      const q = productSearch.toLowerCase();
      setFilteredProducts(products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category_name || '').toLowerCase().includes(q)
      ));
    }
  }, [productSearch, products]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchData();
    } catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Status updated');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="min-h-screen bg-ink-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-950">Admin Dashboard</h1>
            <p className="text-sm text-ink-400 mt-0.5">Manage your store</p>
          </div>
          {activeTab === 1 && (
            <button onClick={() => { setModalProduct(null); setShowModal(true); }} className="btn-primary">
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl p-1.5 w-fit mb-8 shadow-sm border border-ink-100">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === i ? 'bg-ink-950 text-white shadow-sm' : 'text-ink-600 hover:text-ink-950 hover:bg-ink-50'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center h-64">
            <Loader size={32} className="animate-spin text-ink-400" />
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 0 && (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard index={0} icon={DollarSign} label="Total Revenue"
                    value={formatPrice(stats?.total_revenue)}
                    color="bg-green-50 text-green-700" trend={12} />
                  <StatCard index={1} icon={ShoppingCart} label="Total Orders"
                    value={stats?.total_orders || 0}
                    color="bg-blue-50 text-blue-700" trend={8} />
                  <StatCard index={2} icon={Package} label="Products"
                    value={stats?.total_products || 0}
                    color="bg-purple-50 text-purple-700" />
                  <StatCard index={3} icon={Users} label="Customers"
                    value={stats?.total_users || 0}
                    color="bg-orange-50 text-orange-700" trend={5} />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 card p-6 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-ink-950">Revenue — Last 7 Days</h3>
                      <span className="text-xs text-ink-400 bg-ink-50 px-2.5 py-1 rounded-full">
                        {formatPrice((stats?.dailyRevenue || []).reduce((s, d) => s + parseFloat(d.revenue || 0), 0))} total
                      </span>
                    </div>
                    <RevenueChart data={stats?.dailyRevenue || []} />
                  </div>

                  {/* Order Status Breakdown */}
                  <div className="card p-6">
                    <h3 className="font-semibold text-ink-950 mb-4">Order Status</h3>
                    {(() => {
                      const statusCount = {};
                      (orders || []).forEach(o => {
                        statusCount[o.status] = (statusCount[o.status] || 0) + 1;
                      });
                      const total = Object.values(statusCount).reduce((a, b) => a + b, 0) || 1;
                      const colors = {
                        pending:          'bg-yellow-400',
                        dispatched:       'bg-blue-400',
                        out_for_delivery: 'bg-purple-400',
                        delivered:        'bg-green-400',
                        cancelled:        'bg-red-400',
                      };
                      return (
                        <div className="space-y-3">
                          {Object.entries(statusCount).map(([status, count]) => (
                            <div key={status} className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-ink-400'}`} />
                              <span className="text-sm text-ink-700 capitalize flex-1">{status.replace(/_/g, ' ')}</span>
                              <span className="text-sm font-semibold text-ink-950">{count}</span>
                              <div className="w-20 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(count / total) * 100}%` }}
                                  transition={{ duration: 0.6 }}
                                  className={`h-full rounded-full ${colors[status] || 'bg-ink-400'}`}
                                />
                              </div>
                            </div>
                          ))}
                          {Object.keys(statusCount).length === 0 && (
                            <p className="text-sm text-ink-400 text-center py-4">No orders yet</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp size={18} className="text-ink-600" />
                    <h3 className="font-semibold text-ink-950">Recent Orders</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-ink-100">
                          {['Order', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                            <th key={h} className="pb-3 text-xs font-semibold text-ink-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-50">
                        {(stats?.recentOrders || []).map((order) => (
                          <tr key={order.id} className="hover:bg-ink-50">
                            <td className="py-3 font-mono text-ink-700">#{order.id}</td>
                            <td className="py-3">
                              <div className="font-medium text-ink-900">{order.name}</div>
                              <div className="text-xs text-ink-400">{order.email}</div>
                            </td>
                            <td className="py-3 font-semibold">{formatPrice(order.total_amount)}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] || 'bg-ink-50 text-ink-700'}`}>
                                {order.status?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 text-ink-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                        {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                          <tr><td colSpan={5} className="py-8 text-center text-ink-400 text-sm">No orders yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── PRODUCTS TAB ── */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="card p-3 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search products by name or category..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="flex-1 outline-none text-sm text-ink-900 placeholder-ink-400 bg-transparent"
                  />
                  {productSearch && (
                    <button onClick={() => setProductSearch('')} className="text-ink-400 hover:text-ink-700">
                      <X size={16} />
                    </button>
                  )}
                  <span className="text-xs text-ink-400 shrink-0">{filteredProducts.length} products</span>
                </div>

                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-ink-50 border-b border-ink-100">
                        <tr>
                          {['Product', 'Category', 'Price', 'Stock', 'Rating', ''].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-50">
                        {filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-ink-50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <img src={p.image_url} alt={p.name}
                                  className="w-10 h-10 rounded-lg object-cover bg-ink-100" />
                                <div>
                                  <div className="font-medium text-ink-900 max-w-[180px] truncate">{p.name}</div>
                                  {p.is_featured && <span className="text-xs text-gold-600 font-medium">★ Featured</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-ink-500 text-xs">{p.category_name || '—'}</td>
                            <td className="px-5 py-3 font-semibold">{formatPrice(p.price)}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                p.stock === 0 ? 'bg-red-50 text-red-600'
                                : p.stock < 10 ? 'bg-yellow-50 text-yellow-600'
                                : 'bg-green-50 text-green-600'
                              }`}>
                                {p.stock === 0 ? 'Out of stock' : p.stock}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-ink-500 text-xs">⭐ {Number(p.rating).toFixed(1)}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setModalProduct(p); setShowModal(true); }}
                                  className="p-2 text-ink-400 hover:text-ink-950 hover:bg-ink-100 rounded-lg transition-colors">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDelete(p.id)}
                                  className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                          <tr><td colSpan={6} className="py-12 text-center text-ink-400">No products found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === 2 && (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50 border-b border-ink-100">
                      <tr>
                        {['Order', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-ink-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-50">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-ink-50 transition-colors">
                          <td className="px-5 py-3 font-mono text-ink-700">#{order.id}</td>
                          <td className="px-5 py-3">
                            <div className="font-medium text-ink-900">{order.user_name}</div>
                            <div className="text-xs text-ink-400">{order.user_email}</div>
                          </td>
                          <td className="px-5 py-3 font-semibold">{formatPrice(order.total_amount)}</td>
                          <td className="px-5 py-3">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none capitalize ${STATUS_COLORS[order.status] || 'bg-ink-50 text-ink-700'}`}
                            >
                              {['pending','dispatched','out_for_delivery','delivered','cancelled'].map(s => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-3 text-ink-400">
                            {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={5} className="py-12 text-center text-ink-400">No orders yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={modalProduct}
            categories={categories}
            onClose={() => { setShowModal(false); setModalProduct(null); }}
            onSave={() => { setShowModal(false); setModalProduct(null); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}