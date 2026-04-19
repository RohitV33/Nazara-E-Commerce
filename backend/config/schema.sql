
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;


CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  avatar VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category_id INT,
  image_url VARCHAR(500),
  images JSON,
  stock INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  tags JSON,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (user_id, product_id)
);


CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  shipping_address JSON NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'card',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (user_id, product_id)
);


INSERT INTO categories (name, slug, description, image_url) VALUES
('Electronics', 'electronics', 'Latest gadgets and tech', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800'),
('Fashion', 'fashion', 'Trendy clothing and accessories', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800'),
('Home & Living', 'home-living', 'Beautiful home decor', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800'),
('Sports', 'sports', 'Sports equipment and gear', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'),
('Beauty', 'beauty', 'Skincare and beauty products', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800'),
('Books', 'books', 'Books and literature', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800');


INSERT INTO products (name, description, price, original_price, category_id, image_url, images, stock, rating, review_count, tags, is_featured) VALUES
('Pro Wireless Headphones', 'Premium noise-cancelling wireless headphones with 40-hour battery life and superior sound quality.', 299.99, 399.99, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800","https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800"]', 50, 4.8, 234, '["wireless","audio","premium"]', TRUE),
('Ultra Slim Laptop', '15" 4K display, Intel i9, 32GB RAM, 1TB SSD — power meets elegance.', 1899.99, 2199.99, 1, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', '["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800","https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800"]', 20, 4.9, 187, '["laptop","computing","premium"]', TRUE),
('Smart Watch Series X', 'Advanced fitness tracking, ECG, GPS, and 3-day battery in a premium titanium case.', 449.99, 549.99, 1, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"]', 75, 4.7, 312, '["smartwatch","fitness","wearable"]', TRUE),
('4K Action Camera', 'Capture life in stunning 4K at 60fps. Waterproof up to 10m, built-in stabilization.', 349.99, 449.99, 1, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800', '["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800"]', 40, 4.6, 156, '["camera","action","video"]', FALSE),
('Wireless Earbuds Pro', 'True wireless earbuds with active noise cancellation and 28-hour total battery.', 199.99, 249.99, 1, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800"]', 100, 4.5, 423, '["earbuds","wireless","audio"]', TRUE),
('Mechanical Keyboard', 'Full-size RGB mechanical keyboard with tactile switches, aluminum frame, and USB-C.', 159.99, 199.99, 1, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', '["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800"]', 60, 4.7, 289, '["keyboard","mechanical","gaming"]', FALSE),
('Designer Leather Jacket', 'Italian full-grain leather, slim fit, YKK zippers. A timeless investment piece.', 549.99, 699.99, 2, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"]', 30, 4.8, 98, '["fashion","leather","jacket"]', TRUE),
('Premium Sneakers', 'Hand-crafted with sustainably sourced materials. Comfort meets contemporary design.', 189.99, 240.00, 2, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800","https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800"]', 80, 4.6, 567, '["sneakers","shoes","fashion"]', TRUE),
('Silk Dress', 'Pure silk midi dress with adjustable straps. Effortless elegance for any occasion.', 299.99, 399.99, 2, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800', '["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800"]', 25, 4.7, 134, '["dress","silk","fashion"]', FALSE),
('Minimalist Watch', 'Swiss movement, sapphire glass, 42mm case. Where form meets function.', 399.99, 499.99, 2, 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800', '["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800"]', 45, 4.9, 201, '["watch","fashion","luxury"]', FALSE),
('Linen Blazer', 'Relaxed Italian linen blazer. The perfect summer essential in a refined cut.', 229.99, 299.99, 2, 'https://images.unsplash.com/photo-1594938298603-c8148c4b4f3c?w=800', '["https://images.unsplash.com/photo-1594938298603-c8148c4b4f3c?w=800"]', 35, 4.5, 87, '["blazer","linen","fashion"]', FALSE),
('Ceramic Vase Set', 'Hand-thrown stoneware in matte earth tones. Set of 3 complementary sizes.', 89.99, 120.00, 3, 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800', '["https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800"]', 60, 4.8, 145, '["home","decor","ceramic"]', TRUE),
('Scented Candle Collection', 'Set of 6 hand-poured soy candles with complex fragrance profiles. 60-hour burn each.', 129.99, 159.99, 3, 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800', '["https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800"]', 100, 4.7, 312, '["candles","home","scent"]', FALSE),
('Linen Throw Blanket', 'Washed Belgian linen throw. Naturally temperature-regulating and endlessly beautiful.', 159.99, 200.00, 3, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"]', 50, 4.9, 178, '["home","textile","linen"]', FALSE),
('Yoga Mat Premium', 'Eco-friendly natural rubber yoga mat with perfect grip, 6mm cushioning, alignment lines.', 98.99, 130.00, 4, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800"]', 90, 4.6, 234, '["yoga","fitness","sport"]', TRUE),
('Running Shoes Elite', 'Carbon plate, responsive foam midsole, engineered mesh upper. PR-ready.', 249.99, 319.99, 4, 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800', '["https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800"]', 45, 4.8, 389, '["running","shoes","sport"]', TRUE),
('Vitamin C Serum', 'Clinical-strength 20% Vitamin C with hyaluronic acid and ferulic acid. Dermatologist tested.', 69.99, 89.99, 5, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', '["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800"]', 120, 4.7, 567, '["skincare","vitamin-c","beauty"]', TRUE),
('Perfume Noir', 'Woody oriental fragrance with notes of oud, amber, and black pepper. 100ml EDP.', 189.99, 240.00, 5, 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800', '["https://images.unsplash.com/photo-1541643600914-78b084683702?w=800"]', 65, 4.8, 198, '["perfume","fragrance","beauty"]', FALSE),
('The Design Book', 'A comprehensive exploration of iconic design movements and their enduring influence. 400 pages.', 49.99, 65.00, 6, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800', '["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800"]', 200, 4.9, 145, '["books","design","art"]', FALSE),
('Wireless Charging Pad', 'Dual-coil 15W fast wireless charger. Compatible with all Qi-enabled devices. LED indicator.', 49.99, 69.99, 1, 'https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=800', '["https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=800"]', 150, 4.4, 456, '["charging","wireless","accessory"]', FALSE);


INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@store.com', '$2a?0$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');
