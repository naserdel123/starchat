/**
 * messages.js
 * مسارات الرسائل
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiter');
const messageController = require('../controllers/messageController');

router.use(protect);

router.post('/', messageLimiter, messageController.sendMessage);
router.get('/:userId', messageController.getConversation);
router.put('/read', messageController.markAsRead);
router.post('/:id/reaction', messageController.addReaction);
router.delete('/:id', messageController.deleteMessage);
router.put('/:id', messageController.editMessage);

module.exports = router;
