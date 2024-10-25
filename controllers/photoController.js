const Photo = require('../models/Photo');

// Get all photos
exports.getAllPhotos = async (req, res) => {
    try {
        const photos = await Photo.find()
            .populate('event')
            .populate('user');
        res.json(photos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
