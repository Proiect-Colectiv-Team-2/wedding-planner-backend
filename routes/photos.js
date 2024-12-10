const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');  // Your photoController that handles the logic
const multer = require('multer');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'eventPhotos'); // Adjust path if needed
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename for each uploaded file
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

// Routes
router.get('/', photoController.getAllPhotos);  // Get all photos
router.post('/', upload.single('photo'), photoController.addPhotoToEvent);  // Upload a new photo
router.delete('/:photoId', photoController.deletePhoto);  // Delete a photo by its ID

module.exports = router;
