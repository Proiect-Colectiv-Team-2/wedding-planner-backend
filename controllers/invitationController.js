const Invitation = require('../models/Invitation');
const Event = require('../models/Event');
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

            const invitationUrl = `${req.protocol}://${req.get('host')}/invite/${invitationLink}`;
            await sendEmail(invite.email, 'Event Invitation', `You are invited to ${event.name}. Confirm your participation here: ${invitationUrl}`);
        }

        res.status(201).json({ message: 'Invitations sent successfully', invitations: createdInvitations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.confirmInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const invitation = await Invitation.findOne({ invitationLink: token });

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        invitation.status = 'Confirmed';
        await invitation.save();

        res.status(200).json({ message: 'Participation confirmed' });
    } catch (err) {
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
