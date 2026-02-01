# HTTPS Setup for Development

## Overview
The backend server now supports HTTPS in development mode to allow connections from HTTPS frontend (required for WebRTC on network devices).

## SSL Certificate Generation

Self-signed SSL certificates have been generated for development use. To regenerate them:

```bash
./generate-ssl-cert.sh
```

This creates:
- `ssl/server.key` - Private key
- `ssl/server.cert` - Self-signed certificate

**Note:** These certificates are for development only and should never be used in production.

## How It Works

1. **Backend Server** (`src/server.js`):
   - Checks for SSL certificates in `ssl/` directory
   - Uses HTTPS if certificates exist in development mode
   - Falls back to HTTP if no certificates found
   - Always uses HTTP in production (Apache handles SSL)

2. **Frontend Client** (`client/src/context/SocketContext.jsx`):
   - Automatically detects frontend protocol (HTTP/HTTPS)
   - Connects to backend using same protocol
   - Uses port 3000 for backend in development
   - Uses same origin in production (Apache proxy)

## Accepting Self-Signed Certificates

When accessing the app via HTTPS for the first time:

1. **Chrome/Edge:**
   - Navigate to `https://192.168.20.187:3000` in your browser
   - Click "Advanced" → "Proceed to 192.168.20.187 (unsafe)"
   - This only needs to be done once per browser

2. **Safari:**
   - Navigate to `https://192.168.20.187:3000`
   - Click "Show Details" → "visit this website"
   - Enter your Mac password if prompted

3. **Firefox:**
   - Navigate to `https://192.168.20.187:3000`
   - Click "Advanced" → "Accept the Risk and Continue"

## Running the Application

### Start Backend (with HTTPS)
```bash
npm run dev
# Should show: "Using HTTPS server for development"
# Should show: "HTTPS server listening on port 3000"
```

### Start Frontend
```bash
cd client
npm run dev
```

### Access the Application

**Local machine:**
- HTTP: `http://localhost:5173`
- HTTPS: `https://localhost:5173`

**Network devices:**
- HTTP: `http://192.168.20.187:5173`
- HTTPS: `https://192.168.20.187:5173` (recommended for camera/mic access)

## Troubleshooting

### "Mixed Content" Error
- Ensure backend is running with HTTPS (check terminal logs)
- Accept the self-signed certificate by visiting `https://[YOUR-IP]:3000` first

### "NET::ERR_CERT_AUTHORITY_INVALID"
- This is normal for self-signed certificates
- Click "Advanced" and proceed to accept the certificate

### Backend not using HTTPS
- Check if `ssl/server.key` and `ssl/server.cert` exist
- Run `./generate-ssl-cert.sh` to create them
- Restart the backend server

### Port Already in Use
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Restart backend
npm run dev
```

## Production Deployment

In production, the SSL certificates are managed by Apache/Let's Encrypt, not by Node.js:
- Backend runs on HTTP (port 3000)
- Apache acts as reverse proxy with SSL termination
- Certificates are managed by Certbot/Let's Encrypt
- See `DEPLOYMENT.md` for production setup

## Security Notes

⚠️ **Important:**
- Self-signed certificates are for development ONLY
- Never commit SSL certificates to git (already in .gitignore)
- Use Let's Encrypt for production SSL certificates
- Regenerate certificates if compromised
