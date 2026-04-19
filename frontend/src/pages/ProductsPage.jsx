import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeletons';
import { formatPrice } from "../utils/price";

const SORT_OPTIONS = [
  { value: '', label: 'Recommended' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ProductsPage({ onProductsLoad }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '';
  const featured = searchParams.get('featured') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      if (featured) params.set('featured', featured);
      params.set('page', page);
      params.set('limit', '12');

      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products);
      setPagination(data.pagination);
      if (onProductsLoad) onProductsLoad(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, featured, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data)).catch(console.error);
  }, []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = category || search || sort || featured;

  const pageTitle = search
    ? `Search: "${search}"`
    : category
    ? categories.find(c => c.slug === category)?.name || 'Products'
    : featured
    ? 'Featured Products'
    : 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-title"
        >
          {pageTitle}
        </motion.h1>
        {pagination.total !== undefined && (
          <p className="text-ink-400 text-sm mt-2">{pagination.total} products found</p>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="sm:hidden flex items-center gap-2 btn-outline py-2 px-4 text-xs"
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>

        {/* Category filters (desktop) */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          <button
            onClick={() => updateParam('category', '')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              !category ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                category === cat.slug ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="appearance-none pl-4 pr-8 py-2 bg-white border border-ink-200 rounded-full text-xs font-medium text-ink-700 cursor-pointer focus:outline-none focus:border-ink-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-ink-500 hover:text-red-500 transition-colors">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Mobile filters */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden overflow-hidden mb-6"
          >
            <div className="flex flex-wrap gap-2 py-2">
              <button
                onClick={() => updateParam('category', '')}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  !category ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { updateParam('category', cat.slug); setFiltersOpen(false); }}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    category === cat.slug ? 'bg-ink-950 text-white' : 'bg-ink-100 text-ink-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search indicator */}
      {search && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-ink-600">Results for</span>
          <span className="bg-ink-100 px-3 py-1 rounded-full text-sm font-medium text-ink-800">
            "{search}"
          </span>
          <button onClick={() => updateParam('search', '')} className="text-ink-400 hover:text-red-500">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-semibold text-ink-800 mb-2">No products found</h3>
          <p className="text-ink-400 mb-6">Try adjusting your search or filters</p>
          <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('page', p);
                setSearchParams(next);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                p === page
                  ? 'bg-ink-950 text-white'
                  : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
