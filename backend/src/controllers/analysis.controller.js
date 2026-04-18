const analysisService = require('../services/analysis.service');
const { asyncHandler } = require('../utils/helpers');

/**
 * Get quality issues for a PRD
 * GET /api/analysis/:prdId/issues
 */
const getIssues = asyncHandler(async (req, res) => {
  const { prdId } = req.params;
  const filters = {
    severity: req.query.severity,
    issueType: req.query.type,
    resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
  };

  const issues = await analysisService.getIssuesByPrd(prdId, filters);
  res.json({ success: true, data: issues });
});

/**
 * Get quality summary
 * GET /api/analysis/:prdId/summary
 */
const getSummary = asyncHandler(async (req, res) => {
  const summary = await analysisService.getQualitySummary(req.params.prdId);
  res.json({ success: true, data: summary });
});

/**
 * Resolve an issue
 * PATCH /api/analysis/issues/:id/resolve
 */
const resolveIssue = asyncHandler(async (req, res) => {
  const issue = await analysisService.resolveIssue(req.params.id);
  res.json({ success: true, data: issue });
});

/**
 * Get dependency graph
 * GET /api/analysis/:prdId/dependencies
 */
const getDependencies = asyncHandler(async (req, res) => {
  const graph = await analysisService.getDependencyGraph(req.params.prdId);
  res.json({ success: true, data: graph });
});

module.exports = { getIssues, getSummary, resolveIssue, getDependencies };
