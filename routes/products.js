const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for image uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = true';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name_fr ILIKE $${params.length} OR name_ar ILIKE $${params.length})`;
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products including inactive (admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product with variants
router.get('/:id', async (req, res) => {
  try {
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (product.rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });

    const variants = await pool.query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id', [req.params.id]);

    res.json({ ...product.rows[0], variants: variants.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload images
router.post('/upload', auth, upload.array('images', 10), (req, res) => {
  try {
    const urls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product (admin)
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name_fr, name_ar, description_fr, description_ar, price, old_price, images, category, variants } = req.body;

    const productResult = await client.query(
      `INSERT INTO products (name_fr, name_ar, description_fr, description_ar, price, old_price, images, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name_fr, name_ar || '', description_fr || '', description_ar || '', price, old_price || null, images || [], category || '']
    );
    const product = productResult.rows[0];

    if (variants && variants.length > 0) {
      for (const v of variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, color, color_hex, size, images, stock)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [product.id, v.color || '', v.color_hex || '', v.size || '', v.images || [], v.stock || 0]
        );
      }
    }

    await client.query('COMMIT');
    const variants_result = await pool.query('SELECT * FROM product_variants WHERE product_id = $1', [product.id]);
    res.status(201).json({ ...product, variants: variants_result.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update product (admin)
router.put('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name_fr, name_ar, description_fr, description_ar, price, old_price, images, category, is_active, variants } = req.body;

    await client.query(
      `UPDATE products SET name_fr=$1, name_ar=$2, description_fr=$3, description_ar=$4, 
       price=$5, old_price=$6, images=$7, category=$8, is_active=$9, updated_at=NOW() WHERE id=$10`,
      [name_fr, name_ar || '', description_fr || '', description_ar || '', price, old_price || null, images || [], category || '', is_active !== false, req.params.id]
    );

    // Replace variants
    await client.query('DELETE FROM product_variants WHERE product_id = $1', [req.params.id]);
    if (variants && variants.length > 0) {
      for (const v of variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, color, color_hex, size, images, stock)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [req.params.id, v.color || '', v.color_hex || '', v.size || '', v.images || [], v.stock || 0]
        );
      }
    }

    await client.query('COMMIT');
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    const vars = await pool.query('SELECT * FROM product_variants WHERE product_id = $1', [req.params.id]);
    res.json({ ...product.rows[0], variants: vars.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Delete product (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
