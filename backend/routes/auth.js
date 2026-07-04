const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'music_motion_super_secret_key';

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  console.log('Received register request with body:', req.body);
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      console.log('Missing parameters');
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check for duplicate username
    const existingByUsername = await User.findOne({ username });
    if (existingByUsername) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    // Check for duplicate email
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Securely hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to MongoDB
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    const user = await newUser.save();
    
    console.log('User registered successfully:', user._id);
    const payload = { userId: user._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Find user in MongoDB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'No account found with that username.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
