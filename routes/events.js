const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const participantController = require("../controllers/participantController");
// const { authenticate, authorize } = require('../middleware/authMiddleware');

// Routes related to Events (example with auth)
// router.get('/', authenticate, eventController.getAllEvents);
// router.post('/', authenticate, authorize('Organizer'), eventController.createEvent);
// router.get('/:id', authenticate, eventController.getEventById);
// router.put('/:id', authenticate, authorize('Organizer'), eventController.updateEvent);
// router.delete('/:id', authenticate, authorize('Organizer'), eventController.deleteEvent);

router.get('/', eventController.getAllEvents);
router.post('/', eventController.createEvent);
router.get('/:id', eventController.getEventById);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);


router.post("/:eventId/participants", participantController.createParticipant);

router.get("/:eventId/participants", participantController.getParticipants);

router.delete("/:eventId/participants/:userId", participantController.removeParticipant);

module.exports = router;
