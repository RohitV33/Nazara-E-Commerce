import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-300 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link to="/" className="font-display text-3xl text-white font-semibold">NAZARA</Link>
            <p className="mt-3 text-sm text-ink-400 leading-relaxed">
              Premium products, curated for those who appreciate quality.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Instagram, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-ink-800 flex items-center justify-center hover:bg-gold-500 hover:text-ink-950 transition-all duration-200">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: 'Shop',
              links: [
                { label: 'All Products', href: '/products' },
                { label: 'Electronics', href: '/products?category=electronics' },
                { label: 'Fashion', href: '/products?category=fashion' },
                { label: 'Home & Living', href: '/products?category=home-living' },
              ],
            },
            {
              title: 'Account',
              links: [
                { label: 'Sign In', href: '/login' },
                { label: 'My Orders', href: '/orders' },
                { label: 'Shopping Cart', href: '/cart' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About Us', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Sustainability', href: '/sustainability' },
                { label: 'Careers', href: '/careers' },
                { label: 'Press', href: '/press' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-ink-400 hover:text-white transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-ink-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-500">© {new Date().getFullYear()} NAZARA. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-ink-500 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs text-ink-500 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-xs text-ink-500 hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
