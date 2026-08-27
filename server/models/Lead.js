const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a contact name']
    },
    company: {
      type: String,
      required: [true, 'Please add a company name']
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
    requirement: {
      type: String,
      required: [true, 'Please specify requirements']
    },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other'],
      default: 'Website'
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'],
      default: 'New'
    },
    assignedSalesperson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String
    },
    convertedToOpportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Lead', LeadSchema);
