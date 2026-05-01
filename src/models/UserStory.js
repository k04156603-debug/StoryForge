const mongoose = require('mongoose');

const userStorySchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    storyId: {
      type: String, // e.g., "US-001"
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    userStory: {
      type: String, // "As a [role], I want [action], so that [benefit]"
      required: true,
    },
    acceptanceCriteria: [
      {
        given: String,
        when: String,
        then: String,
      },
    ],
    edgeCases: [
      {
        type: String,
      },
    ],
    storyPoints: {
      type: Number,
      enum: [1, 2, 3, 5, 8, 13, 21],
      default: 3,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['draft', 'reviewed', 'approved', 'exported'],
      default: 'draft',
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserStory',
      },
    ],
    tags: [String],
    notes: String,
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userStorySchema.index({ prdId: 1, featureId: 1, order: 1 });
userStorySchema.index({ storyId: 1 });

module.exports = mongoose.model('UserStory', userStorySchema);
