import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, Loader, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const faqs = [
  { q: 'How long does shipping take?', a: 'Standard delivery takes 3-5 business days. Express delivery (1-2 days) is available at checkout.' },
  { q: 'What is your return policy?', a: 'We offer hassle-free 30-day returns. Items must be unused and in original packaging.' },
  { q: 'Is my payment information secure?', a: 'Yes! All payments are processed with 256-bit SSL encryption. We never store card details.' },
  { q: 'Can I track my order?', a: 'Yes, once your order ships you will receive a tracking number via email.' },
  { q: 'Do you ship internationally?', a: 'Currently we ship within India. International shipping is coming soon!' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      toast.success("Message sent! We'll reply within 24 hours.");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-20">
      {/* Hero */}
      <div className="bg-ink-950 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-gold-400 text-xs font-medium tracking-widest uppercase">Get In Touch</span>
          <h1 className="font-display text-5xl md:text-6xl text-white font-semibold mt-3">Contact Us</h1>
          <p className="text-ink-400 mt-4 text-lg max-w-md mx-auto">
            We're here to help. Reach out and we'll respond within 24 hours.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Contact Info */}
          <div className="space-y-5">
            <h2 className="font-semibold text-xl text-ink-950 mb-6">Contact Information</h2>
            {[
              { icon: Mail, title: 'Email Us', value: 'support@nazara.com', sub: 'Reply within 24 hours' },
              { icon: Phone, title: 'Call Us', value: '+91 98765 43210', sub: 'Mon-Sat, 10am - 6pm' },
              { icon: MapPin, title: 'Visit Us', value: 'Connaught Place, New Delhi', sub: 'Delhi, India 110001' },
              { icon: Clock, title: 'Working Hours', value: 'Mon - Saturday', sub: '10:00 AM – 6:00 PM IST' },
            ].map(({ icon: Icon, title, value, sub }) => (
              <motion.div key={title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} className="card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-ink-700" />
                </div>
                <div>
                  <p className="font-semibold text-ink-950 text-sm">{title}</p>
                  <p className="text-ink-700 text-sm mt-0.5">{value}</p>
                  <p className="text-ink-400 text-xs mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              {sent ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12">
                  <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-ink-950 mb-2">Message Sent!</h3>
                  <p className="text-ink-500 mb-6">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="btn-outline">Send Another Message</button>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-semibold text-xl text-ink-950 mb-6">Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-ink-600 mb-1.5 block">Your Name *</label>
                        <input className="input-field" placeholder="Rohit Sharma"
                          value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-ink-600 mb-1.5 block">Email Address *</label>
                        <input type="email" className="input-field" placeholder="rohit@example.com"
                          value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-600 mb-1.5 block">Subject *</label>
                      <select className="input-field" value={form.subject}
                        onChange={e => setForm({...form, subject: e.target.value})} required>
                        <option value="">Select a topic</option>
                        <option>Order Issue</option>
                        <option>Return / Refund</option>
                        <option>Product Query</option>
                        <option>Payment Problem</option>
                        <option>Shipping Delay</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-600 mb-1.5 block">Message *</label>
                      <textarea className="input-field resize-none h-36"
                        placeholder="Describe your issue or query in detail..."
                        value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                        required minLength={5} />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading
                        ? <><Loader size={16} className="animate-spin" /> Sending...</>
                        : <><Send size={16} /> Send Message</>
                      }
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <span className="text-xs text-gold-600 font-medium tracking-widest uppercase">Common Questions</span>
            <h2 className="section-title mt-2">FAQs</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-ink-50 transition-colors">
                  <span className="font-medium text-ink-900 text-sm">{faq.q}</span>
                  <span className={`text-ink-400 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                    className="px-5 pb-5 text-sm text-ink-600 leading-relaxed border-t border-ink-100 pt-3">
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}