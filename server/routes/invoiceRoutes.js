const express = require('express');
const { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Management', 'Finance', 'Sales', 'Project Manager'), getInvoices)
  .post(authorize('Admin', 'Management', 'Finance'), createInvoice);

router.route('/:id')
  .get(authorize('Admin', 'Management', 'Finance'), getInvoice)
  .put(authorize('Admin', 'Management', 'Finance'), updateInvoice)
  .delete(authorize('Admin', 'Management'), deleteInvoice);

module.exports = router;
