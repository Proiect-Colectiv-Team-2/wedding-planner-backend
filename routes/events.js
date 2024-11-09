const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// GET /events - Get all events
router.get('/', eventController.getAllEvents);

// Post/events - Create event
router.post('/', eventController.createEvent);

// PUT /events - Modify event
router.put('/:id', eventController.updateEvent);

// DELETE /events - Delete event
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
