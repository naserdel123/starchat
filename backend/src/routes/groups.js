/**
 * groups.js
 * مسارات المجموعات
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const groupController = require('../controllers/groupController');

router.use(protect);

router.post('/', groupController.createGroup);
router.post('/:id/messages', groupController.sendGroupMessage);
router.post('/:id/members', groupController.addMember);
router.post('/:id/invite', groupController.createInviteLink);

module.exports = router;
