const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function main() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  const existing = await db.query("SELECT id FROM users WHERE email = 'admin@store.com'");
  if (existing.rows.length > 0) {
    await db.query("UPDATE users SET password = $1, role = 'admin' WHERE email = 'admin@store.com'", [hash]);
    console.log('Admin password updated → admin123');
  } else {
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES ('Admin User', 'admin@store.com', $1, 'admin')",
      [hash]
    );
    console.log('Admin created → admin@store.com / admin123');
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });