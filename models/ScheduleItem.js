const mongoose = require('mongoose');

const ScheduleItemSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    description: String,
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
});

module.exports = mongoose.model('ScheduleItem', ScheduleItemSchema);
