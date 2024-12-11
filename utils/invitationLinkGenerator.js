const crypto = require('crypto');

const generateInvitationLink = () => {
    return crypto.randomBytes(20).toString('hex');
};

module.exports = generateInvitationLink;
