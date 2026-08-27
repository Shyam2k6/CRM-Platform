const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'associatedInvoice',
        select: 'invoiceNumber totalAmount paidAmount dueAmount associatedClient',
        populate: {
          path: 'associatedClient',
          select: 'companyName'
        }
      })
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record payment for invoice
// @route   POST /api/payments
// @access  Private (Admin, Management, Finance)
exports.recordPayment = async (req, res, next) => {
  try {
    const { associatedInvoice, amount, paymentMethod, reference, notes, paymentDate } = req.body;

    const invoice = await Invoice.findById(associatedInvoice);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const payAmt = parseFloat(amount);
    if (payAmt <= 0) {
      return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero' });
    }

    if (payAmt > invoice.dueAmount) {
      return res.status(400).json({
        success: false,
        error: `Payment amount (₹${payAmt.toLocaleString()}) exceeds invoice remaining due amount (₹${invoice.dueAmount.toLocaleString()})`
      });
    }

    // Create the payment
    const payment = await Payment.create({
      associatedInvoice,
      amount: payAmt,
      paymentMethod,
      reference,
      notes,
      paymentDate: paymentDate || Date.now(),
      recordedBy: req.user._id
    });

    // Update invoice balances and status
    invoice.paidAmount += payAmt;
    invoice.dueAmount -= payAmt;

    if (invoice.dueAmount <= 0) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }

    await invoice.save();

    // Trigger Notification for payment receipt
    await Notification.create({
      recipient: invoice.associatedClient, // Notify client or sales/finance team
      recipient: req.user._id, // Notify user who recorded it or administrators
      title: `Payment Received: ${invoice.invoiceNumber}`,
      message: `Payment of ₹${payAmt.toLocaleString()} was logged for ${invoice.invoiceNumber}. Remaining balance: ₹${invoice.dueAmount.toLocaleString()}`,
      type: 'Finance',
      relatedId: payment._id,
      relatedModel: 'Payment'
    });

    res.status(201).json({
      success: true,
      message: 'Payment logged successfully',
      data: {
        payment,
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          paidAmount: invoice.paidAmount,
          dueAmount: invoice.dueAmount,
          status: invoice.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
