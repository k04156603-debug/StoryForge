const mongoose = require('mongoose');

const prdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'PRD title is required'],
      trim: true,
      maxlength: 200,
    },
    originalFilename: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'markdown', 'paste'],
      default: 'paste',
    },
    rawContent: {
      type: String,
      required: [true, 'PRD content is required'],
    },
    cleanedContent: {
      type: String,
    },
    charCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['uploaded', 'parsing', 'extracting', 'generating', 'analyzing', 'completed', 'failed'],
      default: 'uploaded',
    },
    processingProgress: {
      type: Number, // 0-100
      default: 0,
    },
    processingMessage: {
      type: String,
      default: '',
    },
    jobId: {
      type: String,
      index: true,
    },
    error: {
      type: String,
    },
    metadata: {
      estimatedTime: Number,
      actualTime: Number,
      featureCount: Number,
      storyCount: Number,
      issueCount: Number,
    },
    createdBy: {
      type: String, // user ID from JWT
    },
  },
  {
    timestamps: true,
  }
);

prdSchema.index({ status: 1, createdAt: -1 });
prdSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Prd', prdSchema);
