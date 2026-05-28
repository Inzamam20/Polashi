require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { registerHandlers } = require('./socket/handlers');

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

server.listen(PORT, () => {
  console.log(`Polashi Backend running on port ${PORT}`);
  console.log(`Accepting connections from: ${CLIENT_URL}`);
});
