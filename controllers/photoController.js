const Photo = require('../models/Photo');

// Get photos by event ID
exports.getPhotosByEventId = async (req, res) => {
    try {
        const photos = await Photo.find({ event: req.params.id })
            .populate('user', 'name email') // Optional: Populate user details (e.g., name, email)
            .sort({ uploadedAt: -1 }); // Sort photos by upload date (newest first)
        res.json(photos);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch photos.' });
    }
};