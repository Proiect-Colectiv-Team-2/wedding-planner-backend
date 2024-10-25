const ScheduleItem = require('../models/ScheduleItem');

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
