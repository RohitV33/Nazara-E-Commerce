import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Save, Loader, CheckCircle,
  Package, LogOut, MapPin, Plus, Pencil, Trash2, X, Home, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import AddressForm from '../components/common/AddressForm';

function AddressModal({ address, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-lg font-semibold text-ink-950">
            {address?.id ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <AddressForm
            address={address}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </motion.div>
    </div>
  );
}


export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const { data } = await api.get('/addresses');
      setAddresses(data);
    } catch {}
    finally { setLoadingAddresses(false); }
  };

  useEffect(() => {
    if (activeTab === 'addresses') fetchAddresses();
  }, [activeTab]);

  const handleDeleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted');
      fetchAddresses();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      toast.success('Default address updated');
      fetchAddresses();
    } catch { toast.error('Failed to set default'); }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', profileForm);
      localStorage.setItem('user', JSON.stringify({ ...user, name: profileForm.name, avatar: profileForm.avatar }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwordForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPassword(false); }
  };

  const avatarUrl = profileForm.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=0d0d12&color=fff&size=128`;

  const tabs = [
    { id: 'profile',   icon: User,   label: 'Edit Profile' },
    { id: 'addresses', icon: MapPin, label: 'Saved Addresses' },
    { id: 'password',  icon: Lock,   label: 'Change Password' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-title mb-10">
        My Account
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="card p-6 text-center">
            <img src={avatarUrl} alt={user?.name}
              className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-ink-100" />
            <p className="font-semibold text-ink-950">{user?.name}</p>
            <p className="text-sm text-ink-400 truncate">{user?.email}</p>
            {user?.is_verified && (
              <div className="flex items-center justify-center gap-1 mt-2">
                <CheckCircle size={13} className="text-green-500" />
                <span className="text-xs text-green-600 font-medium">Verified</span>
              </div>
            )}
            <span className="inline-block mt-2 px-2.5 py-0.5 bg-ink-100 text-ink-700 text-xs rounded-full capitalize font-medium">
              {user?.role}
            </span>
          </div>

          <div className="card overflow-hidden">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-ink-50 last:border-0 ${
                  activeTab === id ? 'bg-ink-950 text-white' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-950'
                }`}>
                <Icon size={16} /> {label}
              </button>
            ))}
            <Link to="/orders" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-950 transition-colors border-t border-ink-100">
              <Package size={16} /> My Orders
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-t border-ink-100">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-2">

          {/* ── EDIT PROFILE ── */}
          {activeTab === 'profile' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center">
                  <User size={18} className="text-ink-700" />
                </div>
                <div>
                  <h2 className="font-semibold text-ink-950">Edit Profile</h2>
                  <p className="text-xs text-ink-400">Update your personal information</p>
                </div>
              </div>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-1.5 block">Full Name</label>
                  <input className="input-field" placeholder="Your name" value={profileForm.name}
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <input className="input-field pl-10 opacity-60 cursor-not-allowed" value={user?.email} disabled />
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  </div>
                  <p className="text-xs text-ink-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-1.5 block">Avatar URL <span className="text-ink-400">(optional)</span></label>
                  <input className="input-field" placeholder="https://example.com/avatar.jpg"
                    value={profileForm.avatar} onChange={e => setProfileForm({...profileForm, avatar: e.target.value})} />
                  {profileForm.avatar && (
                    <img src={profileForm.avatar} alt="avatar preview"
                      className="w-12 h-12 rounded-full mt-2 object-cover border-2 border-ink-100"
                      onError={e => e.target.style.display='none'} />
                  )}
                </div>
                <button type="submit" disabled={savingProfile} className="btn-primary">
                  {savingProfile ? <><Loader size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
                </button>
              </form>
            </div>
          )}

          {/* ── SAVED ADDRESSES ── */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-ink-950 text-lg">Saved Addresses</h2>
                  <p className="text-xs text-ink-400 mt-0.5">Manage your delivery addresses</p>
                </div>
                <button onClick={() => { setEditingAddress(null); setShowAddressModal(true); }} className="btn-primary">
                  <Plus size={16} /> Add New Address
                </button>
              </div>

              {loadingAddresses ? (
                <div className="flex items-center justify-center h-32">
                  <Loader size={24} className="animate-spin text-ink-400" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="card p-10 text-center">
                  <MapPin size={32} className="text-ink-300 mx-auto mb-3" />
                  <p className="font-medium text-ink-600 mb-1">No saved addresses</p>
                  <p className="text-sm text-ink-400 mb-4">Add an address for faster checkout</p>
                  <button onClick={() => { setEditingAddress(null); setShowAddressModal(true); }} className="btn-primary mx-auto">
                    <Plus size={16} /> Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <motion.div key={addr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`card p-5 relative ${addr.is_default ? 'ring-2 ring-ink-950' : ''}`}>
                      {addr.is_default && (
                        <span className="absolute top-4 right-4 flex items-center gap-1 text-xs font-semibold bg-ink-950 text-white px-2.5 py-1 rounded-full">
                          <Star size={10} fill="currentColor" /> Default
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-ink-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Home size={16} className="text-ink-600" />
                        </div>
                        <div className="flex-1 min-w-0 pr-20">
                          <p className="font-semibold text-ink-950">{addr.name}</p>
                          <p className="text-sm text-ink-500 mt-0.5">{addr.phone}</p>
                          <p className="text-sm text-ink-600 mt-1 leading-relaxed">
                            {addr.flat}, {addr.area}
                            {addr.landmark ? `, Near ${addr.landmark}` : ''}
                          </p>
                          <p className="text-sm text-ink-500">{addr.city}, {addr.state} — {addr.zip}</p>
                          <p className="text-xs text-ink-400 mt-0.5">{addr.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ink-100">
                        {!addr.is_default && (
                          <button onClick={() => handleSetDefault(addr.id)}
                            className="text-xs text-ink-600 hover:text-ink-950 font-medium transition-colors">
                            Set as Default
                          </button>
                        )}
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => { setEditingAddress(addr); setShowAddressModal(true); }}
                            className="p-2 text-ink-400 hover:text-ink-950 hover:bg-ink-100 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteAddress(addr.id)}
                            className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CHANGE PASSWORD ── */}
          {activeTab === 'password' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center">
                  <Lock size={18} className="text-ink-700" />
                </div>
                <div>
                  <h2 className="font-semibold text-ink-950">Change Password</h2>
                  <p className="text-xs text-ink-400">Keep your account secure</p>
                </div>
              </div>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-1.5 block">Current Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input-field"
                    placeholder="Your current password" value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-1.5 block">New Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input-field"
                    placeholder="Min. 6 characters" value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} required minLength={6} />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-1.5 block">Confirm New Password</label>
                  <input type={showPasswords ? 'text' : 'password'} className="input-field"
                    placeholder="Re-enter new password" value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showPasswords}
                    onChange={e => setShowPasswords(e.target.checked)} className="w-4 h-4 rounded accent-ink-900" />
                  <span className="text-sm text-ink-600">Show passwords</span>
                </label>
                <button type="submit" disabled={savingPassword || passwordForm.newPassword !== passwordForm.confirmPassword} className="btn-primary">
                  {savingPassword ? <><Loader size={14} className="animate-spin" /> Changing...</> : <><Lock size={14} /> Change Password</>}
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddressModal && (
          <AddressModal
            address={editingAddress}
            onClose={() => { setShowAddressModal(false); setEditingAddress(null); }}
            onSave={() => { setShowAddressModal(false); setEditingAddress(null); fetchAddresses(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}