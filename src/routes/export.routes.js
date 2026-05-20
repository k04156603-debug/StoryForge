const express = require('express');
const exportController = require('../controllers/export.controller');
const { validate, exportSchema } = require('../middleware/validator');
const { protect, checkPrdAccess } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(checkPrdAccess);

// Export stories
router.post('/:prdId', validate(exportSchema), exportController.exportStories);

module.exports = router;
