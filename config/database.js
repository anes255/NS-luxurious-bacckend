const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB Atlas Cluster0...');
    
    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Atlas Connected Successfully!`);
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📚 Database: ${conn.connection.name}`);
    console.log(`🌍 Cluster: Cluster0`);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication failed. Please check your username and password.');
    } else if (error.message.includes('network')) {
      console.error('🌐 Network error. Please check your internet connection and IP whitelist in MongoDB Atlas.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔍 Cannot find the MongoDB cluster. Please check your connection string.');
    }
    
    console.error('\n📝 Connection string format should be:');
    console.error('mongodb+srv://username:password@cluster0.guujlhw.mongodb.net/database?retryWrites=true&w=majority');
    
    // Exit process with failure
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB Atlas');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 Mongoose connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;