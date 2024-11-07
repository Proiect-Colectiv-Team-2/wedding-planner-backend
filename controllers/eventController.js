const Event = require('../models/Event');

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('organizers invitations scheduleItems photos');
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createEvent = async (req, res) => {
    const event = new Event({
        name: req.body.name,
        startDateTime: req.body.startDateTime,
        endDateTime: req.body.endDateTime,
        organizers: req.body.organizers,
        invitations: req.body.invitations,
        scheduleItems: req.body.scheduleItems,
        address: req.body.address,
        photos: req.body.photos,
    });

    try {
        const newEvent = await event.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};