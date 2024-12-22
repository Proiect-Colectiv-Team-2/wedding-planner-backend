require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User');
const Event = require('./models/Event');
const Invitation = require('./models/Invitation');
const Photo = require('./models/Photo');
const ScheduleItem = require('./models/ScheduleItem');

const generateInvitationLink = require('./utils/invitationLinkGenerator');

(async function main() {
    try {
        const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

        await mongoose.connect(uri);
        console.log('Connected to MongoDB.');

        // --- 2. CLEAR EXISTING DATA ---
        await clearDatabase();

        // --- 3. CREATE USERS ---
        const [organizer, participant1, participant2] = await createUsers();

        // --- 4. CREATE EVENTS ---
        const event1 = await createEvent(
            "Sarah & David's Wedding",
            new Date('2025-06-15T15:00:00'),
            new Date('2025-06-15T23:00:00'),
            organizer._id,
            "1234 Cherry Blossom Lane, Springfield"
        );

        const event2 = await createEvent(
            "Michael & Tia's Wedding",
            new Date('2025-09-10T16:00:00'),
            new Date('2025-09-10T22:00:00'),
            organizer._id,
            "5678 Oak Street, Lakeside"
        );

        const event3 = await createEvent(
            "Jason & Emily's Wedding",
            new Date('2025-12-01T14:00:00'),
            new Date('2025-12-01T21:30:00'),
            organizer._id,
            "91 Main Boulevard, Rivertown"
        );

        // --- 5. ASSIGN PARTICIPANTS TO EVENTS ---
        await addParticipantToEvent(participant1, event1); // participant1 in event1
        await addParticipantToEvent(participant2, event2); // participant2 in event2
        await addParticipantToEvent(participant2, event3); // participant2 in event3

        // --- 6. CREATE SCHEDULE ITEMS (example) ---
        await createScheduleItem(event1, {
            title: 'Ceremony',
            description: 'Main ceremony in the chapel',
            startTime: new Date('2025-06-15T15:30:00'),
            endTime: new Date('2025-06-15T16:00:00'),
        });
        await createScheduleItem(event1, {
            title: 'Cocktail Hour',
            description: 'Drinks and appetizers in the garden',
            startTime: new Date('2025-06-15T16:30:00'),
            endTime: new Date('2025-06-15T17:30:00'),
        });

        await createScheduleItem(event2, {
            title: 'Outdoor Ceremony',
            description: 'Lakeside vow exchange',
            startTime: new Date('2025-09-10T16:15:00'),
            endTime: new Date('2025-09-10T17:00:00'),
        });
        await createScheduleItem(event2, {
            title: 'Reception',
            description: 'Dinner, speeches, and dancing',
            startTime: new Date('2025-09-10T17:30:00'),
            endTime: new Date('2025-09-10T21:30:00'),
        });

        await createScheduleItem(event3, {
            title: 'Welcome Gathering',
            description: 'Guests arrive, sign guestbook, find seating',
            startTime: new Date('2025-12-01T14:00:00'),
            endTime: new Date('2025-12-01T14:30:00'),
        });
        await createScheduleItem(event3, {
            title: 'Wedding Party Intro',
            description: 'Introduction of the bride and groom',
            startTime: new Date('2025-12-01T14:30:00'),
            endTime: new Date('2025-12-01T14:45:00'),
        });

        // --- 7. ADD PHOTOS TO EVENTS (example) ---
        const photosData = [
            {
                photoURL:
                    "https://images.unsplash.com/photo-1485700281629-290c5a704409?q=80&w=3569&auto=format&fit=crop"
            },
            {
                photoURL:
                    "https://images.unsplash.com/photo-1515626553181-0f218cb03f14?q=80&w=3571&auto=format&fit=crop"
            },
            {
                photoURL:
                    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=3569&auto=format&fit=crop"
            }
        ];

        await addPhotosToEvent(event1, organizer, [photosData[0]]);
        await addPhotosToEvent(event2, organizer, [photosData[1]]);
        await addPhotosToEvent(event3, organizer, [photosData[2]]);

        console.log('Seeding complete. Closing connection...');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error while seeding:', err);
        process.exit(1);
    }
})();

