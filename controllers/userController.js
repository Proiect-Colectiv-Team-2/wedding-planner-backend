const User = require('../models/User');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate('eventsOrganized eventsParticipated');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
