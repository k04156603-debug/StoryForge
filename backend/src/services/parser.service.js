const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { cleanText } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Parse uploaded file based on type
 */
const parseFile = async (file) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  logger.info(`Parsing file: ${file.originalname} (${ext})`);

  switch (ext) {
    case 'pdf':
      return parsePdf(file.buffer);
    case 'docx':
      return parseDocx(file.buffer);
    case 'md':
    case 'txt':
      return parseText(file.buffer);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
};

/**
 * Parse PDF buffer to text
 */
const parsePdf = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    const text = cleanText(data.text);
    logger.info(`PDF parsed: ${data.numpages} pages, ${text.length} chars`);
    return {
      content: text,
      pageCount: data.numpages,
      fileType: 'pdf',
    };
  } catch (error) {
    logger.error('PDF parsing failed:', error.message);
    throw new Error('Failed to parse PDF file. Please ensure it is not corrupted or password-protected.');
  }
};

/**
 * Parse DOCX buffer to text
 */
const parseDocx = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = cleanText(result.value);
    logger.info(`DOCX parsed: ${text.length} chars`);
    if (result.messages.length > 0) {
      logger.warn('DOCX parse warnings:', result.messages);
    }
    return {
      content: text,
      fileType: 'docx',
    };
  } catch (error) {
    logger.error('DOCX parsing failed:', error.message);
    throw new Error('Failed to parse DOCX file. Please ensure it is a valid Word document.');
  }
};

/**
 * Parse plain text / markdown buffer
 */
const parseText = async (buffer) => {
  const text = cleanText(buffer.toString('utf-8'));
  return {
    content: text,
    fileType: 'markdown',
  };
};

/**
 * Detect file type from extension
 */
const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const typeMap = { pdf: 'pdf', docx: 'docx', md: 'markdown', txt: 'markdown' };
  return typeMap[ext] || 'paste';
};

module.exports = { parseFile, getFileType };
