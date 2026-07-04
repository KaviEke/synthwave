const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  notesPlayed: {
    type: Number,
    required: true
  },
  instrumentsUsed: [{
    type: String,
    enum: ['violin', 'drum', 'piano']
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', sessionSchema);
