const mongoose = require('mongoose');

const DeviceStateSchema = new mongoose.Schema({
  
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: 'DEFAULT_DEV',
    index: true
  },
  deviceName: {
    type: String,
    default: 'Trạm Gas Chính'
  },
  location: {
    type: String,
    default: 'Khu vực bếp'
  },
  ppm: {
    type: Number,
    required: true,
    default: 350
  },
  isOpen: {
    type: Boolean,
    required: true,
    default: true
  },
  isOn: {
    type: Boolean,
    required: true,
    default: false
  },
  isBuzzerMuted: {
    type: Boolean,
    required: true,
    default: false
  },
  isDangerMode: {
    type: Boolean,
    required: true,
    default: false
  },
  floor: {
    type: Number,
    default: 1
  },
  wing: {
    type: String,
    enum: ['north', 'south', 'single'],
    default: 'north'
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  kitchenCorner: {
    type: String,
    enum: ['left', 'right'],
    default: 'left'
  },
  inviteCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: function() {
      return 'SF-' + Math.floor(100 + Math.random() * 900);
    }
  },
  lastTestedAt: {
    type: Date,
    default: null
  },
  testScheduleDays: {
    type: Number,
    default: 30
  },
  testStatus: {
    type: String,
    enum: ['idle', 'testing', 'passed', 'warning'],
    default: 'idle'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


DeviceStateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DeviceState', DeviceStateSchema);
