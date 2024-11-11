const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const signup = async (req, res, next) => {

    const { firstName, lastName, email, password, role } = req.body;

    let existingUser;


    try {

        existingUser = await User.findOne({ email });
    } catch (err) {
        return res.status(500).json({ message: 'Signing up failed, please try again.' });
    }

    if (existingUser) {
        return res.status(409).json({ message: 'User already exists.' });
    }

    let hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        eventsOrganized: [],
        eventsParticipated: [],
    });

    try {
        await newUser.save();
    } catch (err) {
        return next(new Error('Failed to save user'))
    }

    let token;
    try {
        token = jwt.sign(
            {
                userId: newUser.id,
                email: newUser.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );
    } catch (err) {
        return res.status(500).json({ message: 'Signing up failed, please try again.' });
    }
}

exports.signup = signup;