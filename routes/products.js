const express = require('express');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const { category, search, featured } = req.query;
    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (featured) {
      filter.featured = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create sample products (for development)
// @route   POST /api/products/sample
// @access  Public
router.post('/sample', async (req, res) => {
  try {
    // Check if products already exist
    const existingProducts = await Product.find({});
    if (existingProducts.length > 0) {
      return res.json({ message: 'Sample products already exist' });
    }

    const sampleProducts = [
      {
        name: 'Luxury Designer Handbag',
        description: 'Elegant leather handbag with premium craftsmanship and timeless design.',
        price: 299.99,
        category: 'Luxury Bags',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
        quantity: 50,
        featured: true,
        rating: 4.8
      },
      {
        name: 'Swiss Automatic Watch',
        description: 'Premium Swiss-made automatic watch with sapphire crystal and leather strap.',
        price: 899.99,
        category: 'Watches',
        image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=500&fit=crop',
        quantity: 25,
        featured: true,
        rating: 4.9
      },
      {
        name: 'Diamond Tennis Bracelet',
        description: 'Sparkling diamond tennis bracelet with white gold setting.',
        price: 1299.99,
        category: 'Jewelry',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop',
        quantity: 15,
        featured: true,
        rating: 5.0
      },
      {
        name: 'Silk Designer Scarf',
        description: 'Luxurious silk scarf with hand-printed artistic design.',
        price: 149.99,
        category: 'Accessories',
        image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&h=500&fit=crop',
        quantity: 40,
        featured: false,
        rating: 4.6
      },
      {
        name: 'Italian Leather Shoes',
        description: 'Handcrafted Italian leather dress shoes with classic design.',
        price: 449.99,
        category: 'Shoes',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop',
        quantity: 30,
        featured: false,
        rating: 4.7
      },
      {
        name: 'Cashmere Sweater',
        description: 'Ultra-soft cashmere sweater with elegant cut and premium quality.',
        price: 249.99,
        category: 'Clothing',
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=500&fit=crop',
        quantity: 35,
        featured: false,
        rating: 4.5
      },
      {
        name: 'Crystal Chandelier',
        description: 'Stunning crystal chandelier perfect for luxury home decor.',
        price: 799.99,
        category: 'Home Decor',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
        quantity: 10,
        featured: false,
        rating: 4.8
      },
      {
        name: 'Premium Headphones',
        description: 'High-end wireless headphones with noise cancellation.',
        price: 349.99,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
        quantity: 60,
        featured: true,
        rating: 4.4
      }
    ];

    const products = await Product.insertMany(sampleProducts);
    res.status(201).json({ message: 'Sample products created', products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;