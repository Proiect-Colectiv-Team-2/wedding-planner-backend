const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const signup = async (req, res, next) => {

    try {
        const { firstName, lastName, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(422).json({
                message: 'User already exists'
            });
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

        const saved = await newUser.save();


        const token = jwt.sign(
            {
                userId: newUser.id,
                email: newUser.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        res.status(201).json({
            user: newUser,
            token
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message || 'Internal Server Error'
        });

    }
}


const login = async (req, res, next) => {

    try {

        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(403).json({ message: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(password, existingUser.password);
        if (!isValidPassword) {
            return res.status(500).json({ message: 'Incorrect password.' });
        }

        const token = jwt.sign(
            {
                userId: existingUser.id,
                email: existingUser.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        res.status(200).json({
            user: existingUser,
            token
        });

    } catch (err) {
        return res.status(500), json({
            message: err.message || 'Internal Server Error'
        });
    }
}

exports.signup = signup;
exports.login = login;