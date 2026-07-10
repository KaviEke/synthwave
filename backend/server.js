const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
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

const connectDB = require('./config/db');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Connect to Database
connectDB();

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/session', apiRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Database Connection logging
console.log('Database configuration loaded.');

const crypto = require('crypto');
function getSafeTokenHash(tokenStr) {
  if (!tokenStr) return 'none';
  return crypto.createHash('sha256').update(String(tokenStr)).digest('hex').substring(0, 12);
}

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const role = socket.handshake.auth?.role;
  const deviceId = socket.handshake.auth?.deviceId;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  if (role === 'raspberry_pi' || role === 'simulator') {
    const receivedToken = String(token).trim();
    const expectedToken = String(process.env.PI_DEVICE_TOKEN || '').trim();
    
    if (process.env.AUTH_DEBUG === 'true') {
      console.log(`[AUTH DIAGNOSTICS] Role: ${role}`);
      console.log(`[AUTH DIAGNOSTICS] Expected Token Length: ${expectedToken.length}`);
      console.log(`[AUTH DIAGNOSTICS] Received Token Length: ${receivedToken.length}`);
      console.log(`[AUTH DIAGNOSTICS] Expected Hash (12 chars): ${getSafeTokenHash(expectedToken)}`);
      console.log(`[AUTH DIAGNOSTICS] Received Hash (12 chars): ${getSafeTokenHash(receivedToken)}`);
    }

    if (expectedToken && receivedToken === expectedToken) {
      socket.data.role = role;
      socket.data.deviceId = deviceId || 'unknown-device';
      socket.join('hardware-devices');
      return next();
    }
    return next(new Error('Authentication error: Invalid hardware token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = decoded;
    socket.data.role = 'browser';
    socket.join('web-clients');
    
    console.log(`[AUTH DIAGNOSTICS] Browser connected: ${socket.id}`);
    console.log(`[AUTH DIAGNOSTICS] Browser joined web-clients`);
    
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Global state cache for hardware devices
const hardwareStateCache = {};

// Socket.io Real-time Communication
io.on('connection', (socket) => {
  console.log(`🔌 Device connected: ${socket.id} (Role: ${socket.data.role})`);

  // If a web browser connects, send it the latest known hardware state immediately
  if (socket.data.role === 'browser') {
    Object.values(hardwareStateCache).forEach(state => {
      socket.emit('device_status', state);
    });
  }

  // --- EVENTS FROM HARDWARE (Broadcast to web-clients) ---
  socket.on('device_status', (data) => {
    hardwareStateCache[data.deviceId] = data;
    io.to('web-clients').emit('device_status', data);
  });

  socket.on('performance_event', (data) => {
    io.to('web-clients').emit('performance_event', data);
  });

  socket.on('sensor_frame', (data) => {
    io.to('web-clients').emit('sensor_frame', data);
  });

  socket.on('session_status', (data) => {
    io.to('web-clients').emit('session_status', data);
  });

  socket.on('command_result', (data) => {
    io.to('web-clients').emit('command_result', data);
  });

  // --- EVENTS FROM BROWSER (Send to hardware-devices) ---
  socket.on('hardware_command', (data) => {
    if (socket.data.role === 'browser') {
      io.to('hardware-devices').emit('hardware_command', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Device disconnected: ${socket.id}`);
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

