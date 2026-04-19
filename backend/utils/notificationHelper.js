const db = require("../config/db");

async function createNotification(userId, { type = "info", title, message, link = null }) {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, link]
    );
  } catch (err) {
    console.error("[Notifications] Failed to create notification:", err.message);
  }
}

module.exports = { createNotification };