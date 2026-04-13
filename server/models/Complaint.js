const mongoose = require('mongoose');

const upvoteSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
    required: true
  }
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['General', 'Personal']
  },
  block: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D']
  },
  floor: {
    type: String,
    required: true,
    enum: ['Ground', '1st', '2nd', '3rd']
  },
  room: {
    type: String,
    default: null
  },
  issue: {
    type: String,
    required: [true, 'Issue type is required']
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Progress', 'Done from Hostel Side', 'Work Completed', 'Upgraded'],
    default: 'Submitted'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  upvotes: {
    type: [upvoteSchema],
    default: []
  },
  adminNote: {
    type: String,
    default: ''
  },
  isAutoUpgraded: {
    type: Boolean,
    default: false
  },
  autoUpgradedFromRooms: {
    type: [String],
    default: []
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  isRejected: {
    type: Boolean,
    default: false
  },
  rejectionNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
complaintSchema.index({ block: 1, floor: 1, status: 1 });
complaintSchema.index({ submittedBy: 1, type: 1 });
complaintSchema.index({ resolvedAt: 1 });
complaintSchema.index({ type: 1, block: 1, floor: 1, issue: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
