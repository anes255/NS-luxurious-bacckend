// Script to initialize or reset theme in database
// Run this once: node initTheme.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Theme Schema
const themeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    default: 'current'
  },
  primary: String,
  secondary: String,
  accent: String,
  background: String,
  cardBackground: String,
  textColor: String,
  borderColor: String,
  themeName: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Theme = mongoose.model('Theme', themeSchema);

// Default theme
const defaultTheme = {
  name: 'current',
  primary: '#e91e63',
  secondary: '#f06292',
  accent: '#ec407a',
  background: 'linear-gradient(135deg, #ffeef8 0%, #fff0f5 50%, #fdf2f8 100%)',
  cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(253,242,248,0.7))',
  textColor: '#4a4a4a',
  borderColor: '#f8bbd9',
  themeName: 'Pink Theme'
};

async function initializeTheme() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nsadmin:lavieestbelle070478@cluster0.guujlhw.mongodb.net/ns-luxurious?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if theme exists
    const existingTheme = await Theme.findOne({ name: 'current' });

    if (existingTheme) {
      console.log('📍 Current theme found:', existingTheme.themeName);
      console.log('\nDo you want to reset to default Pink theme? (y/n)');
      
      // For automatic script, we'll just log the current theme
      console.log('Current theme settings:');
      console.log('- Primary:', existingTheme.primary);
      console.log('- Secondary:', existingTheme.secondary);
      console.log('- Theme Name:', existingTheme.themeName);
    } else {
      // Create default theme
      const newTheme = await Theme.create(defaultTheme);
      console.log('✅ Default theme created successfully!');
      console.log('Theme Name:', newTheme.themeName);
      console.log('Primary Color:', newTheme.primary);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Theme initialization complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initializeTheme();