const mongoose = require('mongoose');

const DeviceStateSchema = new mongoose.Schema({
  
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
