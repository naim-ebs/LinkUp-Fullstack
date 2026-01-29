const logger = require('../utils/logger');
const roomManager = require('../services/roomManager');

function initializeSocketServer(io) {
  // Middleware for socket authentication (can be extended)
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // Add your authentication logic here
    logger.info(`Socket connection attempt: ${socket.id}`);
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join room
    socket.on('join-room', (data) => {
      const { roomId, userName, audio = true, video = true } = data;

      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Create room if it doesn't exist
      if (!roomManager.getRoom(roomId)) {
        roomManager.createRoom(roomId);
      }

      // Add participant to room
      const result = roomManager.addParticipant(roomId, socket.id, {
        userName: userName || 'Anonymous',
        audio,
        video,
        screenSharing: false
      });

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(roomId);
      socket.roomId = roomId;

      // Get all other participants in the room
      const participants = roomManager.getParticipants(roomId)
        .filter(p => p.id !== socket.id);

      // Notify the new participant of existing participants
      socket.emit('room-joined', {
        roomId,
        participants,
        yourId: socket.id
      });

      // Notify other participants of the new user
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        userName: result.participant.userName,
        audio: result.participant.audio,
        video: result.participant.video
      });

      logger.info(`User ${socket.id} joined room ${roomId}`);
    });

    // WebRTC Signaling: Offer
    socket.on('offer', (data) => {
      const { to, offer, roomId } = data;
      
      socket.to(to).emit('offer', {
        from: socket.id,
        offer,
        roomId
      });

      logger.debug(`Offer sent from ${socket.id} to ${to}`);
    });

    // WebRTC Signaling: Answer
    socket.on('answer', (data) => {
      const { to, answer, roomId } = data;
      
      socket.to(to).emit('answer', {
        from: socket.id,
        answer,
        roomId
      });

      logger.debug(`Answer sent from ${socket.id} to ${to}`);
    });

    // WebRTC Signaling: ICE Candidate
    socket.on('ice-candidate', (data) => {
      const { to, candidate, roomId } = data;
      
      socket.to(to).emit('ice-candidate', {
        from: socket.id,
        candidate,
        roomId
      });

      logger.debug(`ICE candidate sent from ${socket.id} to ${to}`);
    });

    // Toggle audio
    socket.on('toggle-audio', (data) => {
      const { audio } = data;
      
      if (socket.roomId) {
        roomManager.updateParticipant(socket.roomId, socket.id, { audio });
        
        socket.to(socket.roomId).emit('user-audio-toggled', {
          userId: socket.id,
          audio
        });

        logger.info(`User ${socket.id} toggled audio: ${audio}`);
      }
    });

    // Toggle video
    socket.on('toggle-video', (data) => {
      const { video } = data;
      
      if (socket.roomId) {
        roomManager.updateParticipant(socket.roomId, socket.id, { video });
        
        socket.to(socket.roomId).emit('user-video-toggled', {
          userId: socket.id,
          video
        });

        logger.info(`User ${socket.id} toggled video: ${video}`);
      }
    });

    // Start screen sharing
    socket.on('start-screen-share', () => {
      if (socket.roomId) {
        roomManager.updateParticipant(socket.roomId, socket.id, { 
          screenSharing: true 
        });
        
        socket.to(socket.roomId).emit('user-started-screen-share', {
          userId: socket.id
        });

        logger.info(`User ${socket.id} started screen sharing`);
      }
    });

    // Stop screen sharing
    socket.on('stop-screen-share', () => {
      if (socket.roomId) {
        roomManager.updateParticipant(socket.roomId, socket.id, { 
          screenSharing: false 
        });
        
        socket.to(socket.roomId).emit('user-stopped-screen-share', {
          userId: socket.id
        });

        logger.info(`User ${socket.id} stopped screen sharing`);
      }
    });

    // Chat message
    socket.on('chat-message', (data) => {
      const { message } = data;
      
      if (socket.roomId) {
        const participant = roomManager.getParticipants(socket.roomId)
          .find(p => p.id === socket.id);

        socket.to(socket.roomId).emit('chat-message', {
          userId: socket.id,
          userName: participant?.userName || 'Anonymous',
          message,
          timestamp: new Date().toISOString()
        });

        logger.info(`Chat message from ${socket.id} in room ${socket.roomId}`);
      }
    });

    // Leave room
    socket.on('leave-room', () => {
      handleUserLeaving(socket);
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      handleUserLeaving(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Helper function to handle user leaving
  function handleUserLeaving(socket) {
    if (socket.roomId) {
      const roomId = socket.roomId;
      
      roomManager.removeParticipant(roomId, socket.id);
      
      socket.to(roomId).emit('user-left', {
        userId: socket.id
      });

      socket.leave(roomId);
      socket.roomId = null;

      logger.info(`User ${socket.id} left room ${roomId}`);
    }
  }

  return io;
}

module.exports = initializeSocketServer;
