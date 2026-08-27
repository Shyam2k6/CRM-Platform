const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an activity title']
    },
    type: {
      type: String,
      enum: ['Call', 'Email', 'Meeting', 'Note', 'System'],
      required: [true, 'Please specify activity type']
    },
    description: {
      type: String
    },
    followUpDate: {
      type: Date
    },
    followUpStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'None'],
      default: 'None'
    },
    associatedType: {
      type: String,
      required: true,
      enum: ['Lead', 'Opportunity', 'Client']
    },
    associatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'associatedType'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Activity', ActivitySchema);
