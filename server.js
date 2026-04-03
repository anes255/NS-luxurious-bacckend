const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const initDB = require('./config/init');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const shippingRoutes = require('./routes/shipping');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'NS Luxurious API is running', version: '1.0.0' });
});

// Initialize database and start server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
