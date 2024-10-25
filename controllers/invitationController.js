const Invitation = require('../models/Invitation');

// Get all invitations
exports.getAllInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find()
            .populate('event')
            .populate('user');
        res.json(invitations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
