const pdfParse = require('pdf-parse/lib/pdf-parse.js');
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
    case 'pptx':
      return parsePptx(file.buffer);
    case 'ppt':
      return parsePpt(file.buffer);
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
 * Parse PPTX buffer to text by extracting slide XML elements
 */
const parsePptx = async (buffer) => {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    let textContent = '';

    // Sort slide entries numerically: ppt/slides/slide1.xml, ppt/slides/slide2.xml, ...
    const slideEntries = zipEntries
      .filter(entry => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt(b.entryName.replace(/[^0-9]/g, ''), 10) || 0;
        return numA - numB;
      });

    if (slideEntries.length === 0) {
      throw new Error('No slides found in the PowerPoint presentation.');
    }

    for (const entry of slideEntries) {
      const slideXml = entry.getData().toString('utf-8');
      
      // Extract text content from <a:t> tags
      const matches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g);
      if (matches) {
        const slideText = matches
          .map(match => match.replace(/<\/?a:t>/g, ''))
          .join(' ');
        textContent += slideText + '\n';
      }
    }

    const text = cleanText(textContent);
    logger.info(`PPTX parsed: ${slideEntries.length} slides, ${text.length} chars`);
    return {
      content: text,
      pageCount: slideEntries.length,
      fileType: 'pptx',
    };
  } catch (error) {
    logger.error('PPTX parsing failed:', error.message);
    throw new Error(error.message || 'Failed to parse PPTX file. Please ensure it is a valid PowerPoint document.');
  }
};

/**
 * Handle legacy PPT binary upload by presenting a helpful conversion warning
 */
const parsePpt = async (buffer) => {
  logger.warn('Legacy PPT upload attempted.');
  throw new Error(
    'Legacy PowerPoint (.ppt) files are not directly supported. Please save your presentation as modern PowerPoint (.pptx) or PDF format and try uploading again.'
  );
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
  const typeMap = {
    pdf: 'pdf',
    docx: 'docx',
    pptx: 'pptx',
    ppt: 'ppt',
    md: 'markdown',
    txt: 'markdown'
  };
  return typeMap[ext] || 'paste';
};

module.exports = { parseFile, getFileType };