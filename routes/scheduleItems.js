const express = require('express');
const router = express.Router();
const scheduleItemController = require('../controllers/scheduleItemController');

const { body, param } = require('express-validator');

// GET /scheduleitems - Get all schedule items
router.get('/', scheduleItemController.getAllScheduleItems);

router.post('/', [
    // eventId, title, description, startTime, endTime
    body('eventId')
        .notEmpty().withMessage('Event id is required')
        .isMongoId().withMessage('Event id is invalid'),
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required'),
    body('startTime')
        .isISO8601().withMessage('Start time must be a valid date'),
    body('endTime')
        .isISO8601().withMessage('End time must be a valid date'),
    body('startTime')
        .custom((value, { req }) => {
            if (new Date(value) >= new Date(req.body.endTime)) {
                throw new Error('Start time must be earlier than end time');
            }
            return true;
        })
], scheduleItemController.createScheduleItem);

router.patch('/:id', [
    body('title')
        .optional()
        .trim()
        .notEmpty().withMessage('Title is required'),
    body('description')
        .optional()
        .trim()
        .notEmpty().withMessage('Description is required'),
    body('startTime')
        .optional()
        .isISO8601().withMessage('Start time must be a valid date'),
    body('endTime')
        .optional()
        .isISO8601().withMessage('End time must be a valid date'),
    body('startTime')
        .optional()
        .custom((value, { req }) => {
            if (new Date(value) >= new Date(req.body.endTime)) {
                throw new Error('Start time must be earlier than end time');
            }
            return true;
        })
], scheduleItemController.updateScheduleItem);

router.delete('/:id', scheduleItemController.deleteScheduleItem);

module.exports = router;