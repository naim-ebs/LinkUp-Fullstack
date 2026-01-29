# NLive Backend - Live Meeting Application

A production-ready backend for a live meeting application built with Node.js, Express, WebRTC, and Socket.io.

## Features

- 🎥 **Multi-participant video meetings** - Support for multiple participants per room
- 🎤 **Audio/Video controls** - Toggle audio and video on/off
- 🖥️ **Screen sharing** - Share your screen with other participants
- 💬 **Real-time chat** - Text messaging within meetings
- 🔒 **Security** - Helmet.js security headers, CORS protection, rate limiting
- 📊 **Room management** - Create, join, and manage meeting rooms
- 📝 **Logging** - Winston-based logging system
- ⚡ **Performance** - Compression middleware, optimized for production
- 🔄 **WebRTC signaling** - Full WebRTC signaling server implementation

## Architecture

The application uses:
- **Express.js** for HTTP server and REST API
- **Socket.io** for real-time WebSocket communication
- **WebRTC** for peer-to-peer audio/video streaming
- **Room-based architecture** for managing multiple concurrent meetings

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nlive-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001
MAX_PARTICIPANTS_PER_ROOM=10
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Running the Application

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### REST API

- `GET /health` - Health check endpoint
- `GET /api/status` - API status
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms` - Create a new room
- `DELETE /api/rooms/:roomId` - Delete a room

### Socket.io Events

#### Client → Server

- `join-room` - Join a meeting room
  ```javascript
  socket.emit('join-room', {
    roomId: 'room-123',
    userName: 'John Doe',
    audio: true,
    video: true
  });
  ```

- `offer` - Send WebRTC offer
  ```javascript
  socket.emit('offer', {
    to: 'socket-id',
    offer: rtcOffer,
    roomId: 'room-123'
  });
  ```

- `answer` - Send WebRTC answer
  ```javascript
  socket.emit('answer', {
    to: 'socket-id',
    answer: rtcAnswer,
    roomId: 'room-123'
  });
  ```

- `ice-candidate` - Send ICE candidate
  ```javascript
  socket.emit('ice-candidate', {
    to: 'socket-id',
    candidate: iceCandidate,
    roomId: 'room-123'
  });
  ```

- `toggle-audio` - Toggle audio on/off
  ```javascript
  socket.emit('toggle-audio', { audio: false });
  ```

- `toggle-video` - Toggle video on/off
  ```javascript
  socket.emit('toggle-video', { video: false });
  ```

- `start-screen-share` - Start screen sharing
  ```javascript
  socket.emit('start-screen-share');
  ```

- `stop-screen-share` - Stop screen sharing
  ```javascript
  socket.emit('stop-screen-share');
  ```

- `chat-message` - Send chat message
  ```javascript
  socket.emit('chat-message', { message: 'Hello!' });
  ```

- `leave-room` - Leave the room
  ```javascript
  socket.emit('leave-room');
  ```

#### Server → Client

- `room-joined` - Confirmation of joining room with participant list
- `user-joined` - New user joined the room
- `user-left` - User left the room
- `offer` - Received WebRTC offer
- `answer` - Received WebRTC answer
- `ice-candidate` - Received ICE candidate
- `user-audio-toggled` - User toggled audio
- `user-video-toggled` - User toggled video
- `user-started-screen-share` - User started screen sharing
- `user-stopped-screen-share` - User stopped screen sharing
- `chat-message` - Received chat message
- `error` - Error message

## Project Structure

```
nlive-backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── index.js
│   ├── middleware/      # Express middleware
│   │   └── validation.js
│   ├── routes/          # API routes
│   │   └── rooms.js
│   ├── services/        # Business logic
│   │   └── roomManager.js
│   ├── socket/          # Socket.io handlers
│   │   └── index.js
│   ├── utils/           # Utility functions
│   │   └── logger.js
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── logs/                # Log files
├── .env.example         # Example environment variables
├── .gitignore
├── package.json
└── README.md
```

## WebRTC Flow

1. **Join Room**: Client connects via Socket.io and joins a room
2. **Signal Exchange**: Clients exchange SDP offers/answers through the signaling server
3. **ICE Candidates**: Clients exchange ICE candidates for NAT traversal
4. **Peer Connection**: Direct peer-to-peer connection established for media streams
5. **Media Streaming**: Audio/video streams flow directly between peers

## Security Features

- **Helmet.js** - Sets secure HTTP headers
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents abuse and DDoS attacks
- **Input Validation** - Validates all user inputs
- **Error Handling** - Comprehensive error handling and logging

## Logging

Logs are stored in the `logs/` directory:
- `error.log` - Error-level logs only
- `combined.log` - All logs

In development mode, logs are also output to the console with colors.

## Production Deployment

### Environment Configuration

Set `NODE_ENV=production` and configure appropriate values for:
- `CORS_ORIGIN` - Your frontend domain
- `LOG_LEVEL` - Set to 'warn' or 'error' in production
- `MAX_PARTICIPANTS_PER_ROOM` - Based on your server capacity

### Recommended Deployment Steps

1. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start src/server.js --name nlive-backend
```

2. Set up a reverse proxy (nginx) for SSL/TLS termination

3. Configure firewall rules to allow WebSocket connections

4. Set up monitoring and alerting

5. Configure TURN/STUN servers for better WebRTC connectivity:
   - Consider using services like Twilio, Xirsys, or self-hosted coturn

## Performance Considerations

- **Horizontal Scaling**: For multiple server instances, implement Redis adapter for Socket.io
- **TURN Server**: Required for clients behind restrictive NATs/firewalls
- **Media Server**: For large meetings (>10 participants), consider using a media server like Mediasoup or Janus

## Scaling with Redis

For multi-server deployments, add Redis adapter:

```bash
npm install @socket.io/redis-adapter redis
```

Update socket initialization:
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

## Testing

Run tests (to be implemented):
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
# LinkUp-Fullstack
