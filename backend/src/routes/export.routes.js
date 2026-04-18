const express = require('express');
const exportController = require('../controllers/export.controller');
const { validate, exportSchema } = require('../middleware/validator');

const router = express.Router();

// Export stories
router.post('/:prdId', validate(exportSchema), exportController.exportStories);

module.exports = router;
