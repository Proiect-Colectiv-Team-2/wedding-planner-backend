const Photo = require('../models/Photo');
const Event = require('../models/Event');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

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

// Add a photo to an event
exports.addPhotoToEvent = async (req, res) => {
    try {
        console.log('Received request to upload photo');

        const { eventId, userId } = req.body;
        console.log('Event ID:', eventId, 'User ID:', userId);

        // Validate eventId and userId
        if (!eventId || !userId) {
            return res.status(400).json({ message: 'eventId and userId are required.' });
        }

        // Check if the event exists
        const event = await Event.findById(eventId);
        if (!event) {
            console.log('Event not found');
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if a file is uploaded
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No photo file uploaded' });
        }

        // Construct the photo URL
        const photoURL = `${req.protocol}://${req.get('host')}/uploads/eventPhotos/${req.file.filename}`;
        console.log('Constructed photo URL:', photoURL);

        // Create the Photo document
        const newPhoto = new Photo({
            event: event._id,
            user: userId, // Use the actual userId
            photoURL: photoURL,
        });

        // Save the photo in the database
        const savedPhoto = await newPhoto.save();
        console.log('Photo saved:', savedPhoto);

        // Add the photo's ID to the event's photos array
        event.photos.push(savedPhoto._id);
        await event.save();
        console.log('Event updated with new photo:', event);

        // Optionally populate photos in the response
        const updatedEvent = await Event.findById(eventId).populate('photos');

        res.status(201).json({
            message: 'Photo uploaded successfully',
            event: updatedEvent,
        });
    } catch (err) {
        console.error('Error uploading photo:', err);
        res.status(500).json({ message: 'Failed to upload photo', error: err.message });
    }
};

// Delete a photo
exports.deletePhoto = async (req, res) => {
    try {
        const { photoId } = req.params;

        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ message: 'Photo not found.' });
        }

        // Optionally: delete photo file from disk
        const fs = require('fs');
        const filePath = `./public${photo.photoURL}`;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await photo.deleteOne();

        // Optionally return updated event data
        const updatedEvent = await Event.findById(photo.event).populate('photos');
        res.json(updatedEvent); // Return updated event
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
