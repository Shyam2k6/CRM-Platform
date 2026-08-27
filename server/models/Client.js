const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Please add a company name'],
      unique: true
    },
    contactPerson: {
      type: String,
      required: [true, 'Please add a contact person name']
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String
    },
    address: {
      type: String
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    originOpportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Client', ClientSchema);
