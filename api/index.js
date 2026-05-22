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
  try {
    // Always await the connection promise — covers cold starts AND
    // the race condition where readyState is 2 (connecting)
    await ensureDbConnected();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database connection failed. Please try again in a few seconds.',
    });
    return;
  }
  return app(req, res);
};
