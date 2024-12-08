const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

router.post('/', invitationController.createInvitations);
router.get('/confirm/:token', invitationController.confirmInvitation);
router.get('/decline/:token', invitationController.declineInvitation);

module.exports = router;
