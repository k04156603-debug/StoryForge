const exportService = require('../services/export.service');
const { asyncHandler } = require('../utils/helpers');

/**
 * Export stories
 * POST /api/export/:prdId
 */
const exportStories = asyncHandler(async (req, res) => {
  const { prdId } = req.params;
  const { format, storyIds } = req.body;

  let result;

  switch (format) {
    case 'csv':
      result = await exportService.exportCSV(prdId, storyIds);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.content);

    case 'markdown':
      result = await exportService.exportMarkdown(prdId, storyIds);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.content);

    case 'jira':
      result = await exportService.exportJira(prdId, storyIds);
      return res.json({ success: true, data: result });

    default:
      return res.status(400).json({ success: false, message: 'Invalid export format' });
  }
});

module.exports = { exportStories };
