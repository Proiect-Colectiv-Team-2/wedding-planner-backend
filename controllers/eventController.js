const Event = require('../models/Event');
const Photo = require('../models/Photo');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('organizers invitations scheduleItems photos');
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizers', 'email firstName lastName') // Populate organizers with selected fields
            .populate('invitations') // Populate invitations
            .populate('scheduleItems') // Populate schedule items
            .populate('photos'); // Populate photos

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        // Ensure organizers is an array
        let organizers = req.body.organizers;
        if (!Array.isArray(organizers)) {
            organizers = [organizers];
        }

        // Create the event first without photos
        const event = new Event({
            name: req.body.name,
            startDateTime: req.body.startDateTime,
            endDateTime: req.body.endDateTime,
            organizers: organizers,
            invitations: req.body.invitations,
            scheduleItems: req.body.scheduleItems,
            address: req.body.address,
            photos: [], // Initialize photos array
        });

        const newEvent = await event.save();

        // Check if a file was uploaded
        if (req.file) {
            // Create the photoURL with full URL
            const photoURL = `${req.protocol}://${req.get('host')}/uploads/eventPhotos/${req.file.filename}`;

            // Get photoUser from req.body
            const photoUser = req.body.photoUser;

            // Create the Photo document
            const photo = new Photo({
                event: newEvent._id,
                user: photoUser, // Set to photoUser from req.body
                photoURL: photoURL,
            });

            const newPhoto = await photo.save();

            // Add the photo's ID to the beginning of the event's photos array
            newEvent.photos.unshift(newPhoto._id);

            // Save the updated event
            await newEvent.save();
        }

        // Optionally, populate the photos field before sending the response
        const populatedEvent = await Event.findById(newEvent._id).populate('photos');

        res.status(201).json(populatedEvent);

        // Debug logs (optional)
        console.log('req.protocol:', req.protocol);
        console.log('req.host:', req.get('host'));
        console.log('req.body:', req.body);
        console.log('req.file:', req.file);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Optionally, delete all associated photos
        if (event.photos && event.photos.length > 0) {
            for (const photoId of event.photos) {
                const photo = await Photo.findById(photoId);
                if (photo) {
                    const photoUrl = new URL(photo.photoURL);
                    const photoPath = path.join(__dirname, '..', photoUrl.pathname);

                    // Delete the photo file from the server
                    fs.unlink(photoPath, (err) => {
                        if (err) {
                            console.error('Error deleting photo file:', err);
                        }
                    });

                    // Delete the photo document
                    await Photo.findByIdAndDelete(photoId);
                }
            }
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update an existing event
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Prepare the update object
        const updateData = {
            name: req.body.name,
            startDateTime: req.body.startDateTime,
            endDateTime: req.body.endDateTime,
            address: req.body.address,
        };

        // Update the event details first
        const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if a new photo was uploaded and replacePhoto flag is set
        if (req.file && req.body.replacePhoto) {
            // Delete the old main photo
            if (updatedEvent.photos && updatedEvent.photos.length > 0) {
                const oldPhotoId = updatedEvent.photos[0];
                const oldPhoto = await Photo.findById(oldPhotoId);

                if (oldPhoto) {
                    // Parse the oldPhoto.photoURL to get the path
                    const oldPhotoUrl = new URL(oldPhoto.photoURL);
                    const oldPhotoPath = path.join(__dirname, '..', oldPhotoUrl.pathname); // pathname includes '/uploads/eventPhotos/filename.jpg'

                    // Remove the photo file from the server
                    fs.unlink(oldPhotoPath, (err) => {
                        if (err) {
                            console.error('Error deleting old photo file:', err);
                        } else {
                            console.log('Old photo file deleted:', oldPhotoPath);
                        }
                    });

                    // Remove the old photo document
                    await Photo.findByIdAndDelete(oldPhotoId);
                    console.log('Old photo document deleted:', oldPhotoId);

                    // Remove the old photo ID from the event's photos array
                    updatedEvent.photos.shift();
                }
            }

            // Create the photoURL with full URL for the new photo
            const photoURL = `${req.protocol}://${req.get('host')}/uploads/eventPhotos/${req.file.filename}`;

            // Get photoUser from req.body
            const photoUser = req.body.photoUser;

            // Create the new Photo document
            const photo = new Photo({
                event: updatedEvent._id,
                user: photoUser,
                photoURL: photoURL,
            });

            const newPhoto = await photo.save();

            // Add the new photo's ID to the beginning of the photos array
            updatedEvent.photos.unshift(newPhoto._id);

            // Save the updated event with the new photo
            await updatedEvent.save();

            console.log('New photo added:', newPhoto._id);
        }

        // Optionally, populate the photos field before sending the response
        const populatedEvent = await Event.findById(updatedEvent._id).populate('photos');

        res.json({ message: 'Event updated successfully', event: populatedEvent });

        // Debug logs (optional)
        console.log('req.protocol:', req.protocol);
        console.log('req.host:', req.get('host'));
        console.log('req.body:', req.body);
        console.log('req.file:', req.file);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
