const ScheduleItem = require('../models/ScheduleItem');
const Event = require('../models/Event');
const {validationResult} = require('express-validator');

// Get all schedule items
exports.getAllScheduleItems = async (req, res) => {
    try {
        const scheduleItems = await ScheduleItem.find()
            .populate('event');
        res.json(scheduleItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create schedule item
exports.createScheduleItem = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({message: 'Invalid data provided.', errors});
    }

    try {
        const { eventId, title, description, startTime, endTime } = req.body;
        const existingEvent = await Event.findById(eventId);

        if (!existingEvent)
            return res.status(404).json({ message: 'Event not found' });

        const scheduleItem = new ScheduleItem({
            event: eventId, title, description, startTime, endTime
        });

        await scheduleItem.save();

        existingEvent.scheduleItems.push(scheduleItem);

        await existingEvent.save();

        res.status(201).json({
            message: 'Schedule item successfully',
            data: { scheduleItem }
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err});
    }
}

// Update schedule item
exports.updateScheduleItem = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({message: 'Invalid data provided.', errors});
    }
    
    try {
        const scheduleItemId = req.params.id;

        const scheduleItem = await ScheduleItem.findById(scheduleItemId);

        if (!scheduleItem) {
            return res.status(404).json({ message: "Schedule item not found" });
        }

        const { title, description, startTime, endTime } = req.body;

        scheduleItem.title = title || scheduleItem.title;
        scheduleItem.description = description || scheduleItem.description;
        scheduleItem.startTime = startTime || scheduleItem.startTime;
        scheduleItem.endTime = endTime || scheduleItem.endTime;

        await scheduleItem.save();

        res.status(200).json({
            message: 'Schedule item successfully updated',
            data: { scheduleItem }
        });
    }
    catch(err){
        res.status(500).json({message: 'Internal server error'});
    }
}


// Delete schedule item
exports.deleteScheduleItem = async (req, res) => {
    try{
        const scheduleItemId = req.params.id;
        const scheduleItem = ScheduleItem.findById(scheduleItemId);
        
        if(!scheduleItem){
            return res.status(404).json({message: 'Schedule item not found'});
        }

        await scheduleItem.deleteOne();

        return res.status(204).send();
    }
    catch(err){
        return res.status(500).json({message: 'Internal server error'});
    }
}