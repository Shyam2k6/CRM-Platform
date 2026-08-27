const mongoose = require('mongoose');

const QuotationItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Please add item description']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Please add unit price'],
    min: [0, 'Unit price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax percentage cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const QuotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true
    },
    associatedOpportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true
    },
    associatedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    items: [QuotationItemSchema],
    subTotal: {
      type: Number,
      required: true,
      default: 0
    },
    discountTotal: {
      type: Number,
      default: 0
    },
    taxTotal: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
      default: 'Draft'
    },
    validUntil: {
      type: Date
    },
    createdByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Quotation', QuotationSchema);
