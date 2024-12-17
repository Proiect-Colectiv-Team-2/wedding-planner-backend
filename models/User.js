const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String },
    firstName: String,
    lastName: String,
    role: { type: String, enum: ['Organizer', 'Participant'], required: true },
    eventsOrganized: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    eventsParticipated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    passwordResetToken: String
});

module.exports = mongoose.model('User', UserSchema);
