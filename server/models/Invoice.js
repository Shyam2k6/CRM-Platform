const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Please add description']
  },
  amount: {
    type: Number,
    required: [true, 'Please add amount'],
    min: [0, 'Amount cannot be negative']
  }
});

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },
    associatedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Please link a client']
    },
    associatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    items: [InvoiceItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    dueAmount: {
      type: Number,
      required: true,
      default: 0
    },
    dueDate: {
      type: Date,
      required: [true, 'Please specify a due date']
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue'],
      default: 'Draft'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
