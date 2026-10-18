const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema({
  source: {
    type: String, // 'facebook', 'tiktok', 'direct', or custom UTM
    required: true,
    index: true
  },
  path: {
    type: String,
    default: '/'
  },
  referrer: {
    type: String,
    default: ''
  },
  device: {
    type: String, // 'mobile', 'desktop'
    default: 'desktop'
  },
  ip: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('TrafficLog', trafficLogSchema);
