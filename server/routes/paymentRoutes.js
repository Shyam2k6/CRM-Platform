const express = require('express');
const { getPayments, recordPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Management', 'Finance'), getPayments)
  .post(authorize('Admin', 'Management', 'Finance'), recordPayment);

module.exports = router;
