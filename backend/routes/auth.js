const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Datastore = require('nedb');

// Use NeDB for a local, installation-free database
const usersDB = new Datastore({ filename: 'users.db', autoload: true });

const JWT_SECRET = process.env.JWT_SECRET || 'music_motion_super_secret_key';

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

    // Check for duplicate username first
    usersDB.findOne({ username }, (err, existingByUsername) => {
      if (err) {
        console.error('Find error:', err);
        return res.status(500).send('Server Error');
      }
      if (existingByUsername) {
        return res.status(400).json({ message: 'Username is already taken.' });
      }

      // Then check for duplicate email
      usersDB.findOne({ email }, async (err, existingByEmail) => {
        if (err) {
          console.error('Find error:', err);
          return res.status(500).send('Server Error');
        }
        if (existingByEmail) {
          return res.status(400).json({ message: 'An account with this email already exists.' });
        }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
      };

        usersDB.insert(newUser, (err, user) => {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).send('Server Error');
          }
          
          console.log('User inserted successfully:', user._id);
          const payload = { userId: user._id };
          const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

          res.status(201).json({ token, user: { id: user._id, username, email } });
        });
      });
    });
  } catch (err) {
    console.error('Catch error:', err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    usersDB.findOne({ username }, async (err, user) => {
      if (err) return res.status(500).send('Server Error');
      if (!user) {
        return res.status(400).json({ message: 'No account found with that username.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password. Please try again.' });
      }

      const payload = { userId: user._id };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
