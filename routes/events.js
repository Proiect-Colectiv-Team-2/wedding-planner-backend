const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const participantController = require("../controllers/participantController");

// GET /events - Get all events
router.get('/', eventController.getAllEvents);

// Post/events - Create event
router.post('/', eventController.createEvent);

// PUT /events - Modify event
router.put('/:id', eventController.updateEvent);

// DELETE /events - Delete event
router.delete('/:id', eventController.deleteEvent);


router.post("/:eventId/participants", participantController.createParticipant);

router.get("/:eventId/participants", participantController.getParticipants);

router.delete("/:eventId/participants/:userId", participantController.removeParticipant);

module.exports = router;
