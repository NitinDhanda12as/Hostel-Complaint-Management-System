const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true
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
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  isMHMC: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for fast lookups by block + floor
studentSchema.index({ block: 1, floor: 1 });

module.exports = mongoose.model('Student', studentSchema);
