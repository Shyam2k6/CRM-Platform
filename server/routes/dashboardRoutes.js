const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(authorize('Admin', 'Management', 'Project Manager', 'Sales', 'Finance'), getDashboardStats);

module.exports = router;
