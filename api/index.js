const app = require('../src/app');
const connectDatabase = require('../src/config/database');

// Initialize database connection for Vercel Serverless
connectDatabase().catch(err => console.error('Vercel DB Connection Error:', err));

// Export the Express app so Vercel can handle it
module.exports = app;
