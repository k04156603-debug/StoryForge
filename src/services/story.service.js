const UserStory = require('../models/UserStory');
const Feature = require('../models/Feature');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Get all stories for a PRD
 */
const getStoriesByPrd = async (prdId) => {
  const stories = await UserStory.find({ prdId })
    .populate('featureId', 'name category')
    .sort({ order: 1 });
  return stories;
};

/**
 * Get stories grouped by feature
 */
const getStoriesGroupedByFeature = async (prdId) => {
  const features = await Feature.find({ prdId }).sort({ order: 1 });
  const stories = await UserStory.find({ prdId }).sort({ order: 1 });

  const grouped = features.map((feature) => ({
    feature: {
      id: feature._id,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      priority: feature.priority,
    },
    stories: stories.filter((s) => s.featureId.toString() === feature._id.toString()),
  }));

  return grouped;
};

/**
 * Get a single story by ID
 */
const getStoryById = async (id) => {
  const story = await UserStory.findById(id).populate('featureId', 'name category');
  if (!story) throw ApiError.notFound('User story not found');
  return story;
};

/**
 * Update a story (for editing)
 */
const updateStory = async (id, updates) => {
  const story = await UserStory.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('featureId', 'name category');

  if (!story) throw ApiError.notFound('User story not found');
  logger.info(`Story ${id} updated`);
  return story;
};

/**
 * Get story statistics for a PRD
 */
const getStoryStats = async (prdId) => {
  const stories = await UserStory.find({ prdId });

  const stats = {
    total: stories.length,
    totalPoints: stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0),
    byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
    byStatus: { draft: 0, reviewed: 0, approved: 0, exported: 0 },
    avgPoints: 0,
  };

  stories.forEach((s) => {
    stats.byPriority[s.priority] = (stats.byPriority[s.priority] || 0) + 1;
    stats.byStatus[s.status] = (stats.byStatus[s.status] || 0) + 1;
  });

  stats.avgPoints = stories.length > 0 ? Math.round(stats.totalPoints / stories.length * 10) / 10 : 0;

  return stats;
};

module.exports = {
  getStoriesByPrd,
  getStoriesGroupedByFeature,
  getStoryById,
  updateStory,
  getStoryStats,
};
