const Quotation = require('../models/Quotation');
const Opportunity = require('../models/Opportunity');

// Helper to compute subtotal, tax, discount, grand total for quotation items
const calculateTotals = (items) => {
  let subTotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const processedItems = items.map(item => {
    const rawSub = item.quantity * item.unitPrice;
    const discAmount = rawSub * ((item.discount || 0) / 100);
    const taxedSub = rawSub - discAmount;
    const taxAmount = taxedSub * ((item.tax || 0) / 100);
    const itemSubtotal = taxedSub + taxAmount;

    subTotal += rawSub;
    discountTotal += discAmount;
    taxTotal += taxAmount;

    return {
      ...item,
      subtotal: itemSubtotal
    };
  });

  const grandTotal = subTotal - discountTotal + taxTotal;

  return {
    items: processedItems,
    subTotal,
    discountTotal,
    taxTotal,
    grandTotal
  };
};

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
exports.getQuotations = async (req, res, next) => {
  try {
    const { clientId, opportunityId } = req.query;
    const query = {};

    if (clientId) {
      const Client = require('../models/Client');
      const clientObj = await Client.findById(clientId);
      const queryOr = [{ associatedClient: clientId }];
      if (clientObj && clientObj.originOpportunity) {
        queryOr.push({ associatedOpportunity: clientObj.originOpportunity });
      }
      query.$or = queryOr;
    }
    if (opportunityId) query.associatedOpportunity = opportunityId;

    const quotations = await Quotation.find(query)
      .populate('associatedOpportunity', 'title clientName')
      .populate('associatedClient', 'companyName contactPerson')
      .populate('createdByUser', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quotation details
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('associatedOpportunity')
      .populate('associatedClient')
      .populate('createdByUser', 'name email');

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

// @desc    Create quotation
// @route   POST /api/quotations
// @access  Private
exports.createQuotation = async (req, res, next) => {
  try {
    const { items, associatedOpportunity, associatedClient, validUntil, status } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Please add at least one line item' });
    }

    const totals = calculateTotals(items);
    const quotationNumber = `QT-${Date.now().toString().slice(-6)}`;

    const quotation = await Quotation.create({
      quotationNumber,
      associatedOpportunity,
      associatedClient: associatedClient || undefined,
      items: totals.items,
      subTotal: totals.subTotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      validUntil,
      status,
      createdByUser: req.user._id
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quotation details
// @route   PUT /api/quotations/:id
// @access  Private
exports.updateQuotation = async (req, res, next) => {
  try {
    let quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    if (req.body.items) {
      const totals = calculateTotals(req.body.items);
      req.body.items = totals.items;
      req.body.subTotal = totals.subTotal;
      req.body.discountTotal = totals.discountTotal;
      req.body.taxTotal = totals.taxTotal;
      req.body.grandTotal = totals.grandTotal;
    }

    quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('associatedOpportunity').populate('associatedClient');

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private (Admin, Management)
exports.deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    await quotation.deleteOne();

    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    next(error);
  }
};
