const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { sendEmail } = require('../utils/emailService');
const User = require('../models/User');


const generateJwt = (user, expiresIn = '1h') => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn
        }
    );
}

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


        const token = generateJwt(saved);

        res.status(201).json({
            user: saved,
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

        const token = generateJwt(existingUser);

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


const sendResetPassword = async (req, res) => {

    try {

        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                message: 'User not found.'
            });
        }

        const expiresIn = '15m';
        const token = generateJwt(user, expiresIn);

        user.passwordResetToken = token;
        await user.save();

        const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
        await sendEmail(user.email, 'Password reset', `

            <div>
                <h3>Dear ${user.firstName},</h3>

            <p>Please click <a href="${resetLink}">here</a> to reset your password.</p>
            <p>Valid for ${expiresIn} minutes.</p>

            <p>${resetLink}</p>

            <p>Kind regards,</p>
            <p>Wedding planner App, Team 2</p>
            </div>`);

        res.status(200).json({
            message: 'Password reset successfully. Please check your inbox.'
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err
        });
    }
}

exports.signup = signup;
exports.login = login;
exports.sendResetPassword = sendResetPassword;