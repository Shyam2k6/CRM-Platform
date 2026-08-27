const express = require('express');
const { getNotifications, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getNotifications);
router.route('/read-all').put(markAllRead);

module.exports = router;
