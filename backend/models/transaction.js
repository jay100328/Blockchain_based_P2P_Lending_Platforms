// backend/models/Transaction.js
const mongoose = require('mongoose');
const { convertToIST } = require('../utils/dateUtils');

const transactionSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  userAddress: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['borrow', 'lend', 'repay'],
    required: true
  },
  amount: {
    type: String,  // Store as string to handle BigInt values
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    get: function(date) {
      return convertToIST(date);
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true, // This will add createdAt and updatedAt fields
  toJSON: { getters: true } // This ensures the getter for timestamp is used when converting to JSON
});

module.exports = mongoose.model('Transaction', transactionSchema);