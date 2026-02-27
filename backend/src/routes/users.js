/**
 * users.js
 * مسارات المستخدمين
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(protect);

router.get('/search', userController.searchUsers);
router.get('/friends', userController.getFriends);
router.post('/friends/request', userController.sendFriendRequest);
router.put('/friends/respond', userController.respondToFriendRequest);
router.post('/block', userController.blockUser);
router.delete('/block/:id', userController.unblockUser);
router.get('/:id', userController.getUserProfile);

module.exports = router;
