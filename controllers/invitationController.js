const Invitation = require('../models/Invitation');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const generateInvitationLink = require('../utils/invitationLinkGenerator');

exports.createInvitations = async (req, res) => {
    try {
        const { eventId, invitations } = req.body;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const createdInvitations = [];

        for (const invite of invitations) {
            const invitationLink = generateInvitationLink();
            const newInvitation = new Invitation({
                event: eventId,
                email: invite.email,
                name: invite.name,
                invitationLink: invitationLink,
            });

            await newInvitation.save();
            createdInvitations.push(newInvitation);

            // <-- IMPORTANT: push the invitation ID into the event
            event.invitations.push(newInvitation._id);

            // Construct invitation URL and send email, etc.
            const invitationUrl = `http://localhost:5173/invite/${invitationLink}`;
            await sendEmail(
                invite.email,
                'Event Invitation',
                `You are invited to ${event.name}. Confirm: ${invitationUrl}`
            );
        }

        // <-- Save the event to persist invitations
        await event.save();

        res.status(201).json({
            message: 'Invitations sent successfully',
            invitations: createdInvitations,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.confirmInvitationWithUser = async (req, res) => {
    try {
        const { token } = req.params;
        const { userId } = req.body; // Pass userId in the POST body
        const invitation = await Invitation.findOne({ invitationLink: token });

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        // Mark invitation as confirmed
        invitation.status = 'Confirmed';

        // Link the invitation to the user (if not already set)
        invitation.user = userId;
        await invitation.save();

        // Now, add the event to the user's `eventsParticipated`
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Push the event only if it doesn't exist yet
        if (!user.eventsParticipated.includes(invitation.event)) {
            user.eventsParticipated.push(invitation.event);
            await user.save();
        }

        return res.status(200).json({
            message: 'Participation confirmed',
            invitation,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.declineInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const invitation = await Invitation.findOne({ invitationLink: token });

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        invitation.status = 'Declined';
        await invitation.save();

        res.status(200).json({ message: 'Participation declined' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// invitationController.js
exports.getInvitationDetails = async (req, res) => {
    try {
        const { token } = req.params;
        const invitation = await Invitation.findOne({ invitationLink: token })
            .populate('event');

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        // Return event name, invitation email, current status, etc.
        res.status(200).json({
            eventName: invitation.event.name,
            email: invitation.email,
            status: invitation.status
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
