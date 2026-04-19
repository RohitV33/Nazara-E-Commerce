import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, Star, Shield, Truck, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeletons';


function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={ref} className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden flex items-center">
      {/* Background image with parallax */}
      <motion.div style={{ y, scale }} className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&q=80"
          alt="hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/70 via-ink-950/30 to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-300 text-xs font-medium tracking-widest uppercase mb-6">
              ✦ New Collection 2025
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-semibold text-white leading-[1.05] mb-6">
              Crafted for<br />
              <em className="text-gold-400 not-italic">those who</em><br />
              demand more.
            </h1>
            <p className="text-ink-200 text-lg mb-8 max-w-md leading-relaxed">
              Discover premium products curated from the world's finest makers. Quality isn't a feature—it's the foundation.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/products" className="btn-primary bg-white text-ink-950 hover:bg-ink-100 px-8 py-3.5">
                Shop Now
                <ArrowRight size={16} />
              </Link>
              <Link to="/products?featured=true" className="btn-outline border-white text-white hover:bg-white hover:text-ink-950 px-8 py-3.5">
                Featured Picks
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center gap-8 mt-14 pt-8 border-t border-white/20"
          >
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '2K+', label: 'Premium Products' },
              { value: '4.9', label: 'Avg. Rating' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-semibold text-white font-mono">{stat.value}</div>
                <div className="text-xs text-ink-300 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5"
      >
        <span className="text-white/50 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/50 to-transparent" />
      </motion.div>
    </section>
  );
}


function CategorySection() {
  const categories = [
    { name: 'Electronics', slug: 'electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format' },
    { name: 'Fashion', slug: 'fashion', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format' },
    { name: 'Home & Living', slug: 'home-living', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&auto=format' },
    { name: 'Sports', slug: 'sports', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format' },
    { name: 'Beauty', slug: 'beauty', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format' },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="text-xs text-gold-600 font-medium tracking-widest uppercase">Browse by</span>
          <h2 className="section-title mt-1">Categories</h2>
        </div>
        <Link to="/products" className="hidden sm:flex items-center gap-1 text-sm text-ink-600 hover:text-ink-950 font-medium transition-colors">
          View All <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link
              to={`/products?category=${cat.slug}`}
              className="group relative block aspect-[3/4] rounded-2xl overflow-hidden"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <span className="text-white font-semibold text-sm">{cat.name}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}


function FeaturesBar() {
  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over ?00' },
    { icon: Shield, title: 'Secure Checkout', desc: '256-bit SSL encryption' },
    { icon: RefreshCw, title: 'Easy Returns', desc: '30-day hassle-free returns' },
    { icon: Star, title: 'Top Rated', desc: '4.9 avg customer rating' },
  ];

  return (
    <section className="border-y border-ink-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center shrink-0">
                <f.icon size={18} className="text-ink-700" />
              </div>
              <div>
                <p className="font-semibold text-sm text-ink-900">{f.title}</p>
                <p className="text-xs text-ink-400 mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


function MarqueeBanner() {
  const items = ['New Arrivals', 'Free Shipping Over ₹5000', 'Premium Quality', 'Curated Selection', 'Secure Payments', 'Easy Returns'];
  return (
    <div className="bg-ink-950 text-gold-400 py-3 overflow-hidden">
      <motion.div
        animate={{ x: [0, -1200] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="flex items-center gap-8 whitespace-nowrap"
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-4 text-xs font-medium tracking-widest uppercase">
            {item}
            <span className="w-1 h-1 rounded-full bg-gold-500" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}


export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    api.get('/products/featured')
      .then(({ data }) => setFeatured(data))
      .catch(console.error)
      .finally(() => setLoadingFeatured(false));
  }, []);

  return (
    <div>
      <HeroSection />
      <MarqueeBanner />
      <CategorySection />
      <FeaturesBar />

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs text-gold-600 font-medium tracking-widest uppercase">Hand-picked</span>
            <h2 className="section-title mt-1">Featured Products</h2>
          </div>
          <Link to="/products?featured=true" className="hidden sm:flex items-center gap-1 text-sm text-ink-600 hover:text-ink-950 font-medium transition-colors">
            See All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingFeatured
            ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
          }
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&auto=format&q=80"
              alt="sale"
              className="w-full h-72 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 to-transparent flex items-center">
              <div className="px-10 md:px-16 max-w-lg">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-gold-400 text-xs font-medium tracking-widest uppercase">Limited Time</span>
                  <h2 className="font-display text-4xl md:text-5xl text-white font-semibold mt-2 mb-4">
                    Up to 40% off<br />selected styles
                  </h2>
                  <Link to="/products?sort=price-asc" className="btn-primary bg-white text-ink-950 hover:bg-ink-100">
                    Shop the Sale
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
