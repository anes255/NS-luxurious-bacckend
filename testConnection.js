// Test script to verify MongoDB connection
// Run this with: node testConnection.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nsadmin:lavieestbelle070478@cluster0.guujlhw.mongodb.net/ns-luxurious?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  console.log('🚀 Testing MongoDB Atlas Connection...\n');
  console.log('📍 Cluster: Cluster0');
  console.log('👤 User: nsadmin');
  console.log('📚 Database: ns-luxurious\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ CONNECTION SUCCESSFUL!\n');
    
    // Get connection info
    const connection = mongoose.connection;
    console.log('📊 Connection Details:');
    console.log(`   Host: ${connection.host}`);
    console.log(`   Port: ${connection.port}`);
    console.log(`   Database: ${connection.name}`);
    console.log(`   Ready State: ${connection.readyState} (1 = connected)`);
    
    // Test creating a collection
    console.log('\n🧪 Testing database operations...');
    
    // Create a test schema
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', TestSchema);
    
    // Create a test document
    const testDoc = await TestModel.create({
      message: 'NS Luxurious MongoDB connection test successful!'
    });
    
    console.log('✅ Created test document:', testDoc.message);
    
    // Read the test document
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('✅ Retrieved test document:', foundDoc.message);
    
    // Delete the test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Deleted test document');
    
    console.log('\n🎉 All tests passed! Your MongoDB connection is working perfectly!');
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n🔐 Authentication Issue:');
      console.error('   - Check your username and password');
      console.error('   - Make sure the user exists in MongoDB Atlas');
      console.error('   - Verify the user has the correct permissions');
    } else if (error.message.includes('network')) {
      console.error('\n🌐 Network Issue:');
      console.error('   - Check your internet connection');
      console.error('   - Make sure your IP is whitelisted in MongoDB Atlas');
      console.error('   - Go to MongoDB Atlas > Network Access > Add your current IP');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n🔍 Cluster Not Found:');
      console.error('   - Check your cluster name in the connection string');
      console.error('   - Make sure the cluster exists and is running');
    }
    
    console.error('\n💡 To fix this:');
    console.error('1. Go to MongoDB Atlas (https://cloud.mongodb.com)');
    console.error('2. Check Network Access - Add IP Address (0.0.0.0/0 for all IPs)');
    console.error('3. Check Database Access - Verify user credentials');
    console.error('4. Check Cluster status - Make sure it\'s running');
    
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

// Run the test
testConnection();