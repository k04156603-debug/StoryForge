const logger = require('../utils/logger');

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000;

/**
 * Retry wrapper with exponential backoff for AI API calls
 */
const withRetry = async (fn, options = {}) => {
  const maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;
  const baseDelay = options.baseDelay || DEFAULT_BASE_DELAY;
  const context = options.context || 'AI call';

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) {
        logger.info(`${context} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      const isRetryable = isRetryableError(error);

      logger.warn(`${context} attempt ${attempt}/${maxRetries} failed: ${error.message}`, {
        retryable: isRetryable,
      });

      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      logger.info(`Retrying ${context} in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Determine if an error is retryable
 */
const isRetryableError = (error) => {
  // Rate limit errors
  if (error.status === 429) return true;
  // Server errors
  if (error.status >= 500) return true;
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
  // OpenAI specific
  if (error.message?.includes('overloaded')) return true;
  // JSON parse errors (AI sometimes returns bad JSON, retry may fix)
  if (error.message?.includes('not valid JSON')) return true;

  return false;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { withRetry };
