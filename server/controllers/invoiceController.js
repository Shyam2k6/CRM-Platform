const Invoice = require('../models/Invoice');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { clientId, status } = req.query;
    const query = {};

    if (clientId) query.associatedClient = clientId;
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .populate('associatedClient', 'companyName contactPerson email')
      .populate('associatedProject', 'projectName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice details
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('associatedClient')
      .populate('associatedProject');

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private (Admin, Management, Finance)
exports.createInvoice = async (req, res, next) => {
  try {
    const { items, associatedClient, associatedProject, dueDate, status } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Invoice must contain at least one line item' });
    }

    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      associatedClient,
      associatedProject: associatedProject || undefined,
      items,
      totalAmount,
      dueAmount: totalAmount,
      dueDate,
      status: status || 'Draft'
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private (Admin, Management, Finance)
exports.updateInvoice = async (req, res, next) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (req.body.items) {
      req.body.totalAmount = req.body.items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      req.body.dueAmount = req.body.totalAmount - invoice.paidAmount;
      if (req.body.dueAmount <= 0) {
        req.body.status = 'Paid';
      } else if (invoice.paidAmount > 0) {
        req.body.status = 'Partially Paid';
      }
    }

    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('associatedClient').populate('associatedProject');

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin, Management)
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    await invoice.deleteOne();

    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};
