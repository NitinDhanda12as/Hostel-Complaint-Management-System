const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function testConnection() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI.split('@')[1]); // Log host only for privacy
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
