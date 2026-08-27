const express = require('express');
const { getOpportunities, getOpportunity, createOpportunity, updateOpportunity, deleteOpportunity } = require('../controllers/opportunityController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Management', 'Sales'), getOpportunities)
  .post(authorize('Admin', 'Management', 'Sales'), createOpportunity);

router.route('/:id')
  .get(authorize('Admin', 'Management', 'Sales'), getOpportunity)
  .put(authorize('Admin', 'Management', 'Sales'), updateOpportunity)
  .delete(authorize('Admin', 'Management'), deleteOpportunity);

module.exports = router;
