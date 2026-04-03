const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Create order (public)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { customer_name, phone, address, wilaya_code, wilaya_name, shipping_type, shipping_price, items, comment } = req.body;

    if (!customer_name || !phone || !address || !wilaya_code || !shipping_type || !items?.length) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * (item.quantity || 1);
    }
    const total_price = subtotal + (shipping_price || 0);

    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, phone, address, wilaya_code, wilaya_name, shipping_type, shipping_price, subtotal, total_price, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [customer_name, phone, address, wilaya_code, wilaya_name, shipping_type, shipping_price || 0, subtotal, total_price, comment || '']
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, variant_info, quantity, price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.product_name, item.variant_info || '', item.quantity || 1, item.price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get all orders (admin)
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM orders';
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` WHERE status = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM orders';
    const countParams = [];
    if (status && status !== 'all') {
      countParams.push(status);
      countQuery += ` WHERE status = $1`;
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order with items (admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (order.rows.length === 0) return res.status(404).json({ error: 'Commande non trouvée' });

    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    res.json({ message: 'Commande supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
