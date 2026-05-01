const express = require('express');
const analysisController = require('../controllers/analysis.controller');

const router = express.Router();

// Get quality issues
router.get('/:prdId/issues', analysisController.getIssues);

// Get quality summary
router.get('/:prdId/summary', analysisController.getSummary);

// Resolve an issue
router.patch('/issues/:id/resolve', analysisController.resolveIssue);

// Get dependency graph
router.get('/:prdId/dependencies', analysisController.getDependencies);

module.exports = router;
