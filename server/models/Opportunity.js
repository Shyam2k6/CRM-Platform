const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an opportunity title']
    },
    clientName: {
      type: String,
      required: [true, 'Please add a company or client name']
    },
    associatedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    associatedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    dealValue: {
      type: Number,
      required: [true, 'Please specify an estimated deal value'],
      min: [0, 'Deal value cannot be negative']
    },
    stage: {
      type: String,
      enum: ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
      default: 'New'
    },
    probability: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    expectedCloseDate: {
      type: Date
    },
    assignedSalesperson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Opportunity', OpportunitySchema);
