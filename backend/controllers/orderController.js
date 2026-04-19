const db = require("../config/db");
const { sendOrderStatusEmail } = require("../utils/sendOrderEmail");
const { createNotification } = require("../utils/notificationHelper");

const ALLOWED_TRANSITIONS = {
  pending:          ["dispatched", "cancelled"],
  dispatched:       ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered:        [],
  cancelled:        [],
};

const STATUS_NOTIFICATIONS = {
  pending:          { title: "🛍️ Order Placed!",      message: (id) => `Your order #${id} has been placed successfully.` },
  dispatched:       { title: "📦 Order Dispatched",   message: (id) => `Your order #${id} has been dispatched and is on its way.` },
  out_for_delivery: { title: "🚚 Out for Delivery",   message: (id) => `Your order #${id} is out for delivery. Expect it today!` },
  delivered:        { title: "✅ Order Delivered",     message: (id) => `Your order #${id} has been delivered. Enjoy your purchase!` },
  cancelled:        { title: "❌ Order Cancelled",     message: (id) => `Your order #${id} has been cancelled.` },
};

async function getFullOrder(orderId) {
  const orderResult = await db.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = $1`,
    [orderId]
  );
  const order = orderResult.rows[0];
  if (!order) return null;

  const itemsResult = await db.query(
    `SELECT oi.*, p.name as product_name, p.image_url as product_image
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  let shippingAddress = {};
  try {
    shippingAddress = typeof order.shipping_address === "string"
      ? JSON.parse(order.shipping_address) : order.shipping_address || {};
  } catch {}

  return {
    ...order, _id: order.id, items: itemsResult.rows, shippingAddress,
    user: { name: order.user_name, email: order.user_email },
    totalPrice: order.total_amount, createdAt: order.created_at,
    emailsSent: order.emails_sent
      ? order.emails_sent.split(",").filter(s => s && s !== "pending")
      : [],
  };
}


exports.createOrder = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { items, shippingAddress, paymentMethod = "razorpay", totalPrice } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ message: "No order items" });

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, payment_method, status, emails_sent, shipping_address)
       VALUES ($1, $2, $3, 'pending', '', $4) RETURNING id`,
      [req.user.id, totalPrice, paymentMethod, JSON.stringify(shippingAddress || {})]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id || item.id, item.quantity, item.price]
      );
      await client.query(
        `UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2`,
        [item.quantity, item.product_id || item.id]
      );
    }
    await client.query('COMMIT');

    const fullOrder = await getFullOrder(orderId);
    if (fullOrder) {
      sendOrderStatusEmail(fullOrder, "pending").catch(console.error);
      await createNotification(req.user.id, {
        type: "order", title: STATUS_NOTIFICATIONS.pending.title,
        message: STATUS_NOTIFICATIONS.pending.message(orderId), link: `/orders`,
      });
    }
    res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("[Orders] Create error:", err.message);
    res.status(500).json({ message: "Failed to create order" });
  } finally {
    client.release();
  }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const orderResult = await db.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ message: "Order not found" });

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status))
      return res.status(400).json({
        message: `Cannot change status from '${order.status}' to '${status}'`,
      });

    const extraField = status === "cancelled" ? ", cancelled_at = NOW()" : "";
    await db.query(
      `UPDATE orders SET status = $1 ${extraField} WHERE id = $2`,
      [status, id]
    );

    const fullOrder = await getFullOrder(id);
    if (fullOrder) {
      if (!fullOrder.emailsSent.includes(status)) {
        sendOrderStatusEmail(fullOrder, status)
          .then(async (result) => {
            if (result) {
              const updated = [...fullOrder.emailsSent, status].join(",");
              await db.query(
                `UPDATE orders SET emails_sent = $1 WHERE id = $2`,
                [updated, id]
              );
            }
          })
          .catch(console.error);
      }

      const notif = STATUS_NOTIFICATIONS[status];
      if (notif) {
        await createNotification(fullOrder.user_id, {
          type: "order",
          title: notif.title,
          message: notif.message(id),
          link: `/orders`,
        });
      }
    }

    res.json({ message: "Order status updated", status });
  } catch (err) {
    console.error("[Orders] Status update error:", err.message);
    res.status(500).json({ message: "Failed to update status" });
  }
};


exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "No reason provided" } = req.body;

    const orderResult = await db.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!["pending", "dispatched"].includes(order.status))
      return res.status(400).json({
        message: "Order cannot be cancelled at this stage",
      });

    await db.query(
      `UPDATE orders SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = $1 WHERE id = $2`,
      [reason, id]
    );

    const fullOrder = await getFullOrder(id);
    if (fullOrder) {
      sendOrderStatusEmail(fullOrder, "cancelled").catch(console.error);
      await createNotification(req.user.id, {
        type: "order",
        title: STATUS_NOTIFICATIONS.cancelled.title,
        message: `Your order #${id} has been cancelled. Reason: ${reason}`,
        link: `/orders`,
      });
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error("[Orders] Cancel error:", err.message);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};


exports.getMyOrders = async (req, res) => {
  try {
    const ordersResult = await db.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    const orders = ordersResult.rows;
    for (const order of orders) {
      const itemsResult = await db.query(
        `SELECT oi.*, p.name as product_name, p.image_url as product_image
         FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
      try {
        order.shipping_address =
          typeof order.shipping_address === "string"
            ? JSON.parse(order.shipping_address)
            : order.shipping_address || {};
      } catch {
        order.shipping_address = {};
      }
    }
    res.json(orders);
  } catch (err) {
    console.error("[Orders] My orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


exports.getOrderById = async (req, res) => {
  try {
    const order = await getFullOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (req.user.role !== "admin" && order.user_id !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });
    res.json(order);
  } catch (err) {
    console.error("[Orders] Get by ID error:", err.message);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};


exports.getAllOrders = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[Orders] Get all error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};