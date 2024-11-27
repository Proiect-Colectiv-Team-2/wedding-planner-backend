const express = require('express');
const { getPhotosByEventId } = require('../controllers/photoController');
const router = express.Router();

// Route to get all photos for a specific event
router.get('/events/:id/photos', getPhotosByEventId);

module.exports = router;