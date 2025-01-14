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
        return res.status(500).json({
            message: err.message || 'Internal Server Error'
        });
    }
}


const sendResetPassword = async (req, res) => {

    try {

        const { email } = req.body;
        console.log(email);

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                message: 'User not found.'
            });
        }

        const token = generateJwt(user);

        user.passwordResetToken = token;
        await user.save();

        const resetLink = `http://localhost:5173/reset-password/?token=${token}`;
        await sendEmail(user.email, 'Password reset', `

            <div>
                <h3>Dear ${user.firstName},</h3>

            <p>Please click <a href="${resetLink}">here</a> to reset your password.</p>
            <p>Valid for 15 minutes.</p>

            <p>${resetLink}</p>

            <p>Kind regards,</p>
            <p>Wedding planner App, Team 2</p>
            </div>`);

        res.status(200).json({
            message: 'Password reset successfully. Please check your email inbox.'
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err
        });
    }
}


const resetPassword = async (req, res) => {

    try {

        const { user } = req;
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(404).json({
                message: 'Passwords do not match.'
            });
        }


        let hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        user.passwordResetToken = null;

        await user.save();

        res.status(200).json({
            message: 'Password successfully reset.'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Internal Server Error.',
            error: err
        });
    }


};

exports.signup = signup;
exports.login = login;
exports.sendResetPassword = sendResetPassword;
exports.resetPassword = resetPassword;
