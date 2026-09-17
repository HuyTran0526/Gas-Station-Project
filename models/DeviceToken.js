const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  platform: {
    type: String,
    default: 'android'
  },
  deviceModel: {
    type: String,
    default: ''
  },
  deviceId: {
    type: String,
    default: 'DEFAULT_DEV'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
