const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema(
  {
    prdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prd',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['core', 'secondary', 'nice-to-have', 'infrastructure'],
      default: 'core',
    },
    actors: [
      {
        type: String,
        trim: true,
      },
    ],
    flows: [
      {
        name: String,
        steps: [String],
      },
    ],
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex', 'very-complex'],
      default: 'moderate',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

featureSchema.index({ prdId: 1, order: 1 });

module.exports = mongoose.model('Feature', featureSchema);
