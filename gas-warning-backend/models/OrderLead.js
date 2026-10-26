const mongoose = require('mongoose');

const OrderLeadSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  roomsCount: {
    type: Number,
    default: 1
  },
  packageType: {
    type: String,
    enum: ['basic', 'pro', 'building'],
    default: 'pro'
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'installed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OrderLead', OrderLeadSchema);
