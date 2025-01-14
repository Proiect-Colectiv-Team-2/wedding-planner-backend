const Event = require('../models/Event');
const Photo = require('../models/Photo');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const ExcelJS = require('exceljs');

// Function to validate event name
const isValidName = (name) => name.length > 0 && name.length <= 100;

// Function to validate event address
const isValidAddress = (address) => address.length > 0 && address.length <= 100;

const isCurrentUsersEvent = (user, eventId) => {
    const organized = user.eventsOrganized.filter(id => id.toString() === eventId);
    const participated = user.eventsParticipated.filter(id => id.toString() === eventId);

    return organized.length || participated.length;
}

// Get all events
exports.getAllEvents = async (req, res) => {

    const userId = req.user._id;

    try {

        const user = await User.findById(userId).select('eventsOrganized eventsParticipated');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const uniqueEventIds = Array.from(new Set([
            ...user.eventsOrganized.map(id => id.toString()),
            ...user.eventsParticipated.map(id => id.toString())
        ]));

        const events = await Event.find({ _id: { $in: uniqueEventIds } })
            .populate('organizers invitations scheduleItems photos');

        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single event by ID
exports.getEventById = async (req, res) => {

    try {
        const user = req.user;
        const eventId = req.params.id;

        if (!isCurrentUsersEvent(user, eventId)) {

            return res.status(404).json({
                message: 'Event not found.'
            });
        }

        const organized = user.eventsOrganized.filter(id => id.toString() === eventId);
        const participated = user.eventsParticipated.filter(id => id.toString() === eventId);

        if (!organized.length && !participated.length) {
            return res.status(404).json({
                message: 'Event not found.'
            });
        }

        const event = await Event.findById(eventId)
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

        // Validation for Event Name
        if (!isValidName(req.body.name)) {
            return res.status(400).json({
                message: 'Event name must contain only letters, numbers, and spaces and be no longer than 100 characters.'
            });
        }

        // Validation for Event Address
        if (!isValidAddress(req.body.address)) {
            return res.status(400).json({
                message: 'Event address must contain only letters, numbers, spaces, and ,.-/ and be no longer than 100 characters.'
            });
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

        // Update each organizer's eventsOrganized array
        await Promise.all(
            organizers.map(async (organizerId) => {
                await User.findByIdAndUpdate(
                    organizerId,
                    { $push: { eventsOrganized: newEvent._id } },
                    { new: true, useFindAndModify: false }
                );
            })
        );

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

        const eventId = req.params.id;
        const user = req.user;

        // Check if the user is an organizer of the event
        const isOrganizer = user.eventsOrganized.some(id => id.toString() === eventId);

        if (!isOrganizer) {
            return res.status(403).json({
                message: 'You are not authorized to delete this event.'
            });
        }
        const event = await Event.findByIdAndDelete(eventId);

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

        const eventId = req.params.id;
        const { user } = req;

        // Check if the user is an organizer of the event
        const isOrganizer = user.eventsOrganized.some(id => id.toString() === eventId);

        if (!isOrganizer) {
            return res.status(403).json({
                message: 'You are not authorized to update this event.'
            });
        }

        // Prepare the update object
        const updateData = {
            name: req.body.name,
            startDateTime: req.body.startDateTime,
            endDateTime: req.body.endDateTime,
            address: req.body.address,
        };

        // Validation for Event Name
        if (req.body.name && !isValidName(req.body.name)) {
            return res.status(400).json({
                message: 'Event name must contain only letters, numbers, and spaces and be no longer than 100 characters.'
            });
        }

        // Validation for Event Address
        if (req.body.address && !isValidAddress(req.body.address)) {
            return res.status(400).json({
                message: 'Event address must contain only letters, numbers, spaces, and ,.-/ and be no longer than 100 characters.'
            });
        }

        // Update the event details first
        const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, { new: true });

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
            const newPhoto = new Photo({
                event: updatedEvent._id,
                user: photoUser,
                photoURL: photoURL,
            });

            await newPhoto.save();
            console.log(`New photo added: ${newPhoto._id}`);

            // Add the new photo's ID to the beginning of the photos array
            updatedEvent.photos.unshift(newPhoto._id);

            // Save the updated event with the new photo
            await updatedEvent.save();
            console.log(`Updated Event with new Photo: ${newPhoto._id}`);
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

//Export events to Excel
exports.exportEventsToExcel = async (req, res) => {
    try {
        const events = await Event.find().populate('organizers', 'email firstName lastName');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Events');

        // Add headers
        worksheet.columns = [
            { header: 'Event Name', key: 'name', width: 30 },
            { header: 'Start Date & Time', key: 'startDateTime', width: 30 },
            { header: 'End Date & Time', key: 'endDateTime', width: 30 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'Organizers', key: 'organizers', width: 50 },
        ];

        // Add rows
        events.forEach((event) => {
            worksheet.addRow({
                name: event.name,
                startDateTime: new Date(event.startDateTime).toLocaleString(),
                endDateTime: new Date(event.endDateTime).toLocaleString(),
                address: event.address,
                organizers: event.organizers.map((org) => org.email).join(', '),
            });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Events.xlsx"');

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error exporting events to Excel' });
    }
};
