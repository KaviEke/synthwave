const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

const JWT_SECRET = process.env.JWT_SECRET || 'music_motion_super_secret_key';

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   POST api/session
// @desc    Create a performance session
router.post('/', auth, async (req, res) => {
  try {
    const { durationMinutes, notesPlayed, instrumentsUsed } = req.body;

    const newSession = new Session({
      user: req.user.userId,
      durationMinutes,
      notesPlayed,
      instrumentsUsed,
      date: new Date()
    });

    const session = await newSession.save();
    res.json(session);
  } catch (err) {
    console.error('Session save error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/session/stats
// @desc    Get session statistics for user
router.get('/stats', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.userId }).sort({ date: -1 });

    let totalTime = 0;
    let totalNotes = 0;
    const instrumentCount = { violin: 0, drum: 0, piano: 0, vocal: 0, flute: 0 };

    sessions.forEach(session => {
      totalTime += session.durationMinutes;
      totalNotes += session.notesPlayed;
      session.instrumentsUsed.forEach(inst => {
        if (instrumentCount[inst] !== undefined) {
          instrumentCount[inst]++;
        }
      });
    });

    res.json({
      totalSessions: sessions.length,
      totalTimeMinutes: totalTime,
      totalNotesPlayed: totalNotes,
      instrumentPreferences: instrumentCount,
      recentSessions: sessions.slice(0, 5)
    });
  } catch (err) {
    console.error('Session stats error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
