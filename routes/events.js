const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// GET /events - Get all events
router.get('/', eventController.getAllEvents);

module.exports = router;
