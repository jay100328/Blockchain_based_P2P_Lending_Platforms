// backend/routes/users.js
const router = require('express').Router();
const User = require('../models/user');

// Register new user
router.post('/register', async (req, res) => {
  const user = new User({
    walletAddress: req.body.walletAddress.toLowerCase(),
    userType: req.body.userType
  });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user profile
router.get('/:address', async (req, res) => {
  try {
    const user = await User.findOne({
      walletAddress: req.params.address.toLowerCase()
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;