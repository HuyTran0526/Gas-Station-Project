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
