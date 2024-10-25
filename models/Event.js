const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    invitations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invitation' }],
    scheduleItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ScheduleItem' }],
    address: String,
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
});

module.exports = mongoose.model('Event', EventSchema);
