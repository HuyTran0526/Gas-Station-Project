const mongoose = require('mongoose');

const GasLogSchema = new mongoose.Schema({
  
  ppm: {
    type: Number,
    required: true
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    
    index: { expires: '2h' }
  }
});

module.exports = mongoose.model('GasLog', GasLogSchema);
