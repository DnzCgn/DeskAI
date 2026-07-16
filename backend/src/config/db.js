const mongoose = require('mongoose');

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed (SIGINT)');
  process.exit(0);
});

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/deska';

  const isAtlas = uri.includes('mongodb+srv://') || uri.includes('mongodb.net');

  const options = {
    serverSelectionTimeoutMS: isAtlas ? 5000 : 3000,
    connectTimeoutMS: isAtlas ? 10000 : 3000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: isAtlas ? 1 : 0,
    retryWrites: true,
    w: 'majority',
  };

  await mongoose.connect(uri, options);
}

module.exports = { connectDB };
