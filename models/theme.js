const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    default: 'current'
  },
  primary: {
    type: String,
    required: true,
    default: '#e91e63'
  },
  secondary: {
    type: String,
    required: true,
    default: '#f06292'
  },
  accent: {
    type: String,
    required: true,
    default: '#ec407a'
  },
  background: {
    type: String,
    required: true,
    default: 'linear-gradient(135deg, #ffeef8 0%, #fff0f5 50%, #fdf2f8 100%)'
  },
  cardBackground: {
    type: String,
    required: true,
    default: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(253,242,248,0.7))'
  },
  textColor: {
    type: String,
    required: true,
    default: '#4a4a4a'
  },
  borderColor: {
    type: String,
    required: true,
    default: '#f8bbd9'
  },
  themeName: {
    type: String,
    required: true,
    default: 'Pink Theme'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
themeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Theme', themeSchema);