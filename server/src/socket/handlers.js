module.exports = function registerSocketHandlers(io, socket) {
  // WebRTC Signaling
  socket.on('join-room', ({ sessionId, role }) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined room ${sessionId} as ${role}`);
    
    // Notify others in the room
    socket.to(sessionId).emit('user-joined', { socketId: socket.id, role });
  });

  socket.on('offer', ({ sdp, sessionId }) => {
    socket.to(sessionId).emit('offer', { sdp, senderId: socket.id });
  });

  socket.on('answer', ({ sdp, sessionId }) => {
    socket.to(sessionId).emit('answer', { sdp, senderId: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, sessionId }) => {
    socket.to(sessionId).emit('ice-candidate', { candidate, senderId: socket.id });
  });

  // Transcript Updates
  socket.on('transcript-update', ({ text, isFinal, timestamp, sessionId }) => {
    console.log(`[Transcript - ${isFinal ? 'FINAL' : 'INTERIM'}]: ${text}`);
    // Broadcast for dashboard / other participants
    socket.to(sessionId).emit('transcript-received', { text, isFinal, timestamp, senderId: socket.id });
    
    if (isFinal) {
      // TODO: Save to DB & trigger LLM assessment if needed
    }
  });

  // KYC Signals
  socket.on('kyc-signal', ({ type, data, sessionId }) => {
    console.log(`[KYC Signal - ${type}]:`, data);
    socket.to(sessionId).emit('kyc-signal-update', { type, data, senderId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
};
