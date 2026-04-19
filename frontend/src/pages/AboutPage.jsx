import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Leaf, Shield, Star } from 'lucide-react';

const values = [
  { icon: Star, title: 'Quality First', desc: 'Every product is hand-picked and tested to meet our high standards before it reaches you.' },
  { icon: Heart, title: 'Customer Love', desc: 'We obsess over customer experience. Your satisfaction is the only metric that truly matters.' },
  { icon: Leaf, title: 'Sustainability', desc: 'We partner with brands that share our commitment to ethical sourcing and eco-friendly practices.' },
  { icon: Shield, title: 'Trust & Safety', desc: 'Your data, payments, and privacy are protected with industry-leading security standards.' },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&q=80"
            alt="about" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-ink-950/60" />
        </motion.div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="text-gold-400 text-xs font-medium tracking-widest uppercase">Our Story</span>
            <h1 className="font-display text-5xl md:text-7xl text-white font-semibold mt-3 mb-4 leading-tight">
              We are<br /><em className="text-gold-400 not-italic">NAZARA</em>
            </h1>
            <p className="text-ink-200 text-lg max-w-xl leading-relaxed">
              A curated marketplace built on the belief that quality and beauty should be accessible to everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-xs text-gold-600 font-medium tracking-widest uppercase">Our Mission</span>
            <h2 className="section-title mt-2 mb-6">Crafted for those<br />who demand more.</h2>
            <p className="text-ink-600 leading-relaxed mb-4 text-lg">
              NAZARA was founded in 2024 with a simple idea — the best products in the world should be easy to discover, easy to buy, and worth every rupee.
            </p>
            <p className="text-ink-600 leading-relaxed mb-8">
              We work directly with the finest makers and brands to bring you a selection that is as thoughtfully curated as it is beautiful. Every item in our store has been personally reviewed by our team.
            </p>
            <Link to="/products" className="btn-primary">
              Shop Our Collection <ArrowRight size={16} />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="grid grid-cols-2 gap-4">
            {[
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format',
              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format',
              'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&auto=format',
              'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format',
            ].map((img, i) => (
              <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? 'row-span-2' : ''}`}>
                <img src={img} alt="" className="w-full h-full object-cover" style={{ height: i === 0 ? '100%' : '160px' }} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-ink-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '2K+', label: 'Premium Products' },
              { value: '100+', label: 'Top Brands' },
              { value: '4.9★', label: 'Average Rating' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p className="font-mono text-4xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-ink-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="text-xs text-gold-600 font-medium tracking-widest uppercase">What We Stand For</span>
          <h2 className="section-title mt-2">Our Values</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
                <v.icon size={22} className="text-ink-700" />
              </div>
              <h3 className="font-semibold text-ink-950 mb-2">{v.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="section-title mb-4">Ready to explore?</h2>
          <p className="text-ink-500 mb-8 max-w-md mx-auto">Discover our carefully curated collection of premium products.</p>
          <Link to="/products" className="btn-primary px-10 py-4 text-base">
            Shop Now <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
