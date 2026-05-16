const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const auth = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // For development, if no users exist, check against env vars
    let user = await User.findOne({ username });
    
    if (!user) {
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ id: 'admin', username: process.env.ADMIN_USERNAME }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, user: { username: process.env.ADMIN_USERNAME } });
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change Password
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    let user;
    if (req.user.id === 'admin') {
      if (currentPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      user = new User({
        username: req.user.username || process.env.ADMIN_USERNAME || 'admin',
        password: hashedPassword
      });
      await user.save();
      return res.json({ message: 'Password changed successfully' });
    } else {
      user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      
      return res.json({ message: 'Password changed successfully' });
    }
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
