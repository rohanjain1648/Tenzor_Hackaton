require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const db = require('./db/database');
const registerSocketHandlers = require('./socket/handlers');

const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : [/^http:\/\/localhost:\d+$/];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Routes
app.use('/api/assessments', require('./routes/assessment.routes'));
app.use('/api/sessions', require('./routes/session.routes'));
// app.use('/api/offers', require('./routes/offer.routes'));

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  registerSocketHandlers(io, socket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
