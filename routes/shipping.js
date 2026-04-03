const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all shipping rates (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipping_rates ORDER BY wilaya_code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shipping rate (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { home_price, office_price, is_active } = req.body;
    const result = await pool.query(
      'UPDATE shipping_rates SET home_price=$1, office_price=$2, is_active=$3 WHERE id=$4 RETURNING *',
      [home_price, office_price, is_active !== false, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update shipping rates (admin)
router.put('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rates } = req.body;
    for (const r of rates) {
      await client.query(
        'UPDATE shipping_rates SET home_price=$1, office_price=$2, is_active=$3 WHERE id=$4',
        [r.home_price, r.office_price, r.is_active !== false, r.id]
      );
    }
    await client.query('COMMIT');
    const result = await pool.query('SELECT * FROM shipping_rates ORDER BY wilaya_code');
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
