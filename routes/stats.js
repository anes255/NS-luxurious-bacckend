const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Total orders
    const totalOrders = await pool.query('SELECT COUNT(*) FROM orders');
    
    // This month orders
    const thisMonthOrders = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE created_at >= $1', [thisMonthStart]
    );
    
    // Last month orders
    const lastMonthOrders = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE created_at >= $1 AND created_at <= $2',
      [lastMonthStart, lastMonthEnd]
    );

    // Revenue this month
    const thisMonthRevenue = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE created_at >= $1 AND status != 'cancelled'",
      [thisMonthStart]
    );

    // Revenue last month
    const lastMonthRevenue = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE created_at >= $1 AND created_at <= $2 AND status != 'cancelled'",
      [lastMonthStart, lastMonthEnd]
    );

    // Total revenue
    const totalRevenue = await pool.query(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status != 'cancelled'"
    );

    // Orders by status
    const ordersByStatus = await pool.query(
      'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
    );

    // Top products
    const topProducts = await pool.query(
      `SELECT oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.price * oi.quantity) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status != 'cancelled'
       GROUP BY oi.product_name ORDER BY total_sold DESC LIMIT 10`
    );

    // Orders by wilaya
    const ordersByWilaya = await pool.query(
      'SELECT wilaya_name, COUNT(*) as count FROM orders GROUP BY wilaya_name ORDER BY count DESC LIMIT 15'
    );

    // Daily orders last 30 days
    const dailyOrders = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total_price), 0) as revenue
       FROM orders WHERE created_at >= NOW() - INTERVAL '30 days' AND status != 'cancelled'
       GROUP BY DATE(created_at) ORDER BY date`
    );

    // Total products
    const totalProducts = await pool.query('SELECT COUNT(*) FROM products WHERE is_active = true');

    // Shipping type distribution
    const shippingDist = await pool.query(
      'SELECT shipping_type, COUNT(*) as count FROM orders GROUP BY shipping_type'
    );

    const thisMonthRev = parseFloat(thisMonthRevenue.rows[0].total);
    const lastMonthRev = parseFloat(lastMonthRevenue.rows[0].total);
    const revenueChange = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100).toFixed(1) : thisMonthRev > 0 ? 100 : 0;

    const thisMonthOrd = parseInt(thisMonthOrders.rows[0].count);
    const lastMonthOrd = parseInt(lastMonthOrders.rows[0].count);
    const ordersChange = lastMonthOrd > 0 ? ((thisMonthOrd - lastMonthOrd) / lastMonthOrd * 100).toFixed(1) : thisMonthOrd > 0 ? 100 : 0;

    res.json({
      totalOrders: parseInt(totalOrders.rows[0].count),
      thisMonthOrders: thisMonthOrd,
      lastMonthOrders: lastMonthOrd,
      ordersChange: parseFloat(ordersChange),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
      thisMonthRevenue: thisMonthRev,
      lastMonthRevenue: lastMonthRev,
      revenueChange: parseFloat(revenueChange),
      totalProducts: parseInt(totalProducts.rows[0].count),
      ordersByStatus: ordersByStatus.rows,
      topProducts: topProducts.rows,
      ordersByWilaya: ordersByWilaya.rows,
      dailyOrders: dailyOrders.rows,
      shippingDistribution: shippingDist.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
