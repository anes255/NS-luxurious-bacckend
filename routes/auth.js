const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Identifiants invalides' });

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify token
router.get('/verify', auth, (req, res) => {
  res.json({ valid: true, username: req.admin.username });
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT * FROM admin_users WHERE id = $1', [req.admin.id]);
    const admin = result.rows[0];
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admin_users SET password = $1 WHERE id = $2', [hashed, req.admin.id]);
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
