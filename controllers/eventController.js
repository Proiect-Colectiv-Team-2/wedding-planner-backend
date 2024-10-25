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
