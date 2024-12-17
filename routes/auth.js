const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup',
    [
        check('firstName')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Firstname is required.'),
        check('lastName')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Lastname is required.'),
        check('email')
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage('Please provide a valid email.'),
        check('password')
            .trim()
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long.'),
        check('passwordConfirm')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords do not match.')
                }
                return true
            }),
        check('role')
            .trim()
            .isIn(['Organizer', 'Participant'])
            .withMessage('Role must be either "Organizer" or "Participant".')
    ],
    authController.signup
);

router.post('/login',
    [
        check('email')
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage('Please provide a valid email.'),
        check('password')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Password is required')
    ],
    authController.login
);
router.post('/:userId/reset-password', authController.sendResetPassword);

module.exports = router;