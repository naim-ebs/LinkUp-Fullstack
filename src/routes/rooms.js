const express = require('express');
const roomManager = require('../services/roomManager');
const logger = require('../utils/logger');

const router = express.Router();

// Get all rooms
router.get('/rooms', (req, res) => {
  try {
    const rooms = roomManager.getAllRooms();
    res.json({ rooms });
  } catch (error) {
    logger.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get specific room details
router.get('/rooms/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const roomStats = roomManager.getRoomStats(roomId);
    
    if (!roomStats) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(roomStats);
  } catch (error) {
    logger.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Create a new room
router.post('/rooms', (req, res) => {
  try {
    const { roomId } = req.body;
    const result = roomManager.createRoom(roomId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json({ roomId: result.roomId });
  } catch (error) {
    logger.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Delete a room
router.delete('/rooms/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const deleted = roomManager.deleteRoom(roomId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    logger.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
