const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Datastore = require('nedb');

// Use NeDB for a local, installation-free database
const sessionsDB = new Datastore({ filename: 'sessions.db', autoload: true });

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

router.post('/', auth, (req, res) => {
  try {
    const { durationMinutes, notesPlayed, instrumentsUsed } = req.body;

    const newSession = {
      user: req.user.userId,
      durationMinutes,
      notesPlayed,
      instrumentsUsed,
      date: new Date()
    };

    sessionsDB.insert(newSession, (err, session) => {
        if (err) return res.status(500).send('Server Error');
        res.json(session);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/stats', auth, (req, res) => {
  try {
    sessionsDB.find({ user: req.user.userId }).sort({ date: -1 }).exec((err, sessions) => {
      if (err) return res.status(500).send('Server Error');

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
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
