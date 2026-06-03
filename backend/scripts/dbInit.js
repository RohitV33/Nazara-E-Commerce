const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function initializeDatabase() {
  console.log('⏳ Initializing database schema...');
  try {
    // 1. Verify/create custom enum types in PostgreSQL programmatically to avoid SQL parser splitting bugs
    const checkRoleEnum = await db.query("SELECT 1 FROM pg_type WHERE typname = 'role_enum'");
    if (checkRoleEnum.rows.length === 0) {
      await db.query("CREATE TYPE role_enum AS ENUM ('user', 'admin')");
    }

    const checkStatusEnum = await db.query("SELECT 1 FROM pg_type WHERE typname = 'order_status_enum'");
    if (checkStatusEnum.rows.length === 0) {
      await db.query("CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'dispatched', 'out_for_delivery')");
    }

    const checkPaymentEnum = await db.query("SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum'");
    if (checkPaymentEnum.rows.length === 0) {
      await db.query("CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded')");
    }

    // 2. Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../config/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split queries by semicolon to execute them sequentially (filtering out empty lines)
    const queries = schemaSql
      .split(/;\s*$/m)
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (let sql of queries) {
      if (!sql.endsWith(';')) sql += ';';
      try {
        await db.query(sql);
      } catch (err) {
        console.error(`Error executing SQL statement:`, sql.substring(0, 100) + '...', err.message);
        throw err;
      }
    }
    console.log('✅ Tables and custom types verified/created.');

    // 2. Seed Categories if empty
    const categoriesCount = await db.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoriesCount.rows[0].count) === 0) {
      console.log('🌱 Seeding initial categories...');
      const categoriesSeed = [
        ['Electronics', 'electronics', 'Latest gadgets and tech', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800'],
        ['Fashion', 'fashion', 'Trendy clothing and accessories', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800'],
        ['Home & Living', 'home-living', 'Beautiful home decor', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800'],
        ['Sports', 'sports', 'Sports equipment and gear', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'],
        ['Beauty', 'beauty', 'Skincare and beauty products', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800'],
        ['Books', 'books', 'Books and literature', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800']
      ];

      for (const cat of categoriesSeed) {
        await db.query(
          'INSERT INTO categories (name, slug, description, image_url) VALUES ($1, $2, $3, $4)',
          cat
        );
      }
      console.log('✅ Categories seeded successfully.');
    }

    // 3. Seed Products if empty
    const productsCount = await db.query('SELECT COUNT(*) FROM products');
    if (parseInt(productsCount.rows[0].count) === 0) {
      console.log('🌱 Seeding initial products...');
      
      // Fetch categories map to map category_id dynamically
      const catsResult = await db.query('SELECT id, slug FROM categories');
      const catsMap = {};
      catsResult.rows.forEach(c => catsMap[c.slug] = c.id);

      const productsSeed = [
        {
          name: 'Pro Wireless Headphones',
          description: 'Premium noise-cancelling wireless headphones with 40-hour battery life and superior sound quality.',
          price: 299.99,
          original_price: 399.99,
          category_slug: 'electronics',
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'],
          stock: 50,
          rating: 4.8,
          review_count: 234,
          tags: ['wireless', 'audio', 'premium'],
          is_featured: true
        },
        {
          name: 'Ultra Slim Laptop',
          description: '15" 4K display, Intel i9, 32GB RAM, 1TB SSD — power meets elegance.',
          price: 1899.99,
          original_price: 2199.99,
          category_slug: 'electronics',
          image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
          images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800'],
          stock: 20,
          rating: 4.9,
          review_count: 187,
          tags: ['laptop', 'computing', 'premium'],
          is_featured: true
        },
        {
          name: 'Smart Watch Series X',
          description: 'Advanced fitness tracking, ECG, GPS, and 3-day battery in a premium titanium case.',
          price: 449.99,
          original_price: 549.99,
          category_slug: 'electronics',
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
          images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
          stock: 75,
          rating: 4.7,
          review_count: 312,
          tags: ['smartwatch', 'fitness', 'wearable'],
          is_featured: true
        },
        {
          name: '4K Action Camera',
          description: 'Capture life in stunning 4K at 60fps. Waterproof up to 10m, built-in stabilization.',
          price: 349.99,
          original_price: 449.99,
          category_slug: 'electronics',
          image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
          images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800'],
          stock: 40,
          rating: 4.6,
          review_count: 156,
          tags: ['camera', 'action', 'video'],
          is_featured: false
        },
        {
          name: 'Wireless Earbuds Pro',
          description: 'True wireless earbuds with active noise cancellation and 28-hour total battery.',
          price: 199.99,
          original_price: 249.99,
          category_slug: 'electronics',
          image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
          images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'],
          stock: 100,
          rating: 4.5,
          review_count: 423,
          tags: ['earbuds', 'wireless', 'audio'],
          is_featured: true
        },
        {
          name: 'Mechanical Keyboard',
          description: 'Full-size RGB mechanical keyboard with tactile switches, aluminum frame, and USB-C.',
          price: 159.99,
          original_price: 199.99,
          category_slug: 'electronics',
          image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
          images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'],
          stock: 60,
          rating: 4.7,
          review_count: 289,
          tags: ['keyboard', 'mechanical', 'gaming'],
          is_featured: false
        },
        {
          name: 'Designer Leather Jacket',
          description: 'Italian full-grain leather, slim fit, YKK zippers. A timeless investment piece.',
          price: 549.99,
          original_price: 699.99,
          category_slug: 'fashion',
          image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
          stock: 30,
          rating: 4.8,
          review_count: 98,
          tags: ['fashion', 'leather', 'jacket'],
          is_featured: true
        },
        {
          name: 'Premium Sneakers',
          description: 'Hand-crafted with sustainably sourced materials. Comfort meets contemporary design.',
          price: 189.99,
          original_price: 240.00,
          category_slug: 'fashion',
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
          images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800'],
          stock: 80,
          rating: 4.6,
          review_count: 567,
          tags: ['sneakers', 'shoes', 'fashion'],
          is_featured: true
        },
        {
          name: 'Silk Dress',
          description: 'Pure silk midi dress with adjustable straps. Effortless elegance for any occasion.',
          price: 299.99,
          original_price: 399.99,
          category_slug: 'fashion',
          image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
          images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800'],
          stock: 25,
          rating: 4.7,
          review_count: 134,
          tags: ['dress', 'silk', 'fashion'],
          is_featured: false
        },
        {
          name: 'Minimalist Watch',
          description: 'Swiss movement, sapphire glass, 42mm case. Where form meets function.',
          price: 399.99,
          original_price: 499.99,
          category_slug: 'fashion',
          image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800',
          images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800'],
          stock: 45,
          rating: 4.9,
          review_count: 201,
          tags: ['watch', 'fashion', 'luxury'],
          is_featured: false
        },
        {
          name: 'Linen Blazer',
          description: 'Relaxed Italian linen blazer. The perfect summer essential in a refined cut.',
          price: 229.99,
          original_price: 299.99,
          category_slug: 'fashion',
          image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4f3c?w=800',
          images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4f3c?w=800'],
          stock: 35,
          rating: 4.5,
          review_count: 87,
          tags: ['blazer', 'linen', 'fashion'],
          is_featured: false
        },
        {
          name: 'Ceramic Vase Set',
          description: 'Hand-thrown stoneware in matte earth tones. Set of 3 complementary sizes.',
          price: 89.99,
          original_price: 120.00,
          category_slug: 'home-living',
          image_url: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800',
          images: ['https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800'],
          stock: 60,
          rating: 4.8,
          review_count: 145,
          tags: ['home', 'decor', 'ceramic'],
          is_featured: true
        },
        {
          name: 'Scented Candle Collection',
          description: 'Set of 6 hand-poured soy candles with complex fragrance profiles. 60-hour burn each.',
          price: 129.99,
          original_price: 159.99,
          category_slug: 'home-living',
          image_url: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800',
          images: ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800'],
          stock: 100,
          rating: 4.7,
          review_count: 312,
          tags: ['candles', 'home', 'scent'],
          is_featured: false
        },
        {
          name: 'Linen Throw Blanket',
          description: 'Washed Belgian linen throw. Naturally temperature-regulating and endlessly beautiful.',
          price: 159.99,
          original_price: 200.00,
          category_slug: 'home-living',
          image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
          images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'],
          stock: 50,
          rating: 4.9,
          review_count: 178,
          tags: ['home', 'textile', 'linen'],
          is_featured: false
        },
        {
          name: 'Yoga Mat Premium',
          description: 'Eco-friendly natural rubber yoga mat with perfect grip, 6mm cushioning, alignment lines.',
          price: 98.99,
          original_price: 130.00,
          category_slug: 'sports',
          image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
          images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'],
          stock: 90,
          rating: 4.6,
          review_count: 234,
          tags: ['yoga', 'fitness', 'sport'],
          is_featured: true
        },
        {
          name: 'Running Shoes Elite',
          description: 'Carbon plate, responsive foam midsole, engineered mesh upper. PR-ready.',
          price: 249.99,
          original_price: 319.99,
          category_slug: 'sports',
          image_url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800',
          images: ['https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800'],
          stock: 45,
          rating: 4.8,
          review_count: 389,
          tags: ['running', 'shoes', 'sport'],
          is_featured: true
        },
        {
          name: 'Vitamin C Serum',
          description: 'Clinical-strength 20% Vitamin C with hyaluronic acid and ferulic acid. Dermatologist tested.',
          price: 69.99,
          original_price: 89.99,
          category_slug: 'beauty',
          image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800',
          images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'],
          stock: 120,
          rating: 4.7,
          review_count: 567,
          tags: ['skincare', 'vitamin-c', 'beauty'],
          is_featured: true
        },
        {
          name: 'Perfume Noir',
          description: 'Woody oriental fragrance with notes of oud, amber, and black pepper. 100ml EDP.',
          price: 189.99,
          original_price: 240.00,
          category_slug: 'beauty',
          image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800',
          images: ['https://images.unsplash.com/photo-1541643600914-78b084683702?w=800'],
          stock: 65,
          rating: 4.8,
          review_count: 198,
          tags: ['perfume', 'fragrance', 'beauty'],
          is_featured: false
        },
        {
          name: 'The Design Book',
          description: 'A comprehensive exploration of iconic design movements and their enduring influence. 400 pages.',
          price: 49.99,
          original_price: 65.00,
          category_slug: 'books',
          image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
          images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'],
          stock: 200,
          rating: 4.9,
          review_count: 145,
          tags: ['books', 'design', 'art'],
          is_featured: false
        },
        {
          name: 'Wireless Charging Pad',
          description: 'Dual-coil 15W fast wireless charger. Compatible with all Qi-enabled devices. LED indicator.',
          price: 49.99,
          original_price: 69.99,
          category_slug: 'electronics',
          image_url: 'https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=800',
          images: ['https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=800'],
          stock: 150,
          rating: 4.4,
          review_count: 456,
          tags: ['charging', 'wireless', 'accessory'],
          is_featured: false
        }
      ];

      for (const p of productsSeed) {
        const categoryId = catsMap[p.category_slug] || null;
        await db.query(
          `INSERT INTO products (name, description, price, original_price, category_id, image_url, images, stock, rating, review_count, tags, is_featured)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            p.name,
            p.description,
            p.price,
            p.original_price,
            categoryId,
            p.image_url,
            JSON.stringify(p.images),
            p.stock,
            p.rating,
            p.review_count,
            JSON.stringify(p.tags),
            p.is_featured
          ]
        );
      }
      console.log('✅ Products seeded successfully.');
    }

    // 4. Create default Admin User if not exists
    const adminCheck = await db.query("SELECT id FROM users WHERE email = 'admin@store.com'");
    if (adminCheck.rows.length === 0) {
      console.log('🌱 Creating default admin account...');
      const adminPassHash = await bcrypt.hash('admin123', 10);
      await db.query(
        "INSERT INTO users (name, email, password, is_verified, role) VALUES ('Admin User', 'admin@store.com', $1, true, 'admin')",
        [adminPassHash]
      );
      console.log('✅ Admin user created: admin@store.com / admin123');
    }

    console.log('🎉 Database initialization complete!');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    // Do not crash the application, but report error
  }
}

module.exports = { initializeDatabase };
