const util = require('util');
// Polyfill for older libraries (like NeDB) failing on Node.js v25
if (!util.isDate) util.isDate = (d) => d instanceof Date;
if (!util.isRegExp) util.isRegExp = (re) => re instanceof RegExp;
if (!util.isArray) util.isArray = Array.isArray;

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'] // Prioritize raw websockets for zero-latency
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/session', apiRoutes);

// Database Connection logging (now using built-in NeDB inside routes)
console.log('Using Local NeDB Flat-File Database');

// Socket.io Real-time Communication
io.on('connection', (socket) => {
  console.log('A device connected:', socket.id);

  // Hardware sends device status (e.g. { status: 'active', deviceId: 'esp32_1' })
  socket.on('device_status', (data) => {
    console.log(`📡 Device ID "${data.deviceId}" status update:`, data.active ? 'ACTIVE' : 'INACTIVE');
    io.emit('update_status', data);
  });

  // Hardware triggers a note (e.g. { instrument: 'violin', note: 'A4' })
  socket.on('note_played', (data) => {
    console.log('Note Played:', data);
    io.emit('play_note', data);
  });

  // Relay autotune configuration from web to hub
  socket.on('autotune_config', (data) => {
    console.log('Autotune Config Update:', data);
    io.emit('autotune_setup', data);
  });

  // Relay real-time hardware stutter data (from gyro) -> to web dash
  socket.on('set_stutter', (data) => {
    io.emit('set_stutter', data);
  });

  // Relay real-time audio from web to hub
  // Notice we don't console.log this to avoid flooding the terminal (runs ~10+ times a second)
  socket.on('audio_stream', (data) => {
    // Relay raw audio buffer to all connected clients (specifically the Pi Hub)
    socket.broadcast.emit('audio_stream', data);
  });

  socket.on('disconnect', () => {
    console.log('Device disconnected:', socket.id);
  });
});

// Export the Express app for Vercel Serverless Functions
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (Bound to 0.0.0.0)`);
  });
}

