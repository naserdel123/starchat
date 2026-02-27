/**
 * gifts.js
 * مسارات الهدايا
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const giftController = require('../controllers/giftController');

router.use(protect);

router.post('/purchase', giftController.purchaseStars);
router.post('/send', giftController.sendGift);
router.get('/balance', giftController.getBalance);
router.get('/transactions', giftController.getTransactions);

module.exports = router;
