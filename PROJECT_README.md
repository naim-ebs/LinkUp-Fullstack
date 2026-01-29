# NLive - Complete Video Meeting Application

A production-ready live meeting application with modern backend and beautiful frontend.

## 📁 Project Structure

```
nlive-backend/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── context/     # React contexts
│   │   ├── pages/       # Page components
│   │   └── ...
│   └── package.json
├── src/                 # Node.js backend
│   ├── config/          # Configuration
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── socket/          # Socket.io handlers
│   └── utils/           # Utilities
└── package.json
```

## 🚀 Quick Start

### Backend Setup

1. Install backend dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start backend server:
```bash
npm run dev
```

Backend will run on http://localhost:3000

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start frontend development server:
```bash
npm run dev
```

Frontend will run on http://localhost:5173

### Using the Application

1. Open http://localhost:5173 in your browser
2. Enter your name and room ID (or generate one)
3. Click "Join Meeting" and allow camera/microphone access
4. Share the room ID with others to invite them
5. Enjoy your meeting with video, audio, screen sharing, and chat!

## 🎯 Features

### Backend
- ✅ Express.js REST API
- ✅ Socket.io WebRTC signaling
- ✅ Room management system
- ✅ Multiple participant support
- ✅ Security middleware (Helmet, CORS, Rate limiting)
- ✅ Winston logging
- ✅ Production-ready error handling
- ✅ Graceful shutdown

### Frontend
- ✅ Beautiful modern dark UI
- ✅ Responsive design
- ✅ Real-time video conferencing
- ✅ Screen sharing
- ✅ Live chat
- ✅ Participant management
- ✅ Audio/video controls
- ✅ Connection status indicators

## 🛠️ Technology Stack

### Backend
- Node.js + Express
- Socket.io
- WebRTC signaling
- Winston (logging)
- Helmet (security)
- CORS
- Rate limiting

### Frontend
- React 18
- Vite
- Tailwind CSS
- Socket.io Client
- WebRTC
- Lucide React (icons)

## 📖 Documentation

- [Backend README](README.md)
- [Frontend README](client/README.md)

## 🔧 Development

### Backend Development
```bash
npm run dev  # Start with nodemon
npm start    # Start production mode
```

### Frontend Development
```bash
cd client
npm run dev  # Start Vite dev server
npm run build  # Build for production
```

## 🌐 Production Deployment

### Backend

1. Set environment variables:
```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
```

2. Install dependencies:
```bash
npm install --production
```

3. Start server:
```bash
npm start
```

Or use PM2:
```bash
pm2 start src/server.js --name nlive-backend
```

### Frontend

1. Build for production:
```bash
cd client
npm run build
```

2. Serve the `dist` directory using:
   - Nginx
   - Apache
   - Static hosting (Vercel, Netlify, etc.)

## 📝 API Endpoints

### REST API
- `GET /health` - Health check
- `GET /api/status` - API status
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms` - Create room
- `DELETE /api/rooms/:roomId` - Delete room

### WebSocket Events
- `join-room` - Join meeting room
- `offer/answer` - WebRTC signaling
- `ice-candidate` - ICE candidate exchange
- `toggle-audio/video` - Media controls
- `start/stop-screen-share` - Screen sharing
- `chat-message` - Send/receive messages
- `leave-room` - Leave meeting

## 🔐 Security

- Helmet.js security headers
- CORS protection
- Rate limiting
- Input validation
- Secure WebSocket connections

## 📊 Browser Support

- Chrome/Edge (Recommended)
- Firefox
- Safari
- Opera

Note: WebRTC support required

## 🐛 Troubleshooting

### Connection Issues
1. Ensure backend server is running on port 3000
2. Check CORS settings in backend `.env`
3. Verify firewall allows WebSocket connections

### Camera/Microphone Issues
1. Grant browser permissions
2. Use HTTPS or localhost
3. Check system privacy settings

### STUN/TURN Servers
For production with users behind NAT/firewalls, configure TURN servers in:
- Frontend: `src/context/MeetingContext.jsx`
- Consider services like Twilio, Xirsys, or self-hosted coturn

## 📈 Scaling

For multiple server instances:
1. Add Redis adapter for Socket.io
2. Configure load balancer
3. Use sticky sessions for WebSocket
4. Consider media server (Mediasoup/Janus) for large meetings

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open issues or submit pull requests.

## 💬 Support

For issues and questions, please open an issue on GitHub.
