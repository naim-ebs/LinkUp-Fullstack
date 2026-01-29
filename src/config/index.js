require('dotenv').config();

// Parse CORS origins
const parseCorsOrigin = () => {
  const origin = process.env.CORS_ORIGIN;
  if (!origin || origin === '*') return '*';
  
  // If multiple origins, return array
  if (origin.includes(',')) {
    return origin.split(',').map(o => o.trim());
  }
  
  return origin;
};

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: parseCorsOrigin(),
  maxParticipantsPerRoom: parseInt(process.env.MAX_PARTICIPANTS_PER_ROOM) || 10,
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  socketConfig: {
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    cors: {
      origin: parseCorsOrigin(),
      methods: ['GET', 'POST'],
      credentials: true
    }
  }
};
