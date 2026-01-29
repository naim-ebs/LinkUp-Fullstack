const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const config = require('../config');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId = null) {
    const id = roomId || uuidv4();
    
    if (this.rooms.has(id)) {
      return { success: false, error: 'Room already exists' };
    }

    this.rooms.set(id, {
      id,
      participants: new Map(),
      createdAt: new Date(),
      lastActivity: new Date()
    });

    logger.info(`Room created: ${id}`);
    return { success: true, roomId: id };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId) {
    const deleted = this.rooms.delete(roomId);
    if (deleted) {
      logger.info(`Room deleted: ${roomId}`);
    }
    return deleted;
  }

  addParticipant(roomId, socketId, participantData) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.participants.size >= config.maxParticipantsPerRoom) {
      return { success: false, error: 'Room is full' };
    }

    const participant = {
      id: socketId,
      ...participantData,
      joinedAt: new Date()
    };

    room.participants.set(socketId, participant);
    room.lastActivity = new Date();

    logger.info(`Participant ${socketId} joined room ${roomId}`);
    return { success: true, participant };
  }

  removeParticipant(roomId, socketId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const removed = room.participants.delete(socketId);
    
    if (removed) {
      logger.info(`Participant ${socketId} left room ${roomId}`);
      room.lastActivity = new Date();

      // Delete room if empty
      if (room.participants.size === 0) {
        this.deleteRoom(roomId);
      }
    }

    return { success: removed };
  }

  getParticipants(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.participants.values()) : [];
  }

  updateParticipant(roomId, socketId, updates) {
    const room = this.rooms.get(roomId);
    
    if (!room || !room.participants.has(socketId)) {
      return { success: false, error: 'Participant not found' };
    }

    const participant = room.participants.get(socketId);
    Object.assign(participant, updates);
    room.lastActivity = new Date();

    return { success: true, participant };
  }

  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      participantCount: room.participants.size,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    }));
  }

  getRoomStats(roomId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    return {
      id: room.id,
      participantCount: room.participants.size,
      maxParticipants: config.maxParticipantsPerRoom,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      participants: Array.from(room.participants.values())
    };
  }
}

module.exports = new RoomManager();
