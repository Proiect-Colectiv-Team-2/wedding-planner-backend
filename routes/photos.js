const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');

// GET /photos - Get all photos
router.get('/', photoController.getAllPhotos);

module.exports = router;
