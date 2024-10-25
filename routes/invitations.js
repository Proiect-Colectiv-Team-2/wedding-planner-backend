const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

// GET /invitations - Get all invitations
router.get('/', invitationController.getAllInvitations);

module.exports = router;
