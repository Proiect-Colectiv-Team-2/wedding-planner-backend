const User = require("../models/User");
const Event = require("../models/Event");
const Invitation = require("../models/Invitation");

exports.createParticipant = async (req, res, next) => {
    try
   { const eventId = req.params.eventId;
    const userId = req.body.userId;

    const event = await Event.findById(eventId);
    const user = await User.findById(userId);

    if(!event){
        return res.status(404).json({message: "Event not found"});
    }

    if(!user){
        return res.status(404).json({message: "User not found"});
    }

    if(event.organizers.includes(userId) || event.invitations.includes(userId)){
        return res.status(400).json({message: "User is already a participant"});
    }

    event.invitations.push(userId);

    await event.save();

    res.status(200).json({message: "Participant added successfully"});
    }
    catch(err){
        res.status(500).json({message: "Error: ", err});
    }
} 

exports.getParticipants = async (req, res, next) => {
    try
   { const eventId = req.params.eventId;

    const event = await Event.findById(eventId).populate("invitations", "email firstname lastname");

    if(!event){
        return res.status(404).json({message: "Event not found"});
    }

    res.status(200).json({participants: event.invitations});

    }
    catch(err){
        res.status(500).json({message: "Error: ", err});
    }
}

exports.removeParticipant = async (req, res, next) => {
    try
   { const eventId = req.params.eventId;
    const userId = req.params.userId;

    const event = await Event.findById(eventId);
    const user = await User.findById(userId);

    if(!event){
        return res.status(404).json({message: "Event not found"});
    }

    if(!event.invitations.includes(userId)){
        return res.status(400).json({message: "User is not a participant"});
    }

    event.invitations = event.invitations.filter(id => id.toString() !== userId);

    await event.save();

    res.status(200).json({message: "Participant removed successfully"});

    }
    catch(err){
        res.status(500).json({message: "Error: ", err});
    }
} 