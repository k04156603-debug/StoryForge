const mongoose = require('mongoose');

const dependencyGraphSchema = new mongoose.Schema(
  {
    prdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prd',
      required: true,
      unique: true,
    },
    nodes: [
      {
        id: String,
        storyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'UserStory',
        },
        label: String,
        featureName: String,
        storyPoints: Number,
        priority: String,
        position: {
          x: Number,
          y: Number,
        },
      },
    ],
    edges: [
      {
        id: String,
        source: String, // node id
        target: String, // node id
        label: String,
        type: {
          type: String,
          enum: ['blocks', 'depends_on', 'related_to'],
          default: 'depends_on',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);




module.exports = mongoose.model('DependencyGraph', dependencyGraphSchema);
