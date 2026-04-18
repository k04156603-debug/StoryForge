const mongoose = require('mongoose');

const qualityIssueSchema = new mongoose.Schema(
  {
    prdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prd',
      required: true,
      index: true,
    },
    featureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feature',
    },
    issueType: {
      type: String,
      enum: ['ambiguity', 'missing_requirement', 'contradiction', 'undefined_actor', 'weak_language', 'incomplete_flow', 'security_gap', 'performance_gap'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['blocker', 'warning', 'suggestion'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String, // where in the PRD this issue was found
    },
    originalText: {
      type: String, // the problematic text
    },
    suggestedFix: {
      type: String,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

qualityIssueSchema.index({ prdId: 1, severity: 1 });

module.exports = mongoose.model('QualityIssue', qualityIssueSchema);
