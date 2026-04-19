const db = require('../config/db');

exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort, featured } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const offset = (page - 1) * limit;

    let baseWhere = 'WHERE p.is_active = TRUE';
    const params = [];

    if (category) {
      params.push(category);
      baseWhere += ` AND c.slug = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`, `%${search}%`);
      baseWhere += ` AND (p.name ILIKE $${params.length - 1} OR p.description ILIKE $${params.length})`;
    }
    if (featured === 'true') {
      baseWhere += ' AND p.is_featured = TRUE';
    }

    const sortMap = {
      'price-asc':  'p.price ASC',
      'price-desc': 'p.price DESC',
      'rating':     'p.rating DESC',
      'newest':     'p.created_at DESC',
      'popular':    'p.review_count DESC',
    };
    const orderBy = sortMap[sort] || 'p.is_featured DESC, p.created_at DESC';

    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${baseWhere}
    `;
    const countResult = await db.query(countSql, params);
    const total = parseInt(countResult.rows[0].total);

    params.push(limit, offset);
    const productSql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${baseWhere}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const productsResult = await db.query(productSql, params);

    res.json({
      products: productsResult.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const productResult = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.is_active = TRUE`,
      [req.params.id]
    );

    if (productResult.rows.length === 0) return res.status(404).json({ message: 'Product not found' });

    const product = productResult.rows[0];
    if (typeof product.images === 'string') {
      try { product.images = JSON.parse(product.images); } catch { product.images = []; }
    }
    if (typeof product.tags === 'string') {
      try { product.tags = JSON.parse(product.tags); } catch { product.tags = []; }
    }

    const relatedResult = await db.query(
      `SELECT id, name, price, original_price, image_url, rating, review_count
       FROM products WHERE category_id = $1 AND id != $2 AND is_active = TRUE LIMIT 4`,
      [product.category_id, product.id]
    );

    res.json({ ...product, related: relatedResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name, description, price, original_price, category_id,
      image_url, images, stock, tags, is_featured
    } = req.body;

    const result = await db.query(
      `INSERT INTO products (name, description, price, original_price, category_id, image_url, images, stock, tags, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        name, description, parseFloat(price),
        original_price ? parseFloat(original_price) : null,
        category_id ? parseInt(category_id) : null,
        image_url,
        JSON.stringify(images || []),
        parseInt(stock) || 0,
        JSON.stringify(tags || []),
        is_featured ? true : false,
      ]
    );

    res.status(201).json({ message: 'Product created', id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const {
      name, description, price, original_price, category_id,
      image_url, images, stock, tags, is_featured, is_active
    } = req.body;

    await db.query(
      `UPDATE products SET name=$1, description=$2, price=$3, original_price=$4, category_id=$5,
       image_url=$6, images=$7, stock=$8, tags=$9, is_featured=$10, is_active=$11 WHERE id=$12`,
      [
        name, description, parseFloat(price),
        original_price ? parseFloat(original_price) : null,
        category_id ? parseInt(category_id) : null,
        image_url,
        JSON.stringify(images || []),
        parseInt(stock) || 0,
        JSON.stringify(tags || []),
        is_featured ? true : false,
        is_active !== false ? true : false,
        req.params.id,
      ]
    );

    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await db.query('UPDATE products SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFeatured = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_featured = TRUE AND p.is_active = TRUE
       ORDER BY p.rating DESC LIMIT 8`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};