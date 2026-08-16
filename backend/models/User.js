// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true
  },
  userType: {
    type: String,
    enum: ['borrower', 'lender', 'both'],
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  totalTransactions: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('User', userSchema);