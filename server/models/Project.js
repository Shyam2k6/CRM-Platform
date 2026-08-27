const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: [true, 'Please add a project name']
    },
    associatedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Please link a client account']
    },
    associatedOpportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity'
    },
    associatedQuotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation'
    },
    budget: {
      type: Number,
      required: [true, 'Please add a project budget'],
      min: [0, 'Budget cannot be negative']
    },
    startDate: {
      type: Date
    },
    deadline: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'On Hold', 'Completed'],
      default: 'Not Started'
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    description: {
      type: String
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Project', ProjectSchema);
