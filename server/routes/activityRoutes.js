const express = require('express');
const { getActivities, createActivity, updateFollowUpStatus, getUpcomingFollowUps } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getActivities)
  .post(createActivity);

router.route('/upcoming')
  .get(getUpcomingFollowUps);

router.route('/:id/status')
  .put(updateFollowUpStatus);

module.exports = router;
