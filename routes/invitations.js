const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

router.post('/', invitationController.createInvitations);
router.post('/confirm/:token', invitationController.confirmInvitationWithUser);
router.get('/decline/:token', invitationController.declineInvitation);
router.get('/:token/details', invitationController.getInvitationDetails);

module.exports = router;
