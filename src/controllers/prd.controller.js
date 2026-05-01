const prdService = require('../services/prd.service');
const { asyncHandler } = require('../utils/helpers');

/**
 * Upload a PRD file
 * POST /api/prd/upload
 */
const uploadPrd = asyncHandler(async (req, res) => {
  let prd;

  if (req.file) {
    prd = await prdService.createFromFile(req.file, req.body.title);
  } else if (req.body.content) {
    prd = await prdService.createFromPaste(req.body.content, req.body.title);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Please provide a file or paste PRD content',
    });
  }

  res.status(201).json({
    success: true,
    data: {
      id: prd._id,
      title: prd.title,
      fileType: prd.fileType,
      charCount: prd.charCount,
      status: prd.status,
      estimatedTime: prd.metadata.estimatedTime,
    },
  });
});

/**
 * Start processing a PRD
 * POST /api/prd/:id/process
 */
const processPrd = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Start processing in background
  prdService.processPrd(id).catch((err) => {
    // Error is already logged and saved to DB in the service
  });

  res.json({
    success: true,
    message: 'Processing started',
    data: { id },
  });
});

/**
 * Get PRD status
 * GET /api/prd/:id
 */
const getPrd = asyncHandler(async (req, res) => {
  const prd = await prdService.getPrdById(req.params.id);

  res.json({
    success: true,
    data: {
      id: prd._id,
      title: prd.title,
      fileType: prd.fileType,
      charCount: prd.charCount,
      status: prd.status,
      processingProgress: prd.processingProgress,
      processingMessage: prd.processingMessage,
      error: prd.error,
      metadata: prd.metadata,
      createdAt: prd.createdAt,
      updatedAt: prd.updatedAt,
    },
  });
});

/**
 * Get all PRDs
 * GET /api/prd
 */
const getAllPrds = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await prdService.getAllPrds(page, limit);

  res.json({
    success: true,
    data: result.prds,
    pagination: {
      page: result.page,
      pages: result.pages,
      total: result.total,
    },
  });
});

/**
 * Delete a PRD
 * DELETE /api/prd/:id
 */
const deletePrd = asyncHandler(async (req, res) => {
  await prdService.deletePrd(req.params.id);
  res.json({ success: true, message: 'PRD deleted successfully' });
});

module.exports = { uploadPrd, processPrd, getPrd, getAllPrds, deletePrd };
