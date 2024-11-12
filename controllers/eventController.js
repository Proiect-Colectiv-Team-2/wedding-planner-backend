const Event = require('../models/Event');

// Function to validate event name
const isValidName = (name) => /^[A-Za-z0-9\s]+$/.test(name) && name.length <= 100;

// Function to validate event address
const isValidAddress = (address) => /^[A-Za-z0-9\s,.\-\/]+$/.test(address) && address.length <= 100;


// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('organizers invitations scheduleItems photos');
        res.json(events);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

exports.createEvent = async (req, res) => {

    // Validate event name
    if (!isValidName(name)) {
        return res.status(400).json({message: 'Event name must contain only letters, numbers and spaces and be no longer than 100 characters'});
    }

    // Validate event address
    if (!isValidAddress(address)) {
        return res.status(400).json({ message: 'Event address must contain only letters, numbers, spaces, and ,.-/ and be no longer than 100 characters' });
    }

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
        res.status(400).json({message: err.message});
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({message: 'Event not found'});
        }

        res.json({message: 'Event deleted successfully'});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

exports.updateEvent = async (req, res) => {

    const {id} = req.params;
    const {name, startDateTime, endDateTime, organizers, invitations, scheduleItems, address, photos} = req.body;

    // Validate event name
    if (name && !isValidName(name)) {
        return res.status(400).json({message: 'Event name must contain only letters, numbers and spaces and be no longer than 100 characters'});
    }

    // Validate event address
    if (address && !isValidAddress(address)) {
        return res.status(400).json({ message: 'Event address must contain only letters, numbers, spaces, and ,.-/ and be no longer than 100 characters' });
    }

    try {

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            {
                name,
                startDateTime,
                endDateTime,
                organizers,
                invitations,
                scheduleItems,
                address,
                photos,
            },
            {new: true}
        );

        if (!updatedEvent) {
            return res.status(404).json({message: 'Event not found'});
        }

        res.json({message: 'Event updated successfully', event: updatedEvent});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};


