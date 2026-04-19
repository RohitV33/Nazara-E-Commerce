const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendOrderStatusEmail } = require('../utils/sendOrderEmail');
const { createNotification } = require('../utils/notificationHelper');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    const cartResult = await db.query(
      `SELECT c.quantity, p.price, p.name, p.stock
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    const cartItems = cartResult.rows;
    if (cartItems.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });

    for (const item of cartItems) {
      if (item.stock < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ message: 'Payment initialization failed' });
  }
});

router.post('/verify', authenticate, async (req, res) => {
  const client = await db.connect();
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shipping_address,
    } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature)
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });

    const cartResult = await client.query(
      `SELECT c.quantity, p.price, p.id as product_id, p.name as product_name, p.image_url
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    const cartItems = cartResult.rows;
    if (cartItems.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });

    const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status, emails_sent)
       VALUES ($1, $2, $3, 'razorpay', 'pending', '') RETURNING id`,
      [req.user.id, total.toFixed(2), JSON.stringify(shipping_address || {})]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cartItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
      await client.query(
        `UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query(`DELETE FROM cart WHERE user_id = $1`, [req.user.id]);

    await client.query('COMMIT');

    const userResult = await db.query(
      `SELECT name, email FROM users WHERE id = $1`, [req.user.id]
    );
    const user = userResult.rows[0];

    const fullOrder = {
      id: orderId,
      _id: orderId,
      user: { name: user.name, email: user.email },
      items: cartItems.map(i => ({
        product_name: i.product_name,
        image_url: i.image_url,
        quantity: i.quantity,
        price: i.price,
      })),
      totalPrice: total.toFixed(2),
      shippingAddress: shipping_address || {},
      createdAt: new Date(),
      emailsSent: [],
    };

    sendOrderStatusEmail(fullOrder, 'pending').catch(console.error);
    createNotification(req.user.id, {
      type: 'order',
      title: '🛍️ Order Placed!',
      message: `Your order #${orderId} has been placed successfully!`,
      link: '/orders',
    }).catch(console.error);

    res.json({ message: 'Payment successful', orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Payment verify error:', err.message);
    res.status(500).json({ message: 'Payment verification failed' });
  } finally {
    client.release();
  }
});

module.exports = router;