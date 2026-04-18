const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(config.mongo.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...');
    });

    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    if (error.message.includes('whitelist') || error.message.includes('ECONNREFUSED') || error.message.includes('Could not connect')) {
      logger.error('💡 If using MongoDB Atlas, make sure your IP is whitelisted:');
      logger.error('   Go to Atlas → Network Access → Add Current IP Address');
      logger.error('   Or add 0.0.0.0/0 to allow all IPs (not recommended for production)');
    }
    process.exit(1);
  }
};

module.exports = connectDatabase;
