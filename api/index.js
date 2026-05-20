const mongoose = require('mongoose');
const app = require('../src/app');
const connectDatabase = require('../src/config/database');

// Cache the connection promise so we only connect once across warm invocations
let dbPromise = null;

function ensureDbConnected() {
  if (!dbPromise) {
    dbPromise = connectDatabase().catch(err => {
      console.error('Vercel DB Connection Error:', err);
      dbPromise = null; // Reset so next request retries
      throw err;
    });
  }
  return dbPromise;
}

// Wrap the Express app to ensure DB is connected before handling any request
module.exports = async (req, res) => {
  // Wait for MongoDB to be fully connected before processing
  if (mongoose.connection.readyState !== 1) {
    await ensureDbConnected();
  }
  return app(req, res);
};
