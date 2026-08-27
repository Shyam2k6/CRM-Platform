const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    associatedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Please link an invoice']
    },
    amount: {
      type: Number,
      required: [true, 'Please specify payment amount'],
      min: [0.01, 'Payment amount must be greater than zero']
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Credit Card', 'Cash', 'UPI', 'Cheque'],
      required: [true, 'Please specify payment method']
    },
    reference: {
      type: String
    },
    notes: {
      type: String
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', PaymentSchema);
