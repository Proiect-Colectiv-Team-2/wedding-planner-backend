const express = require('express');
const router = express.Router();
const scheduleItemController = require('../controllers/scheduleItemController');

// GET /scheduleitems - Get all schedule items
router.get('/', scheduleItemController.getAllScheduleItems);

router.post('/', scheduleItemController.createScheduleItem);

router.patch('/:id', scheduleItemController.updateScheduleItem);

router.delete('/:id', scheduleItemController.deleteScheduleItem);

module.exports = router;