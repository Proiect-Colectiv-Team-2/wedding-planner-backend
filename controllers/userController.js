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

// Create a new user
exports.createUser = async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;

    // Note: Passwords are not hashed in this simplified setup.
    // In a production environment, ensure passwords are hashed before storing.

    const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        eventsOrganized: [],
        eventsParticipated: [],
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        // Handle errors such as duplicate email
        res.status(400).json({ message: err.message });
    }
};
