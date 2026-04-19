import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, Trash2, Edit2, X, Loader } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Star Rating Component
function StarRating({ value, onChange, size = 24, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform duration-100 ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={size}
            className={`transition-colors duration-150 ${
              star <= display
                ? 'fill-gold-500 text-gold-500'
                : 'fill-ink-100 text-ink-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Rating Bar (breakdown)
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-ink-600 w-4 text-right">{star}</span>
      <Star size={12} className="fill-gold-400 text-gold-400 shrink-0" />
      <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 * (6 - star) }}
          className="h-full bg-gold-400 rounded-full"
        />
      </div>
      <span className="text-ink-400 w-6 text-xs">{count}</span>
    </div>
  );
}

// Single Review Card
function ReviewCard({ review, currentUserId, onDelete }) {
  const isOwn = review.user_id === currentUserId;
  const date = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="border-b border-ink-100 pb-5 last:border-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-ink-950 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-medium">
              {review.user_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-ink-900 text-sm">{review.user_name}</p>
            <p className="text-xs text-ink-400">{date}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StarRating value={review.rating} readonly size={14} />
          {isOwn && (
            <button
              onClick={() => onDelete(review.id)}
              className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="mt-3 text-sm text-ink-700 leading-relaxed pl-12">
          {review.comment}
        </p>
      )}
    </motion.div>
  );
}

// Write Review Form
function WriteReview({ productId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setLoading(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, comment });
      toast.success('Review submitted!');
      setRating(0);
      setComment('');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const labels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-ink-50 rounded-2xl p-5 mb-6"
    >
      <h4 className="font-semibold text-ink-950 mb-4">Write a Review</h4>

      <div className="mb-4">
        <label className="text-xs font-medium text-ink-600 mb-2 block">Your Rating *</label>
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} size={28} />
          {rating > 0 && (
            <span className="text-sm font-medium text-gold-600">{labels[rating]}</span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-ink-600 mb-2 block">
          Comment <span className="text-ink-400">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Share your experience with this product..."
          className="input-field resize-none text-sm"
        />
        <p className="text-xs text-ink-400 mt-1 text-right">{comment.length}/1000</p>
      </div>

      <button type="submit" disabled={loading || rating === 0} className="btn-primary">
        {loading ? <><Loader size={14} className="animate-spin" /> Submitting...</> : 'Submit Review'}
      </button>
    </motion.form>
  );
}

// Main ReviewSection
export default function ReviewSection({ productId, rating, reviewCount }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/products/${productId}/reviews`);
      setReviews(data.reviews);
      setBreakdown(data.breakdown);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCanReview = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get(`/products/${productId}/reviews/can-review`);
      setCanReview(data.canReview);
      setHasPurchased(data.hasPurchased);
      setHasReviewed(data.hasReviewed);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchCanReview();
  }, [productId, isAuthenticated]);

  const handleDelete = async (reviewId) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/products/${productId}/reviews/${reviewId}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const totalReviews = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const displayedReviews = showAll ? reviews : reviews.slice(0, 4);

  return (
    <div className="mt-16 max-w-4xl">
      <h2 className="section-title mb-8">
        Reviews
        <span className="ml-3 text-xl font-sans font-normal text-ink-400">
          ({reviewCount || totalReviews})
        </span>
      </h2>

      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 p-6 bg-white rounded-2xl border border-ink-100">
          {/* Average */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="font-mono text-7xl font-bold text-ink-950 leading-none">
              {Number(rating).toFixed(1)}
            </span>
            <StarRating value={Math.round(rating)} readonly size={20} />
            <p className="text-sm text-ink-400 mt-2">{totalReviews} reviews</p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 justify-center flex flex-col">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingBar key={star} star={star} count={breakdown[star]} total={totalReviews} />
            ))}
          </div>
        </div>
      )}

      {/* Write Review */}
      {isAuthenticated && canReview && (
        <WriteReview
          productId={productId}
          onSuccess={() => { fetchReviews(); setCanReview(false); }}
        />
      )}

      {/* Not logged in */}
      {!isAuthenticated && (
        <div className="flex items-center gap-3 bg-ink-50 rounded-2xl p-4 mb-6 border border-ink-100">
          <span className="text-2xl">✍️</span>
          <div>
            <p className="text-sm font-medium text-ink-800">Want to leave a review?</p>
            <p className="text-xs text-ink-500 mt-0.5">
              <a href="/login" className="text-ink-950 font-semibold hover:underline">Sign in</a>
              {' '}and purchase this product to share your experience.
            </p>
          </div>
        </div>
      )}

      {/* Logged in, purchased but already reviewed */}
      {isAuthenticated && hasPurchased && hasReviewed && (
        <div className="flex items-center gap-3 bg-green-50 rounded-2xl p-4 mb-6 border border-green-100">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-medium text-green-800">You've reviewed this product</p>
            <p className="text-xs text-green-600 mt-0.5">Thank you for sharing your feedback!</p>
          </div>
        </div>
      )}

      {/* Logged in but NOT purchased */}
      {isAuthenticated && !hasPurchased && (
        <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-4 mb-6 border border-amber-100">
          <span className="text-2xl">🛒</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Purchase required to review</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Buy this product first, then share your experience with others.
            </p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3 pb-5 border-b border-ink-100">
              <div className="w-9 h-9 bg-ink-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-ink-100 rounded w-32" />
                <div className="h-3 bg-ink-100 rounded w-24" />
                <div className="h-4 bg-ink-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-ink-400">
          <Star size={40} className="mx-auto mb-3 text-ink-200" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm mt-1">Be the first to review this product</p>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            <AnimatePresence>
              {displayedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserId={user?.id}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>

          {reviews.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-6 btn-outline w-full justify-center"
            >
              {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
            </button>
          )}
        </>
      )}
    </div>
  );
}