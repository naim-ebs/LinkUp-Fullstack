# NLive Frontend

Modern and beautiful React frontend for the NLive video meeting application.

## 🎨 Features

- **Beautiful Modern UI** - Dark theme with Tailwind CSS
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Video** - WebRTC-powered video conferencing
- **Screen Sharing** - Share your screen with participants
- **Live Chat** - Real-time messaging during meetings
- **Participant Management** - View and manage meeting participants
- **Audio/Video Controls** - Toggle camera and microphone
- **Connection Status** - Real-time connection indicators

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Backend server running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Create .env file
VITE_SERVER_URL=http://localhost:3000
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

## 📦 Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## 🎯 Usage

1. **Join a Meeting:**
   - Enter your name
   - Enter or generate a room ID
   - Click "Join Meeting"
   - Allow camera and microphone access

2. **During Meeting:**
   - Toggle audio/video with bottom controls
   - Share your screen
   - Open chat panel to send messages
   - View participants list
   - Copy room ID to invite others

3. **Leave Meeting:**
   - Click the red phone button to leave

## 🏗️ Project Structure

```
client/
├── src/
│   ├── components/       # Reusable components
│   │   ├── ChatPanel.jsx
│   │   ├── JoinRoom.jsx
│   │   ├── MeetingControls.jsx
│   │   ├── ParticipantsPanel.jsx
│   │   ├── VideoGrid.jsx
│   │   └── VideoTile.jsx
│   ├── context/          # React context providers
│   │   ├── MeetingContext.jsx
│   │   └── SocketContext.jsx
│   ├── pages/            # Page components
│   │   └── MeetingRoom.jsx
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── .env                  # Environment variables
├── tailwind.config.js    # Tailwind configuration
└── vite.config.js        # Vite configuration
```

## 🎨 Design System

### Colors

- **Primary:** Blue tones for interactive elements
- **Dark:** Dark theme background and surfaces
- **Status Colors:** Green (active), Red (inactive/danger)

### Components

- **Buttons:** Primary, secondary, and danger variants
- **Cards:** Glass-morphism effect cards
- **Inputs:** Styled form inputs with focus states
- **Custom Scrollbar:** Themed scrollbar for consistency

## �� Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - WebSocket communication
- **WebRTC** - Peer-to-peer video/audio
- **Lucide React** - Icon library

## 📱 Responsive Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## 🔐 Security

- Requests camera/microphone permissions
- Secure WebSocket connections
- No data stored locally
- All communication encrypted

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Note: WebRTC support required

## ⚡ Performance

- Code splitting for optimal loading
- Lazy loading of components
- Optimized video rendering
- Efficient state management

## 🐛 Troubleshooting

### Camera/Microphone not working
- Check browser permissions
- Ensure HTTPS or localhost
- Try different browser

### Connection issues
- Verify backend server is running
- Check VITE_SERVER_URL in .env
- Check browser console for errors

### Video not displaying
- Check WebRTC browser support
- Verify network connectivity
- Check firewall settings

## 📄 License

MIT
