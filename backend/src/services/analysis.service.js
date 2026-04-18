const QualityIssue = require('../models/QualityIssue');
const DependencyGraph = require('../models/DependencyGraph');
const ApiError = require('../utils/ApiError');

/**
 * Get quality issues for a PRD
 */
const getIssuesByPrd = async (prdId, filters = {}) => {
  const query = { prdId };
  if (filters.severity) query.severity = filters.severity;
  if (filters.issueType) query.issueType = filters.issueType;
  if (filters.resolved !== undefined) query.resolved = filters.resolved;

  const issues = await QualityIssue.find(query).sort({ severity: 1, createdAt: -1 });
  return issues;
};

/**
 * Get quality summary stats
 */
const getQualitySummary = async (prdId) => {
  const issues = await QualityIssue.find({ prdId });

  const summary = {
    total: issues.length,
    bySeverity: { blocker: 0, warning: 0, suggestion: 0 },
    byType: {},
    resolved: 0,
    unresolved: 0,
  };

  issues.forEach((issue) => {
    summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] || 0) + 1;
    summary.byType[issue.issueType] = (summary.byType[issue.issueType] || 0) + 1;
    if (issue.resolved) summary.resolved++;
    else summary.unresolved++;
  });

  return summary;
};

/**
 * Mark an issue as resolved
 */
const resolveIssue = async (issueId) => {
  const issue = await QualityIssue.findByIdAndUpdate(
    issueId,
    { resolved: true },
    { new: true }
  );
  if (!issue) throw ApiError.notFound('Quality issue not found');
  return issue;
};

/**
 * Get dependency graph for a PRD
 */
const getDependencyGraph = async (prdId) => {
  const graph = await DependencyGraph.findOne({ prdId });
  if (!graph) throw ApiError.notFound('Dependency graph not found');
  return graph;
};

module.exports = {
  getIssuesByPrd,
  getQualitySummary,
  resolveIssue,
  getDependencyGraph,
};
