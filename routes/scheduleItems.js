const express = require('express');
const router = express.Router();
const scheduleItemController = require('../controllers/scheduleItemController');

// GET /scheduleitems - Get all schedule items
router.get('/', scheduleItemController.getAllScheduleItems);

module.exports = router;
