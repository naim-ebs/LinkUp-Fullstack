const validateRoomId = (req, res, next) => {
  const { roomId } = req.params || req.body;
  
  if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
    return res.status(400).json({ error: 'Valid room ID is required' });
  }
  
  next();
};

const validateUserName = (req, res, next) => {
  const { userName } = req.body;
  
  if (userName && (typeof userName !== 'string' || userName.length > 50)) {
    return res.status(400).json({ error: 'Invalid user name' });
  }
  
  next();
};

module.exports = {
  validateRoomId,
  validateUserName
};
