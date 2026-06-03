const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
} else {
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.user = process.env.DB_USER || 'postgres';
  poolConfig.password = process.env.DB_PASSWORD || '';
  poolConfig.database = process.env.DB_NAME || 'ecommerce_db';
  poolConfig.port = parseInt(process.env.DB_PORT || '5432');
}

// Enable SSL dynamically in production or if explicitly requested via environment variable
const isProduction = process.env.NODE_ENV === 'production';
const sslRequested = process.env.DB_SSL === 'true';

if (isProduction || sslRequested) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
} else {
  poolConfig.ssl = false;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

module.exports = pool;