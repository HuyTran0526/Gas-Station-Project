const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['landlord', 'tenant'],
    default: 'tenant'
  },
  phone: {
    type: String,
    default: ''
  },
  resetPasswordOtp: {
    type: String
  },
  resetPasswordOtpExpires: {
    type: Date
  },
  fcmTokens: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
