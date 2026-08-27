const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// @desc    Get all activities (optionally filtered by associated entity)
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res, next) => {
  try {
    const { associatedId, associatedType } = req.query;
    const query = {};

    if (associatedId) query.associatedId = associatedId;
    if (associatedType) query.associatedType = associatedType;

    const activities = await Activity.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create activity
// @route   POST /api/activities
// @access  Private
exports.createActivity = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    if (req.body.followUpDate) {
      req.body.followUpStatus = 'Pending';
    }

    const activity = await Activity.create(req.body);

    // If follow-up is scheduled, trigger a notification reminder
    if (req.body.followUpDate) {
      await Notification.create({
        recipient: req.user._id,
        title: `Follow-up Scheduled: ${req.body.title}`,
        message: `A follow-up is due on ${new Date(req.body.followUpDate).toLocaleDateString()}`,
        type: 'Follow-up',
        relatedId: activity._id,
        relatedModel: 'Activity'
      });
    }

    await activity.populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Update follow-up status (Complete/Pending)
// @route   PUT /api/activities/:id/status
// @access  Private
exports.updateFollowUpStatus = async (req, res, next) => {
  try {
    const { followUpStatus } = req.body;

    let activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    activity.followUpStatus = followUpStatus;
    await activity.save();

    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming follow-ups
// @route   GET /api/activities/upcoming
// @access  Private
exports.getUpcomingFollowUps = async (req, res, next) => {
  try {
    const followUps = await Activity.find({
      createdBy: req.user._id,
      followUpStatus: 'Pending',
      followUpDate: { $exists: true }
    })
      .sort({ followUpDate: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: followUps.length,
      data: followUps
    });
  } catch (error) {
    next(error);
  }
};
