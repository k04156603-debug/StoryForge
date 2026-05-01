const express = require('express');
const storyController = require('../controllers/story.controller');
const { validate, prdIdSchema, storyUpdateSchema } = require('../middleware/validator');

const router = express.Router();

// Get all stories for a PRD (optionally grouped by feature)
router.get('/:prdId', storyController.getStories);

// Get story stats
router.get('/:prdId/stats', storyController.getStats);

// Get single story detail
router.get('/detail/:id', storyController.getStory);

// Update a story
router.put('/:id', validate(storyUpdateSchema), storyController.updateStory);

module.exports = router;
