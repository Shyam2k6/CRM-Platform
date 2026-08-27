const express = require('express');
const { getLeads, getLead, createLead, updateLead, deleteLead } = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Management', 'Sales'), getLeads)
  .post(authorize('Admin', 'Management', 'Sales'), createLead);

router.route('/:id')
  .get(authorize('Admin', 'Management', 'Sales'), getLead)
  .put(authorize('Admin', 'Management', 'Sales'), updateLead)
  .delete(authorize('Admin', 'Management'), deleteLead);

module.exports = router;
