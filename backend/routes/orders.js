const express = require("express");
const router = express.Router();
const {
  createOrder,
  updateOrderStatus,
  getAllOrders,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderController");

const { authenticate, isAdmin } = require("../middleware/auth");
const db = require("../config/db");

router.get("/admin/stats", authenticate, isAdmin, async (req, res) => {
  try {
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM users) as total_users
      FROM orders
    `);
    const stats = statsResult.rows[0];

    const recentResult = await db.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at,
             u.name, u.email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    const dailyResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      total_orders: stats.total_orders,
      total_revenue: stats.total_revenue,
      total_products: stats.total_products,
      total_users: stats.total_users,
      recentOrders: recentResult.rows,
      dailyRevenue: dailyResult.rows,
    });
  } catch (err) {
    console.error("[Orders] Stats error:", err.message);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.get("/admin/all", authenticate, isAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("[Orders] Admin all error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.get("/admin/top-products", authenticate, isAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.name as product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("[Orders] Top products error:", err.message);
    res.status(500).json({ message: "Failed to fetch top products" });
  }
});

router.post("/", authenticate, createOrder);
router.get("/mine", authenticate, getMyOrders);

router.get("/", authenticate, isAdmin, getAllOrders);
router.put("/:id/status", authenticate, isAdmin, updateOrderStatus);

router.get("/:id", authenticate, getOrderById);
router.put("/:id/cancel", authenticate, cancelOrder);

module.exports = router;