const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const initializeSocketServer = require('./socket');

// Create HTTP or HTTPS server based on environment
let server;

// Check if SSL certificates exist for HTTPS
const sslKeyPath = path.join(__dirname, '../ssl/server.key');
const sslCertPath = path.join(__dirname, '../ssl/server.cert');

if (config.nodeEnv === 'development' && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  // Use HTTPS in development if certificates exist
  const httpsOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  };
  server = https.createServer(httpsOptions, app);
  logger.info('Using HTTPS server for development');
} else {
  // Use HTTP
  server = http.createServer(app);
  logger.info('Using HTTP server');
}

// Initialize Socket.io
const io = new Server(server, config.socketConfig);

// Initialize socket handlers
initializeSocketServer(io);

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    io.close(() => {
      logger.info('Socket.io server closed');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
server.listen(config.port, () => {
  const protocol = server instanceof https.Server ? 'HTTPS' : 'HTTP';
  logger.info(`Server running in ${config.nodeEnv} mode`);
  logger.info(`${protocol} server listening on port ${config.port}`);
  logger.info(`WebSocket server ready for connections`);
});

module.exports = server;
