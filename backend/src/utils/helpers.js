const { v4: uuidv4 } = require('uuid');

/**
 * Wrap an async route handler to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Generate a unique job ID
 */
const generateJobId = () => uuidv4();

/**
 * Clean text by removing excessive whitespace and control characters
 */
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/ {3,}/g, '  ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Truncate text to a maximum length
 */
const truncate = (text, maxLength = 200) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Calculate estimated processing time based on document length
 */
const estimateProcessingTime = (charCount) => {
  const baseTime = 30; // seconds
  const perThousandChars = 5; // seconds per 1000 chars
  return Math.ceil(baseTime + (charCount / 1000) * perThousandChars);
};

/**
 * Fibonacci story points
 */
const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];

const nearestFibonacci = (n) => {
  return FIBONACCI_POINTS.reduce((prev, curr) =>
    Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev
  );
};

module.exports = {
  asyncHandler,
  generateJobId,
  cleanText,
  truncate,
  estimateProcessingTime,
  nearestFibonacci,
  FIBONACCI_POINTS,
};
