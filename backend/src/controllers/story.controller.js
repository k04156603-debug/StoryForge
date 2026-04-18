const storyService = require('../services/story.service');
const { asyncHandler } = require('../utils/helpers');

/**
 * Get all stories for a PRD
 * GET /api/stories/:prdId
 */
const getStories = asyncHandler(async (req, res) => {
  const { prdId } = req.params;
  const grouped = req.query.grouped === 'true';

  let data;
  if (grouped) {
    data = await storyService.getStoriesGroupedByFeature(prdId);
  } else {
    data = await storyService.getStoriesByPrd(prdId);
  }

  res.json({ success: true, data });
});

/**
 * Get a single story
 * GET /api/stories/detail/:id
 */
const getStory = asyncHandler(async (req, res) => {
  const story = await storyService.getStoryById(req.params.id);
  res.json({ success: true, data: story });
});

/**
 * Update a story
 * PUT /api/stories/:id
 */
const updateStory = asyncHandler(async (req, res) => {
  const story = await storyService.updateStory(req.params.id, req.body);
  res.json({ success: true, data: story });
});

/**
 * Get story statistics
 * GET /api/stories/:prdId/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await storyService.getStoryStats(req.params.prdId);
  res.json({ success: true, data: stats });
});

module.exports = { getStories, getStory, updateStory, getStats };
