// backend/routes/transactions.js
const router = require('express').Router();
const Transaction = require('../models/transaction');
const { convertToIST } = require('../utils/dateUtils');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find();
    // Convert timestamps to IST for each transaction
    const transactionsWithIST = transactions.map(transaction => {
      const transactionObj = transaction.toObject();
      const istTimestamp = convertToIST(transactionObj.timestamp);
      return {
        ...transactionObj,
        timestamp: istTimestamp,
        createdAt: convertToIST(transactionObj.createdAt),
        updatedAt: convertToIST(transactionObj.updatedAt)
      };
    });
    res.json(transactionsWithIST);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user transactions
router.get('/user/:address', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userAddress: req.params.address.toLowerCase()
    });
    // Convert timestamps to IST for each transaction
    const transactionsWithIST = transactions.map(transaction => {
      const transactionObj = transaction.toObject();
      const istTimestamp = convertToIST(transactionObj.timestamp);
      return {
        ...transactionObj,
        timestamp: istTimestamp,
        createdAt: convertToIST(transactionObj.createdAt),
        updatedAt: convertToIST(transactionObj.updatedAt)
      };
    });
    res.json(transactionsWithIST);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  console.log('Received transaction request:', req.body);
  
  try {
    // Validate required fields
    if (!req.body.transactionHash || !req.body.userAddress || !req.body.type) {
      console.error('Missing required fields:', req.body);
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create a new Date object for the current time
    const currentDate = new Date();
    console.log('Current UTC time:', currentDate.toISOString());

    const transaction = new Transaction({
      transactionHash: req.body.transactionHash,
      userAddress: req.body.userAddress.toLowerCase(),
      type: req.body.type,
      amount: req.body.amount || '0',
      status: req.body.status || 'pending',
      timestamp: currentDate
    });

    console.log('Attempting to save transaction:', transaction);
    const newTransaction = await transaction.save();
    
    // Convert timestamps to IST for the response
    const transactionObj = newTransaction.toObject();
    const istTimestamp = convertToIST(transactionObj.timestamp);
    const transactionWithIST = {
      ...transactionObj,
      timestamp: istTimestamp,
      createdAt: convertToIST(transactionObj.createdAt),
      updatedAt: convertToIST(transactionObj.updatedAt)
    };
    
    console.log('Transaction saved successfully:', transactionWithIST);
    res.status(201).json(transactionWithIST);
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update transaction status
router.patch('/:hash/status', async (req, res) => {
  try {
    console.log('Updating transaction status:', {
      hash: req.params.hash,
      newStatus: req.body.status
    });

    const transaction = await Transaction.findOne({ transactionHash: req.params.hash });
    if (!transaction) {
      console.error('Transaction not found:', req.params.hash);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    console.log('Found transaction:', transaction);
    transaction.status = req.body.status;
    const updatedTransaction = await transaction.save();
    console.log('Transaction status updated:', updatedTransaction);
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;