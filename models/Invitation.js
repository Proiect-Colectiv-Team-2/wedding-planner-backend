const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    email: { type: String, required: true },
    name: String,
    status: { type: String, enum: ['Pending', 'Confirmed', 'Declined'], default: 'Pending' },
    invitationLink: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null if no account yet
});

module.exports = mongoose.model('Invitation', InvitationSchema);
