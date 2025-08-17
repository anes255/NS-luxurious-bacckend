const express = require('express');
const Theme = require('../models/theme');

const router = express.Router();

// Admin credentials check
const ADMIN_EMAIL = 'nessbusiness66@gmail.com';
const ADMIN_PASSWORD = 'lavieestbelle070478';

// Default theme configuration
const defaultTheme = {
  primary: '#e91e63',
  secondary: '#f06292', 
  accent: '#ec407a',
  background: 'linear-gradient(135deg, #ffeef8 0%, #fff0f5 50%, #fdf2f8 100%)',
  cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(253,242,248,0.7))',
  textColor: '#4a4a4a',
  borderColor: '#f8bbd9',
  themeName: 'Pink Theme'
};

// Predefined themes
const themes = {
  pink: {
    primary: '#e91e63',
    secondary: '#f06292',
    accent: '#ec407a',
    background: 'linear-gradient(135deg, #ffeef8 0%, #fff0f5 50%, #fdf2f8 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(253,242,248,0.7))',
    textColor: '#4a4a4a',
    borderColor: '#f8bbd9',
    themeName: 'Pink Theme'
  },
  blue: {
    primary: '#2196f3',
    secondary: '#64b5f6',
    accent: '#42a5f5',
    background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #e8f5e8 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(227,242,253,0.7))',
    textColor: '#2c3e50',
    borderColor: '#bbdefb',
    themeName: 'Blue Theme'
  },
  purple: {
    primary: '#9c27b0',
    secondary: '#ba68c8',
    accent: '#ab47bc',
    background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 50%, #f8bbd9 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(243,229,245,0.7))',
    textColor: '#4a148c',
    borderColor: '#e1bee7',
    themeName: 'Purple Theme'
  },
  green: {
    primary: '#4caf50',
    secondary: '#81c784',
    accent: '#66bb6a',
    background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 50%, #f9fbe7 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(232,245,232,0.7))',
    textColor: '#2e7d32',
    borderColor: '#c8e6c9',
    themeName: 'Green Theme'
  },
  orange: {
    primary: '#ff9800',
    secondary: '#ffb74d',
    accent: '#ffa726',
    background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 50%, #ffe0b2 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,248,225,0.7))',
    textColor: '#e65100',
    borderColor: '#ffcc02',
    themeName: 'Orange Theme'
  },
  dark: {
    primary: '#bb86fc',
    secondary: '#3700b3',
    accent: '#03dac6',
    background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 50%, #2d2d2d 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(187,134,252,0.1))',
    textColor: '#ffffff',
    borderColor: '#333333',
    themeName: 'Dark Theme'
  },
  luxury: {
    primary: '#d4af37',
    secondary: '#f4e4c1',
    accent: '#a0826d',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(244,228,193,0.05))',
    textColor: '#f4e4c1',
    borderColor: '#d4af37',
    themeName: 'Luxury Gold Theme'
  }
};

// Initialize default theme in database if not exists
const initializeTheme = async () => {
  try {
    const existingTheme = await Theme.findOne({ name: 'current' });
    if (!existingTheme) {
      await Theme.create({
        name: 'current',
        ...defaultTheme
      });
      console.log('Default theme initialized in database');
    }
  } catch (error) {
    console.error('Error initializing theme:', error);
  }
};

// Call initialization when server starts
setTimeout(initializeTheme, 2000);

// @desc    Get current theme from database
// @route   GET /api/theme
// @access  Public
router.get('/', async (req, res) => {
  try {
    let theme = await Theme.findOne({ name: 'current' });
    
    if (!theme) {
      // Create default theme if not exists
      theme = await Theme.create({
        name: 'current',
        ...defaultTheme
      });
    }
    
    res.json({
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      background: theme.background,
      cardBackground: theme.cardBackground,
      textColor: theme.textColor,
      borderColor: theme.borderColor,
      themeName: theme.themeName
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update theme in database (admin only)
// @route   POST /api/theme
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.headers;
    
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const themeConfig = req.body;
    
    // Update theme in database
    let theme = await Theme.findOne({ name: 'current' });
    
    if (theme) {
      // Update existing theme
      Object.assign(theme, themeConfig);
      await theme.save();
    } else {
      // Create new theme
      theme = await Theme.create({
        name: 'current',
        ...themeConfig
      });
    }
    
    res.json({ 
      message: 'Theme updated successfully', 
      theme: {
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
        background: theme.background,
        cardBackground: theme.cardBackground,
        textColor: theme.textColor,
        borderColor: theme.borderColor,
        themeName: theme.themeName
      }
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get available preset themes
// @route   GET /api/theme/presets
// @access  Public
router.get('/presets', (req, res) => {
  res.json(themes);
});

// @desc    Apply preset theme (admin only)
// @route   POST /api/theme/preset/:themeName
// @access  Private (Admin)
router.post('/preset/:themeName', async (req, res) => {
  try {
    const { email, password } = req.headers;
    
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { themeName } = req.params;
    
    if (!themes[themeName]) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    const selectedTheme = themes[themeName];
    
    // Update theme in database
    let theme = await Theme.findOne({ name: 'current' });
    
    if (theme) {
      // Update existing theme
      Object.assign(theme, selectedTheme);
      await theme.save();
    } else {
      // Create new theme
      theme = await Theme.create({
        name: 'current',
        ...selectedTheme
      });
    }
    
    res.json({ 
      message: 'Theme applied successfully', 
      theme: selectedTheme 
    });
  } catch (error) {
    console.error('Error applying preset theme:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;