/**
 * Clears all docs in each collection.
 */
async function clearDatabase() {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Invitation.deleteMany({}); // Important
    await Photo.deleteMany({});
    await ScheduleItem.deleteMany({});
    console.log('Existing data cleared.');
}

/**
 * Creates 3 users:
 *  1. organizer@gmail.com (Organizer)
 *  2. participant1@gmail.com (Participant)
 *  3. participant2@gmail.com (Participant)
 */
async function createUsers() {
    const passwordPlain = '1234';
    const hashedPassword = await bcrypt.hash(passwordPlain, 12);

    const userData = [
        {
            email: 'organizer@gmail.com',
            password: hashedPassword,
            firstName: 'Amanda',
            lastName: 'Williams',
            role: 'Organizer',
        },
        {
            email: 'participant1@gmail.com',
            password: hashedPassword,
            firstName: 'James',
            lastName: 'Carter',
            role: 'Participant',
        },
        {
            email: 'participant2@gmail.com',
            password: hashedPassword,
            firstName: 'Alice',
            lastName: 'Nguyen',
            role: 'Participant',
        },
    ];

    const createdUsers = await User.insertMany(userData);
    console.log('Created users:', createdUsers.map(u => u.email));
    return createdUsers;
}

/**
 * Creates an event with the given data.
 * `organizerId` is added to the "organizers" array.
 */
async function createEvent(name, startDateTime, endDateTime, organizerId, address) {
    const event = new Event({
        name,
        startDateTime,
        endDateTime,
        organizers: [organizerId],
        invitations: [],
        scheduleItems: [],
        address,
        photos: [],
    });
    const savedEvent = await event.save();

    // Also push this event to the organizer's eventsOrganized
    await User.findByIdAndUpdate(organizerId, {
        $push: { eventsOrganized: savedEvent._id }
    });

    console.log(`Event created: ${savedEvent.name}`);
    return savedEvent;
}

/**
 * Adds a participant to an event:
 * 1) Add the event to user's eventsParticipated
 * 2) Create an Invitation with a unique link
 * 3) Mark it as "Confirmed" or "Pending" in the seeder
 * 4) push invitation._id to event.invitations
 */
async function addParticipantToEvent(participant, event) {
    // 1) Add the event to the participant's eventsParticipated if not already there
    if (!participant.eventsParticipated.includes(event._id)) {
        participant.eventsParticipated.push(event._id);
        await participant.save();
        console.log(`User ${participant.email} -> added to eventsParticipated of ${event.name}.`);
    }

    // 2) Create an Invitation doc
    // Generate unique invitationLink
    const link = generateInvitationLink();

    const invitation = new Invitation({
        event: event._id,
        email: participant.email,
        name: participant.firstName + ' ' + participant.lastName,
        status: 'Confirmed', // or "Pending"
        user: participant._id,
        invitationLink: link, // Must be unique
    });

    // 3) Save invitation
    await invitation.save();

    // 4) push invitation._id to event.invitations
    if (!event.invitations.includes(invitation._id)) {
        event.invitations.push(invitation._id);
        await event.save();
        console.log(`Invitation doc (Confirmed) created for ${participant.email} -> event.invitations for ${event.name}.`);
    }
}

/**
 * Creates a schedule item, then pushes it into event.scheduleItems.
 */
async function createScheduleItem(event, { title, description, startTime, endTime }) {
    const scheduleItem = new ScheduleItem({
        event: event._id,
        title,
        description,
        startTime,
        endTime
    });

    const savedScheduleItem = await scheduleItem.save();
    event.scheduleItems.push(savedScheduleItem._id);
    await event.save();
    console.log(`Created schedule item "${title}" for event "${event.name}".`);
}

/**
 * Adds photo(s) to an event with references to the user who uploaded it.
 */
async function addPhotosToEvent(event, user, photos) {
    for (const { photoURL } of photos) {
        const photoDoc = new Photo({
            event: event._id,
            user: user._id,
            photoURL,
        });
        const savedPhoto = await photoDoc.save();
        event.photos.push(savedPhoto._id);
    }
    await event.save();
    console.log(`Added ${photos.length} photo(s) to event "${event.name}".`);
}
