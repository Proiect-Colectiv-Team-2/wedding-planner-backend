const ScheduleItem = require('../models/ScheduleItem');
const Event = require('../models/Event')

// Get all schedule items
exports.getAllScheduleItems = async (req, res) => {
    try {
        const scheduleItems = await ScheduleItem.find()
            .populate('event');
        res.json(scheduleItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create schedule item
exports.createScheduleItem = async (req, res) => {
    try {
        const { eventId, title, description, startTime, endTime } = req.body;
        const existingEvent = Event.findById(eventId);

        if (!existingEvent)
            return res.status(404).json({ message: 'Event not found' });

        const scheduleItem = new ScheduleItem({
            event: eventId, title, description, startTime, endTime
        });

        await scheduleItem.save();

        existingEvent.scheduleItems.push(scheduleItem._id);

        await existingEvent.save();

        res.status(201).json({
            message: 'Schedule item successfully',
            data: { scheduleItem }
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
}
