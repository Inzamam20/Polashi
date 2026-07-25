require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { registerHandlers } = require('./socket/handlers');
const { sweepStaleRooms } = require('./rooms/roomManager');
const { clearAfkTimer } = require('./socket/afkHandler');

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check endpoint — keeps Render from thinking the service is down
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));
app.get('/', (req, res) => res.json({ name: 'Polashi - Backend', status: 'running' }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  // Reconnection: preserve socket ID for 30 seconds on disconnect
  connectionStateRecovery: {
    maxDisconnectionDuration: 30 * 1000,
    skipMiddlewares: true,
  },
});

io.on('connection', (socket) => {
  registerHandlers(io, socket);
});

// Last-resort safety net. All game state is in-memory, so a single uncaught
// exception (e.g. from a malformed socket payload) would otherwise take down
// the whole process and destroy EVERY active room at once. Log and keep
// running instead — individual handlers are also wrapped (see socket/handlers.js).
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// Periodically reap finished / abandoned rooms so they don't accumulate in
// memory for the lifetime of the process. Clears each reaped room's AFK timer
// too, so no stray timer references a deleted room.
const ROOM_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const sweepTimer = setInterval(() => {
  try {
    const removed = sweepStaleRooms();
    removed.forEach(clearAfkTimer);
    if (removed.length) console.log(`[sweep] removed ${removed.length} stale room(s)`);
  } catch (err) {
    console.error('[sweep] error', err);
  }
}, ROOM_SWEEP_INTERVAL_MS);
sweepTimer.unref?.();  // don't keep the process alive just for the sweep

server.listen(PORT, () => {
  console.log(`Polashi Backend running on port ${PORT}`);
  console.log(`Accepting connections from: ${CLIENT_URL}`);
});
