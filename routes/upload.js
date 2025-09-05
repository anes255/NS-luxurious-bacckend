// Add this to your backend package.json dependencies:
// "multer": "^1.4.5-lts.1"

// Create a new file: routes/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Admin credentials check
const ADMIN_EMAIL = 'nessbusiness66@gmail.com';
const ADMIN_PASSWORD = 'lavieestbelle070478';

// Admin middleware
const adminAuth = (req, res, next) => {
  const { email, password } = req.headers;
  
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  
  next();
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// @desc    Upload product image
// @route   POST /api/upload/product-image
// @access  Private (Admin)
router.post('/product-image', adminAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Return the file URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Upload multiple product images
// @route   POST /api/upload/product-images
// @access  Private (Admin)
router.post('/product-images', adminAuth, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const imageUrls = req.files.map(file => {
      return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    });
    
    res.json({
      message: 'Images uploaded successfully',
      imageUrls: imageUrls,
      filenames: req.files.map(file => file.filename)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  res.status(500).json({ message: error.message });
});

module.exports = router;
