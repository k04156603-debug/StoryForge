const express = require('express');
const multer = require('multer');
const prdController = require('../controllers/prd.controller');
const { validate, prdUploadSchema, prdIdSchema } = require('../middleware/validator');
const { aiLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileSizeMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'text/plain'];
    const allowedExts = ['.pdf', '.docx', '.md', '.txt'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and Markdown files are allowed'), false);
    }
  },
});

// All PRD routes require authentication
router.use(protect);

// Upload PRD (file or paste)
router.post('/upload', upload.single('file'), validate(prdUploadSchema), prdController.uploadPrd);

// Start processing
router.post('/:id/process', validate(prdIdSchema), aiLimiter, prdController.processPrd);

// Get PRD status
router.get('/:id', validate(prdIdSchema), prdController.getPrd);

// List all PRDs
router.get('/', prdController.getAllPrds);

// Delete PRD
router.delete('/:id', validate(prdIdSchema), prdController.deletePrd);

module.exports = router;
