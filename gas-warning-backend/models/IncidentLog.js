const mongoose = require('mongoose');

const IncidentLogSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  roomName: {
    type: String,
    default: 'Phòng không xác định'
  },
  peakPpm: {
    type: Number,
    required: true,
    default: 600
  },
  severity: {
    type: String,
    enum: ['warning', 'danger'],
    default: 'danger'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  },
  actions: [
    {
      time: { type: Date, default: Date.now },
      type: { type: String, default: 'ACTION' },
      message: { type: String, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('IncidentLog', IncidentLogSchema);
