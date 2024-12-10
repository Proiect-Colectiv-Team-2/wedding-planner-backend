const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const participantController = require('../controllers/participantController');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');
const userRoleMiddleware = require('../middlewares/userRoleMiddleware');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'eventPhotos');
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Validate file type
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

router.use(authMiddleware);

// Routes
router.get('/', eventController.getAllEvents);
router.post('/', userRoleMiddleware(['Organizer']), upload.single('photo'), eventController.createEvent);
router.get('/:id', eventController.getEventById);
router.put('/:id', userRoleMiddleware(['Organizer']), upload.single('photo'), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.get('/export', eventController.exportEventsToExcel);

// Participant Routes
router.post("/:eventId/participants", participantController.createParticipant);
router.get("/:eventId/participants", participantController.getParticipants);
router.delete("/:eventId/participants/:userId", participantController.removeParticipant);

module.exports = router;
