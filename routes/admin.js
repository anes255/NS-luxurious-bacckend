const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// Admin credentials
const ADMIN_EMAIL = 'nessbusiness66@gmail.com';
const ADMIN_PASSWORD = 'lavieestbelle070478';

// Generate JWT for admin
const generateAdminToken = () => {
  return jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

// Admin login middleware
const adminAuth = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.email === ADMIN_EMAIL && decoded.role === 'admin') {
        req.admin = decoded;
        next();
      } else {
        res.status(401).json({ message: 'Not authorized as admin' });
      }
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      res.json({
        message: 'Admin login successful',
        token: generateAdminToken(),
        admin: {
          email: ADMIN_EMAIL,
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all orders (admin only)
// @route   GET /api/admin/orders
// @access  Private (Admin)
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({});

    res.json({
      orders,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single order (admin only)
// @route   GET /api/admin/orders/:id
// @access  Private (Admin)
router.get('/orders/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone address');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update order status (admin only)
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
router.put('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.orderStatus = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all products for admin
// @route   GET /api/admin/products
// @access  Private (Admin)
router.get('/products', adminAuth, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new product (admin only)
// @route   POST /api/admin/products
// @access  Private (Admin)
router.post('/products', adminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      images,
      quantity,
      featured,
      sizes,
      colors
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      images: images || [],
      quantity,
      inStock: quantity > 0,
      featured: featured || false,
      sizes: sizes || [],
      colors: colors || []
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update product (admin only)
// @route   PUT /api/admin/products/:id
// @access  Private (Admin)
router.put('/products/:id', adminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      images,
      quantity,
      featured,
      inStock,
      sizes,
      colors
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.category = category || product.category;
    product.image = image || product.image;
    product.images = images !== undefined ? images : product.images;
    product.quantity = quantity !== undefined ? quantity : product.quantity;
    product.inStock = inStock !== undefined ? inStock : (quantity > 0);
    product.featured = featured !== undefined ? featured : product.featured;
    product.sizes = sizes !== undefined ? sizes : product.sizes;
    product.colors = colors !== undefined ? colors : product.colors;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete product (admin only)
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin)
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const topProducts = await Order.aggregate([
      { $unwind: '$orderItems' },
      { $group: { 
          _id: '$orderItems.name', 
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalOrders,
      totalProducts,
      pendingOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;