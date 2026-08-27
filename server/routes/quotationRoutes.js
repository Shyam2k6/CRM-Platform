const express = require('express');
const { getQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation } = require('../controllers/quotationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Management', 'Sales', 'Project Manager', 'Finance'), getQuotations)
  .post(authorize('Admin', 'Management', 'Sales'), createQuotation);

router.route('/:id')
  .get(authorize('Admin', 'Management', 'Sales'), getQuotation)
  .put(authorize('Admin', 'Management', 'Sales'), updateQuotation)
  .delete(authorize('Admin', 'Management'), deleteQuotation);

module.exports = router;
