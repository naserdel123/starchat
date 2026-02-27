/**
 * status.js
 * مسارات الحالات
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const statusController = require('../controllers/statusController');

router.use(protect);

router.post('/', statusController.createStatus);
router.get('/feed', statusController.getStatusFeed);
router.post('/:id/view', statusController.viewStatus);

module.exports = router;
