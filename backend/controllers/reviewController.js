const db = require('../config/db');

exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewsResult = await db.query(
      `SELECT r.*, u.name as user_name, u.avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    const breakdownResult = await db.query(
      `SELECT rating, COUNT(*) as count
       FROM reviews WHERE product_id = $1
       GROUP BY rating ORDER BY rating DESC`,
      [id]
    );

    const ratingMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdownResult.rows.forEach(r => { ratingMap[r.rating] = parseInt(r.count); });

    res.json({ reviews: reviewsResult.rows, breakdown: ratingMap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    const productResult = await db.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = TRUE',
      [product_id]
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingResult = await db.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }

    const purchasedResult = await db.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status != 'cancelled'`,
      [user_id, product_id]
    );
    if (purchasedResult.rows.length === 0) {
      return res.status(403).json({ message: 'You can only review products you have purchased' });
    }

    await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [user_id, product_id, rating, comment || null]
    );

    await db.query(
      `UPDATE products SET
        rating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $2)
       WHERE id = $3`,
      [product_id, product_id, product_id]
    );

    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    const reviewResult = await db.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    await db.query(
      'UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3',
      [rating, comment || null, id]
    );

    await db.query(
      `UPDATE products SET
        rating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $2)
       WHERE id = $3`,
      [review.product_id, review.product_id, review.product_id]
    );

    res.json({ message: 'Review updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const reviewResult = await db.query(
      'SELECT * FROM reviews WHERE id = $1 AND (user_id = $2 OR $3 = $4)',
      [id, user_id, req.user.role, 'admin']
    );
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = reviewResult.rows[0];

    await db.query('DELETE FROM reviews WHERE id = $1', [id]);

    await db.query(
      `UPDATE products SET
        rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = $1), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $2)
       WHERE id = $3`,
      [review.product_id, review.product_id, review.product_id]
    );

    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkCanReview = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const user_id = req.user.id;

    const purchasedResult = await db.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status != 'cancelled'`,
      [user_id, product_id]
    );

    const reviewedResult = await db.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );

    res.json({
      canReview: purchasedResult.rows.length > 0 && reviewedResult.rows.length === 0,
      hasPurchased: purchasedResult.rows.length > 0,
      hasReviewed: reviewedResult.rows.length > 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};