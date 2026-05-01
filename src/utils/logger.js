// Simple logger for Vercel-friendly environments
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  http: (...args) => console.log('[HTTP]', ...args),
  debug: (...args) => console.debug('[DEBUG]', ...args),
};

module.exports = logger;
